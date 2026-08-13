export function matchProductBySlugOrId(products: any[], targetSlugOrId: string | undefined): any | null {
  if (!targetSlugOrId || !Array.isArray(products) || products.length === 0) return null;

  const cleanTarget = decodeURIComponent(targetSlugOrId).trim();
  if (!cleanTarget) return null;

  const lowerTarget = cleanTarget.toLowerCase();
  const normalizedTarget = lowerTarget.replace(/^-+|-+$/g, '');

  // 1. Exact ID match
  let found = products.find((p: any) => p && p.id === cleanTarget);
  if (found) return found;

  // 2. Case-insensitive ID match
  found = products.find((p: any) => p && p.id && p.id.toLowerCase() === lowerTarget);
  if (found) return found;

  // 3. Exact Slug match
  found = products.find((p: any) => p && p.slug === cleanTarget);
  if (found) return found;

  // 4. Case-insensitive Slug match
  found = products.find((p: any) => p && p.slug && p.slug.toLowerCase() === lowerTarget);
  if (found) return found;

  // 5. Normalized Slug match (ignoring leading/trailing hyphens/slashes)
  found = products.find((p: any) => {
    if (!p || !p.slug) return false;
    const normP = p.slug.toLowerCase().replace(/^-+|-+$/g, '');
    return normP === normalizedTarget;
  });
  if (found) return found;

  // 6. Slugified Product Name match
  found = products.find((p: any) => {
    if (!p || !p.name) return false;
    const nameSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return nameSlug === normalizedTarget;
  });
  if (found) return found;

  // 7. Prefix / Partial Slug match (e.g. "sfx-pack" matching "sfx-pack-1000-")
  found = products.find((p: any) => {
    if (!p) return false;
    const pSlug = (p.slug || '').toLowerCase().replace(/^-+|-+$/g, '');
    const pNameSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (normalizedTarget.length >= 3) {
      if (pSlug.startsWith(normalizedTarget) || normalizedTarget.startsWith(pSlug)) return true;
      if (pNameSlug.startsWith(normalizedTarget) || normalizedTarget.startsWith(pNameSlug)) return true;
    }
    return false;
  });

  return found || null;
}
