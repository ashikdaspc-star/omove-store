export interface TrafficHit {
  id: string;
  city: string;
  page: string;
  referrer: string;
  device: string;
  timestamp: string;
  rawTime: number;
}

// Get or create unique visitor session ID
export const getVisitorSessionId = (): string => {
  try {
    let vid = sessionStorage.getItem('omove_visitor_id');
    if (!vid) {
      vid = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      sessionStorage.setItem('omove_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'v-' + Date.now();
  }
};

// Record heartbeat ping for active online visitors count
export const sendVisitorHeartbeat = () => {
  try {
    const vid = getVisitorSessionId();
    const now = Date.now();
    const stored = localStorage.getItem('omove_active_visitor_pings');
    const pings: Record<string, number> = stored ? JSON.parse(stored) : {};

    pings[vid] = now;

    // Prune pings older than 3 minutes (180,000 ms)
    const cutoff = now - 180000;
    const activePings: Record<string, number> = {};
    Object.entries(pings).forEach(([id, time]) => {
      if (time > cutoff) activePings[id] = time;
    });

    localStorage.setItem('omove_active_visitor_pings', JSON.stringify(activePings));
  } catch (e) {
    console.error(e);
  }
};

// Count active visitors online right now
export const getActiveVisitorCount = (): number => {
  try {
    const now = Date.now();
    const stored = localStorage.getItem('omove_active_visitor_pings');
    if (!stored) return 1;
    const pings: Record<string, number> = JSON.parse(stored);
    const cutoff = now - 180000;
    const count = Object.values(pings).filter((time) => time > cutoff).length;
    return Math.max(1, count);
  } catch {
    return 1;
  }
};

// Record pageview hit
export const recordPageViewHit = (viewName: string) => {
  try {
    sendVisitorHeartbeat();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    let city = 'Kolkata, WB';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) {
      city = 'Kolkata, WB';
    } else if (tz.includes('London')) {
      city = 'London, UK';
    } else if (tz.includes('New_York') || tz.includes('America')) {
      city = 'New York, US';
    } else {
      city = 'India Visitor';
    }

    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
    const device = isMobile ? 'Mobile Device' : 'Desktop PC';
    
    let referrer = 'Direct URL';
    if (typeof document !== 'undefined' && document.referrer) {
      if (document.referrer.includes('google')) referrer = 'Google Search';
      else if (document.referrer.includes('wa.me')) referrer = 'WhatsApp Share';
      else if (document.referrer.includes('youtube')) referrer = 'YouTube Video';
      else referrer = 'External Link';
    }

    const pageTitle =
      viewName === 'home' ? '/home (Spotlight & Services)' :
      viewName === 'store' ? '/store (Digital License Catalog)' :
      viewName === 'services' ? '/services (Remote PC Support ₹39)' :
      viewName === 'remote-support' ? '/remote-support (AnyDesk Repair)' :
      viewName === 'blog' ? '/blog (WHEA BSOD Repair Guide)' :
      viewName === 'dashboard' ? '/dashboard (Customer Vault)' :
      '/' + viewName;

    const newHit: TrafficHit = {
      id: 'hit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      city,
      page: pageTitle,
      referrer,
      device,
      timestamp: 'Just now',
      rawTime: Date.now()
    };

    const storedLogs = localStorage.getItem('omove_traffic_logs');
    const logs: TrafficHit[] = storedLogs ? JSON.parse(storedLogs) : [];
    const updated = [newHit, ...logs.slice(0, 49)];
    localStorage.setItem('omove_traffic_logs', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
};

// Get stored traffic logs
export const getTrafficLogs = (): TrafficHit[] => {
  try {
    const stored = localStorage.getItem('omove_traffic_logs');
    if (stored) {
      const logs: TrafficHit[] = JSON.parse(stored);
      const now = Date.now();
      return logs.map((log) => {
        const diffSec = Math.floor((now - log.rawTime) / 1000);
        let timeStr = 'Just now';
        if (diffSec >= 60) {
          const mins = Math.floor(diffSec / 60);
          timeStr = `${mins}m ago`;
        } else if (diffSec > 3) {
          timeStr = `${diffSec}s ago`;
        }
        return { ...log, timestamp: timeStr };
      });
    }
  } catch (e) {
    console.error(e);
  }
  return [];
};
