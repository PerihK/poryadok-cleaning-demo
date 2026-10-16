export function normalizeAddresses(features) {
  const unique = new Map();
  for (const feature of features || []) {
    const p = feature.properties || {};
    if (String(p.countrycode).toUpperCase() !== "RU") continue;
    const street = p.street || (p.type === "street" ? p.name : "");
    const address = [street || p.name, p.housenumber]
      .filter(Boolean)
      .join(", ");
    const city = p.city || p.town || p.village || p.locality || p.county;
    if (!address || !city) continue;
    const region = [...new Set([city, p.state].filter(Boolean))].join(", ");
    const label = [region, address].join(", ");
    if (!unique.has(label)) unique.set(label, { label, address, region });
  }
  return [...unique.values()]
    .sort(
      (a, b) =>
        Number(b.region.startsWith("Санкт-Петербург")) -
        Number(a.region.startsWith("Санкт-Петербург")),
    )
    .slice(0, 6);
}

export function createAddressSearch({ fetchImpl = fetch } = {}) {
  const cache = new Map();
  return async function searchAddress(value, { signal } = {}) {
    const query = String(value)
      .replace(/[\u0000-\u001f]/g, " ")
      .trim();
    if (query.length < 3 || query.length > 200) return [];
    const cached = cache.get(query);
    if (cached && cached.expires > Date.now()) return cached.rows;
    const url = new URL("https://photon.komoot.io/api/");
    url.search = new URLSearchParams({ q: query, limit: "12" }).toString();
    const response = await fetchImpl(url, {
      signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("provider_unavailable");
    const result = await response.json();
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (!Array.isArray(result.features)) throw new Error("invalid_response");
    const rows = normalizeAddresses(result.features);
    if (cache.size >= 50) cache.delete(cache.keys().next().value);
    cache.set(query, { rows, expires: Date.now() + 10 * 60 * 1000 });
    return rows;
  };
}
export const suggestAddresses = createAddressSearch();
