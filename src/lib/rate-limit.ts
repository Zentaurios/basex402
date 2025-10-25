/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limitMap.entries()) {
    if (now > entry.resetTime) {
      limitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Rate limit requests by identifier (usually IP address)
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 } // 10 requests per minute default
): RateLimitResult {
  const now = Date.now();
  const entry = limitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window or expired entry
    const resetTime = now + config.windowMs;
    limitMap.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Get rate limit identifier from request
 * Tries x-forwarded-for, x-real-ip, then falls back to anonymous
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get real IP from common headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to anonymous (not ideal but prevents crashes)
  return 'anonymous';
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      }
    }
  );
}
