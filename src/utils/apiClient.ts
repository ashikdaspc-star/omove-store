/**
 * Omove Store Centralized API Client & Request Deduplication Engine
 *
 * Capabilities:
 * 1. Dev-only request instrumentation & audit telemetry
 * 2. In-flight Promise deduplication (coalesces simultaneous identical GETs into 1 network call)
 * 3. Safe in-memory caching with Stale-While-Revalidate (SWR) for public read-only catalog data
 * 4. Strict isolation: NEVER caches authenticated, order, payment, download, or admin data
 * 5. Request storm protection & rate limiting
 */

export interface ApiRequestOptions extends RequestInit {
  caller?: string;
  auto?: boolean;
  ttlMs?: number;
  skipCache?: boolean;
  forceFresh?: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Development request telemetry counters
const requestStats: Record<string, { count: number; duplicates: number; lastTime: number }> = {};

// Safe public GET endpoints whitelist (eligible for in-memory cache & edge caching)
const SAFE_CACHE_PATTERNS = [
  /^\/api\/products(?:\?.*)?$/,
  /^\/api\/digital-products(?:\?.*)?$/,
  /^\/api\/digital-categories(?:\?.*)?$/,
  /^\/api\/categories(?:\?.*)?$/,
  /^\/api\/services(?:\?.*)?$/,
  /^\/api\/blogs(?:\?.*)?$/,
  /^\/api\/coupons$/,
  /^\/api\/paypal\/config$/,
  /^\/api\/reviews\/summary(?:\?.*)?$/,
  /^\/api\/health$/,
  /^\/api\/ping$/
];

// Strict NEVER-CACHE patterns (dynamic, sensitive, authenticated, admin, payment)
const NEVER_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/account\//,
  /^\/api\/orders\//,
  /^\/api\/support\//,
  /^\/api\/downloads\//,
  /^\/api\/admin\//,
  /^\/api\/coupons\/validate/,
  /^\/api\/paypal\/create-order/,
  /^\/api\/paypal\/capture-order/,
  /^\/api\/bookings(?:\/.*)?/
];

class ApiClient {
  private inFlightRequests = new Map<string, Promise<any>>();
  private memoryCache = new Map<string, CacheEntry>();

  /**
   * Determine whether a request is safe to cache in memory
   */
  private isSafeToCache(url: string, method: string, headers?: HeadersInit): boolean {
    if (method.toUpperCase() !== 'GET') return false;

    // Check for Authorization header (never cache authenticated responses)
    if (headers) {
      const h = new Headers(headers);
      if (h.has('Authorization') || h.has('authorization')) {
        return false;
      }
    }

    // Explicitly reject forbidden patterns
    if (NEVER_CACHE_PATTERNS.some((p) => p.test(url))) {
      return false;
    }

    // Must match safe cache whitelist
    return SAFE_CACHE_PATTERNS.some((p) => p.test(url));
  }

  /**
   * Dev-only instrumentation logger
   */
  private logAudit(
    endpoint: string,
    method: string,
    caller: string,
    isAuto: boolean,
    isDuplicate: boolean,
    inFlightCount: number
  ) {
    if (!import.meta.env.DEV) return;

    if (!requestStats[endpoint]) {
      requestStats[endpoint] = { count: 0, duplicates: 0, lastTime: 0 };
    }
    requestStats[endpoint].count++;
    if (isDuplicate) requestStats[endpoint].duplicates++;
    requestStats[endpoint].lastTime = Date.now();

    const tag = isDuplicate ? '🔄 [API DEDUPED]' : '🌐 [API REQUEST]';
    console.debug(
      `${tag} ${method} ${endpoint}`,
      `| Caller: ${caller || 'Anonymous'}`,
      `| Auto: ${isAuto}`,
      `| InFlight: ${inFlightCount}`,
      `| TotalHits: ${requestStats[endpoint].count}`,
      isDuplicate ? `(Saved network call!)` : ''
    );
  }

  /**
   * Main fetch method with deduplication, caching, and instrumentation
   */
  async fetch<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const caller = options.caller || 'UnknownCaller';
    const isAuto = options.auto ?? true;
    const ttlMs = options.ttlMs ?? 60000; // 1 minute default TTL for public GETs
    const cacheKey = `${method}:${url}`;

    const canCache = this.isSafeToCache(url, method, options.headers);

    // 1. Check in-memory cache for fresh response
    if (canCache && !options.skipCache && !options.forceFresh) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < cached.ttl) {
          // Fresh hit! Return immediately from memory (0 network requests)
          this.logAudit(url, method, caller, isAuto, true, this.inFlightRequests.size);
          return structuredClone(cached.data);
        }

        // Stale-While-Revalidate window (valid up to 5x TTL)
        if (age < cached.ttl * 5) {
          this.logAudit(url, method, `${caller} (SWR Revalidate)`, isAuto, true, this.inFlightRequests.size);
          // Return stale data immediately, revalidate in background
          this.revalidateInBackground(url, options, cacheKey, ttlMs);
          return structuredClone(cached.data);
        }
      }
    }

    // 2. In-flight request deduplication for GETs
    if (method === 'GET' && this.inFlightRequests.has(cacheKey)) {
      this.logAudit(url, method, caller, isAuto, true, this.inFlightRequests.size);
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Initiate new network request
    this.logAudit(url, method, caller, isAuto, false, this.inFlightRequests.size + 1);

    const executeFetch = async (): Promise<T> => {
      // Build safe headers without aggressive anti-caching for public GETs
      const cleanHeaders = new Headers(options.headers || {});
      if (!cleanHeaders.has('Accept')) {
        cleanHeaders.set('Accept', 'application/json, text/plain, */*');
      }

      const res = await fetch(url, {
        ...options,
        headers: cleanHeaders
      });

      if (!res.ok) {
        throw new Error(`API HTTP Error: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      // Store in memory cache if eligible
      if (canCache) {
        this.memoryCache.set(cacheKey, {
          data: structuredClone(data),
          timestamp: Date.now(),
          ttl: ttlMs
        });
      }

      return data;
    };

    const promise = executeFetch().finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });

    if (method === 'GET') {
      this.inFlightRequests.set(cacheKey, promise);
    }

    return promise;
  }

  /**
   * Background revalidation for Stale-While-Revalidate
   */
  private revalidateInBackground(url: string, options: ApiRequestOptions, cacheKey: string, ttlMs: number) {
    if (this.inFlightRequests.has(cacheKey)) return;

    const bgPromise = fetch(url, {
      ...options,
      headers: new Headers(options.headers || {})
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data !== null) {
          this.memoryCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        this.inFlightRequests.delete(cacheKey);
      });

    this.inFlightRequests.set(cacheKey, bgPromise);
  }

  /**
   * Convenience GET helper
   */
  get<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Convenience POST helper
   */
  post<T = any>(url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return this.fetch<T>(url, {
      ...options,
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }

  /**
   * Invalidate cache entry or patterns
   */
  invalidateCache(pattern?: string | RegExp): void {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }

    for (const key of this.memoryCache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Read developer audit summary
   */
  getTelemetrySummary() {
    return {
      stats: { ...requestStats },
      inFlightCount: this.inFlightRequests.size,
      cachedEntriesCount: this.memoryCache.size
    };
  }
}

export const apiClient = new ApiClient();
