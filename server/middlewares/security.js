/* oxlint-disable no-console */
import crypto from 'crypto';

// --- SICUREZZA: Intestazioni HTTP Protettive & CSP Hardened ---
export const securityHeaders = (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.removeHeader('X-Powered-By');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org https://flagcdn.com; connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://router.project-osrm.org; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
};

// --- SICUREZZA: Rate Limiting Anti-Scraping / Anti-DDoS ---
const rateLimitMap = new Map();
export const rateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const now = Date.now();

    // Bypass strict rate limit for known search engine crawlers to avoid 'Crawl Anomaly'
    if (userAgent.includes('googlebot') || userAgent.includes('bingbot') || userAgent.includes('yandexbot')) {
        return next();
    }
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
        const client = rateLimitMap.get(ip);
        if (now - client.lastReset > 60000) {
            client.count = 1;
            client.lastReset = now;
        } else {
            client.count++;
            // Increased from 120 to 600 to allow normal aggressive but legitimate browsing/crawling
            if (client.count > 600) {
                console.warn(`[Security] Bloccato traffico anomalo (DDoS/Scraping) dall'IP: ${crypto.createHash('sha256').update(ip).digest('hex').substring(0,8)}`);
                return res.status(429).json({ error: 'Troppe richieste. Per favore attendi un minuto.' });
            }
        }
    }
    
    if (Math.random() < 0.01) {
        for (const [key, value] of rateLimitMap.entries()) {
            if (now - value.lastReset > 120000) {
                rateLimitMap.delete(key);
            }
        }
    }
    
    next();
};
