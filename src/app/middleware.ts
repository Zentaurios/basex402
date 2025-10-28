import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

// Rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  mint: { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  metadata: { requests: 200, windowMs: 60 * 1000 }, // 200 requests per minute
  default: { requests: 50, windowMs: 60 * 1000 }, // 50 requests per minute
};

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent.substring(0, 50)}`;
}

function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
  
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + config.windowMs };
  
  if (entry.count >= config.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetAt: entry.resetAt,
  };
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/mint')) return RATE_LIMITS.mint;
  if (pathname.startsWith('/api/metadata')) return RATE_LIMITS.metadata;
  if (pathname.startsWith('/api')) return RATE_LIMITS.api;
  return RATE_LIMITS.default;
}

function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /scrape/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.coinbase.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss: ws:",
      "frame-src 'self' https://*.coinbase.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Allow health checks and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname === '/health'
  ) {
    return NextResponse.next();
  }
  
  // Block known bots on API routes (except metadata for OpenSea)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/metadata')) {
    if (isBot(userAgent)) {
      console.warn(`🤖 Bot blocked: ${userAgent} - ${pathname}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // Get client identifier for rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitConfig = getRateLimitConfig(pathname);
  
  // Check rate limit
  const rateLimitResult = checkRateLimit(clientId, rateLimitConfig);
  
  if (!rateLimitResult.allowed) {
    console.warn(`⚠️ Rate limit exceeded: ${clientId} - ${pathname}`);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rateLimitConfig.requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetAt),
        },
      }
    );
  }
  
  // Validate request size for API routes
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    console.warn(`⚠️ Request too large: ${clientId} - ${contentLength} bytes`);
    return new NextResponse('Payload too large', { status: 413 });
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.requests));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt));
  
  // Add security headers
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};