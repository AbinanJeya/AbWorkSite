/**
 * Food Database Service
 * Uses Open Food Facts (V2 API) for text search and barcode lookups.
 * Higher rate limits than Edamam, though data is crowdsourced.
 */

const OFF_BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'AbWork/1.0 (FitAI fitness app; contact: abwork.app@gmail.com)';
const OFF_STATUS = {
    OK: 'ok',
    UNAVAILABLE: 'unavailable',
    ERROR: 'error',
};
const SEARCH_CACHE_TTL_MS = 30000;
const searchCache = new Map();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeSearchText(value) {
    return (value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanSearchQuery(query) {
    let cleanQuery = normalizeSearchText(query);
    const words = cleanQuery.split(' ').filter(Boolean);
    if (words.length > 3) cleanQuery = words.slice(0, 3).join(' ');
    return cleanQuery;
}

function getSearchCacheKey(query, limit) {
    return `${query}::${limit}`;
}

function getOrderedTokenMatchIndex(name, tokens) {
    let cursor = -1;
    for (const token of tokens) {
        const nextIndex = name.indexOf(token, cursor + 1);
        if (nextIndex === -1) return -1;
        cursor = nextIndex;
    }
    return cursor;
}

function getProductRank(product, normalizedQuery, tokens) {
    const rawName = product.product_name_en || product.product_name || '';
    const normalizedName = normalizeSearchText(rawName);
    if (!normalizedName) return null;

    const tokenMatches = tokens.filter(token => normalizedName.includes(token));
    if (tokens.length > 1 && tokenMatches.length < 2) return null;
    if (tokens.length === 1 && tokenMatches.length === 0) return null;

    const hasFullPhrase = normalizedQuery.length > 0 && normalizedName.includes(normalizedQuery);
    const orderedMatchIndex = getOrderedTokenMatchIndex(normalizedName, tokens);
    const hasOrderedTokens = orderedMatchIndex !== -1;
    const hasAllTokens = tokenMatches.length === tokens.length;
    const englishPriority = product.lang === 'en' ? 1 : 0;
    const brandPriority = product.brands ? 1 : 0;

    let tier = 3;
    if (hasFullPhrase) tier = 0;
    else if (hasOrderedTokens) tier = 1;
    else if (hasAllTokens) tier = 2;

    return {
        tier,
        orderedMatchIndex,
        tokenMatches: tokenMatches.length,
        englishPriority,
        brandPriority,
        normalizedName,
    };
}

function getRankPresentation(rank) {
    switch (rank?.tier) {
        case 0:
            return { matchLabel: 'Exact match', matchTone: 'primary' };
        case 1:
            return { matchLabel: 'Recommended', matchTone: 'info' };
        case 2:
            return { matchLabel: 'Token match', matchTone: 'success' };
        default:
            return { matchLabel: null, matchTone: 'muted' };
    }
}

/**
 * Safely parse a fetch response as JSON.
 */
async function safeFetchJson(url, options = {}) {
    const { signal, normalizedQuery } = options;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT },
            signal,
        });

        if (!res.ok) {
            console.warn(`OFF API returned HTTP ${res.status} for query "${normalizedQuery || 'unknown'}": ${url.substring(0, 120)}`);
            return { data: null, httpStatus: res.status, error: 'http' };
        }

        // Check content-type to avoid parsing HTML as JSON
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('json')) {
            const snippet = await res.text().catch(() => '');
            console.warn(`OFF API returned non-JSON for query "${normalizedQuery || 'unknown'}" (${contentType}): ${snippet.substring(0, 100)}`);
            return { data: null, httpStatus: res.status, error: 'non-json' };
        }

        return {
            data: await res.json(),
            httpStatus: res.status,
            error: null,
        };
    } catch (err) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        console.error('Fetch error:', err);
        return { data: null, httpStatus: null, error: 'fetch' };
    }
}

/**
 * Parse a serving string to extract qty, unit, and grams.
 * Examples: "1 scoop (30g)", "250 ml", "1 bar (55g)", "About 55 g"
 */
function parseServing(servingStr) {
    if (!servingStr) return { qty: 100, unit: 'g', gramsPerUnit: 1 };
    
    const str = servingStr.toLowerCase().trim();

    // Pattern: "1 bar (55g)", "2 scoops (60 g)"
    const withParens = str.match(/^([\d.]+)\s*(scoops?|cups?|pieces?|slices?|servings?|tablets?|bars?|packets?|sachets?|tbsp|tsp|oz|fl\s*oz)\s*\(?\s*([\d.]+)\s*g\)?/i);
    if (withParens) {
        const qty = parseFloat(withParens[1]);
        let unit = withParens[2];
        if (unit.startsWith('bar')) unit = 'bar';
        else if (unit.startsWith('scoop')) unit = 'scoop';
        else if (unit.startsWith('piece')) unit = 'piece';
        else if (unit.startsWith('slice')) unit = 'slice';
        else if (unit.startsWith('serving')) unit = 'serving';
        else if (unit.startsWith('cup')) unit = 'cup';
        const totalGrams = parseFloat(withParens[3]);
        return { qty, unit, gramsPerUnit: totalGrams / qty };
    }

    // Pattern: "55g (1 bar)" -- number followed by 'g' anywhere.
    const gramsMatch = str.match(/([\d.]+)\s*g/i);
    if (gramsMatch) {
         return { qty: parseFloat(gramsMatch[1]), unit: 'g', gramsPerUnit: 1 };
    }

    // Pattern: "250 ml" anywhere.
    const mlMatch = str.match(/([\d.]+)\s*ml/i);
    if (mlMatch) {
         return { qty: parseFloat(mlMatch[1]), unit: 'ml', gramsPerUnit: 1 };
    }

    // Fallback: extract the very first number from the string
    const fallbackMatch = str.match(/([\d.]+)/);
    if (fallbackMatch) {
         return { qty: parseFloat(fallbackMatch[1]), unit: 'g', gramsPerUnit: 1 };
    }

    // Ultimate default 
    return { qty: 100, unit: 'g', gramsPerUnit: 1 };
}

/**
 * Builds a FitAI item from Open Food Facts product data.
 */
function buildItem(p, barcodeStr, rank = null) {
    const n = p.nutriments || {};
    const servingInfo = parseServing(p.serving_size || p.quantity);
    const rankPresentation = getRankPresentation(rank);

    return {
        name: p.product_name_en || p.product_name || 'Unknown Product',
        brand: p.brands || 'Generic',
        serving: p.serving_size || p.quantity || '100g',
        calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        protein: Math.round((n.proteins_100g || n.proteins || 0) * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g || n.carbohydrates || 0) * 10) / 10,
        fat: Math.round((n.fat_100g || n.fat || 0) * 10) / 10,
        barcode: barcodeStr || p.code || null,
        source: 'Open Food Facts',
        image: p.image_front_small_url || null,
        servingQty: servingInfo.qty,
        servingUnit: servingInfo.unit,
        gramsPerUnit: servingInfo.gramsPerUnit,
        matchLabel: rankPresentation.matchLabel,
        matchTone: rankPresentation.matchTone,
    };
}

/**
 * Look up a product by barcode via Open Food Facts
 */
export async function lookupBarcode(barcode) {
    try {
        const result = await safeFetchJson(`${OFF_BASE}/api/v2/product/${barcode}.json`);
        if (!result?.data || result.data.status !== 1 || !result.data.product) return null;
        return buildItem(result.data.product, barcode);
    } catch (err) {
        console.error('Barcode lookup failed:', err);
        return null;
    }
}

/**
 * Text search via Open Food Facts legacy full-text search endpoint.
 * OFF's current docs note that v2 search does not support full-text search,
 * so typed food-name queries should continue to use cgi/search.pl.
 */
export async function searchFoodDatabase(query, limit = 10, options = {}) {
    const { signal } = options;
    try {
        const cleanQuery = cleanSearchQuery(query);
        if (!cleanQuery) {
            return { items: [], status: OFF_STATUS.ERROR, httpStatus: null, query: cleanQuery };
        }
        const cacheKey = getSearchCacheKey(cleanQuery, limit);
        const cached = searchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < SEARCH_CACHE_TTL_MS) {
            return { ...cached.response };
        }

        const tokens = cleanQuery.split(' ').filter(Boolean);

        const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&nocache=1&page_size=${limit * 3}&fields=product_name,product_name_en,brands,serving_size,quantity,nutriments,image_front_small_url,code,lang`;
        let result = await safeFetchJson(url, { signal, normalizedQuery: cleanQuery });
        if (result?.httpStatus === 503) {
            await delay(250);
            result = await safeFetchJson(url, { signal, normalizedQuery: cleanQuery });
        }
        if (result?.httpStatus === 503) {
            const response = { items: [], status: OFF_STATUS.UNAVAILABLE, httpStatus: 503, query: cleanQuery };
            searchCache.set(cacheKey, { timestamp: Date.now(), response });
            return response;
        }
        if (!result?.data?.products || result.data.products.length === 0) {
            const response = {
                items: [],
                status: result?.error ? OFF_STATUS.ERROR : OFF_STATUS.OK,
                httpStatus: result?.httpStatus ?? null,
                query: cleanQuery,
            };
            searchCache.set(cacheKey, { timestamp: Date.now(), response });
            return response;
        }

        // Only keep items with a recognizable English name (Latin characters)
        const isEnglish = (name) => /^[a-zA-Z0-9\s\-'&.,%()/!#+:]+$/.test(name);

        const items = result.data.products
            .map(p => {
                const name = p.product_name_en || p.product_name || '';
                if (!(name.trim().length > 0 && p.nutriments && isEnglish(name))) return null;
                const rank = getProductRank(p, cleanQuery, tokens);
                if (!rank) return null;
                return { product: p, rank };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (a.rank.tier !== b.rank.tier) return a.rank.tier - b.rank.tier;
                if (a.rank.orderedMatchIndex !== b.rank.orderedMatchIndex) return a.rank.orderedMatchIndex - b.rank.orderedMatchIndex;
                if (a.rank.tokenMatches !== b.rank.tokenMatches) return b.rank.tokenMatches - a.rank.tokenMatches;
                if (a.rank.englishPriority !== b.rank.englishPriority) return b.rank.englishPriority - a.rank.englishPriority;
                if (a.rank.brandPriority !== b.rank.brandPriority) return b.rank.brandPriority - a.rank.brandPriority;
                return a.rank.normalizedName.localeCompare(b.rank.normalizedName);
            })
            .slice(0, limit)
            .map(({ product, rank }) => buildItem(product, null, rank));

        const response = {
            items,
            status: OFF_STATUS.OK,
            httpStatus: result.httpStatus ?? 200,
            query: cleanQuery,
        };
        searchCache.set(cacheKey, { timestamp: Date.now(), response });
        return response;
    } catch (err) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        console.error('Food database search failed:', err);
        const cleanQuery = cleanSearchQuery(query);
        const response = { items: [], status: OFF_STATUS.ERROR, httpStatus: null, query: cleanQuery };
        if (cleanQuery) {
            searchCache.set(getSearchCacheKey(cleanQuery, limit), { timestamp: Date.now(), response });
        }
        return response;
    }
}
