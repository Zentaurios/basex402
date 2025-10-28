/**
 * Rate Limiter for NFT Minting
 * Prevents abuse by limiting mint requests per IP and per wallet
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory stores (use Redis/Upstash for production with multiple servers)
const ipLimitStore = new Map<string, RateLimitEntry>();
const walletLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMITS = {
  // IP-based limits (prevents spam from single source)
  IP: {
    maxRequests: 10, // 10 requests per window
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Wallet-based limits (prevents abuse from single wallet)
  WALLET: {
    maxRequests: 5, // 5 mints per window
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Successful mint limits (stricter after payment)
  SUCCESS: {
    maxRequests: 3, // 3 successful mints per window
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  // IP-based successful mint limit (prevents multi-wallet bypass)
  IP_SUCCESS: {
    maxRequests: 10, // Max 10 successful mints per IP per 24h (any wallet)
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  }
};

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Check rate limit for a given key and store
 */
function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(key);
  
  // No entry or expired - create new
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime
    };
  }
  
  // Entry exists and not expired
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count
  entry.count++;
  store.set(key, entry);
  
  return {
    allowed: true,
    remainingRequests: maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Check if a mint request should be allowed
 */
export function checkMintRateLimit(
  ip: string,
  walletAddress?: string
): {
  allowed: boolean;
  reason?: string;
  resetTime?: number;
  remainingRequests?: number;
} {
  // Check IP-based rate limit
  const ipCheck = checkRateLimit(
    ipLimitStore,
    ip,
    RATE_LIMITS.IP.maxRequests,
    RATE_LIMITS.IP.windowMs
  );
  
  if (!ipCheck.allowed) {
    const resetDate = new Date(ipCheck.resetTime);
    return {
      allowed: false,
      reason: `Too many requests from this IP. Try again after ${resetDate.toLocaleTimeString()}.`,
      resetTime: ipCheck.resetTime,
      remainingRequests: 0
    };
  }
  
  // Check wallet-based rate limit if wallet provided
  if (walletAddress) {
    const walletKey = walletAddress.toLowerCase();
    const walletCheck = checkRateLimit(
      walletLimitStore,
      walletKey,
      RATE_LIMITS.WALLET.maxRequests,
      RATE_LIMITS.WALLET.windowMs
    );
    
    if (!walletCheck.allowed) {
      const resetDate = new Date(walletCheck.resetTime);
      return {
        allowed: false,
        reason: `Too many mint attempts from this wallet. Try again after ${resetDate.toLocaleTimeString()}.`,
        resetTime: walletCheck.resetTime,
        remainingRequests: 0
      };
    }
    
    return {
      allowed: true,
      remainingRequests: Math.min(ipCheck.remainingRequests, walletCheck.remainingRequests),
      resetTime: Math.max(ipCheck.resetTime, walletCheck.resetTime)
    };
  }
  
  return {
    allowed: true,
    remainingRequests: ipCheck.remainingRequests,
    resetTime: ipCheck.resetTime
  };
}

/**
 * Track successful mint for stricter rate limiting
 * Also tracks IP-based successful mints to prevent multi-wallet bypass
 */
export function trackSuccessfulMint(walletAddress: string, ip?: string): void {
  const walletKey = `success:${walletAddress.toLowerCase()}`;
  const now = Date.now();
  const entry = walletLimitStore.get(walletKey);
  
  if (!entry || now > entry.resetTime) {
    walletLimitStore.set(walletKey, {
      count: 1,
      resetTime: now + RATE_LIMITS.SUCCESS.windowMs
    });
  } else {
    entry.count++;
    walletLimitStore.set(walletKey, entry);
  }
  
  // Also track IP-based successful mints
  if (ip) {
    const ipSuccessKey = `ip-success:${ip}`;
    const ipEntry = ipLimitStore.get(ipSuccessKey);
    
    if (!ipEntry || now > ipEntry.resetTime) {
      ipLimitStore.set(ipSuccessKey, {
        count: 1,
        resetTime: now + RATE_LIMITS.IP_SUCCESS.windowMs
      });
    } else {
      ipEntry.count++;
      ipLimitStore.set(ipSuccessKey, ipEntry);
    }
  }
}

/**
 * Check if wallet has exceeded successful mint limit
 * Also checks IP-based successful mint limit to prevent multi-wallet bypass
 * This only checks, does NOT increment
 */
export function checkSuccessfulMintLimit(
  walletAddress: string,
  ip?: string
): {
  allowed: boolean;
  reason?: string;
  resetTime?: number;
} {
  const walletKey = `success:${walletAddress.toLowerCase()}`;
  const now = Date.now();
  const entry = walletLimitStore.get(walletKey);
  
  // Check wallet limit
  if (entry && now <= entry.resetTime) {
    if (entry.count >= RATE_LIMITS.SUCCESS.maxRequests) {
      const resetDate = new Date(entry.resetTime);
      return {
        allowed: false,
        reason: `Maximum mints per 24 hours reached for this wallet. Try again after ${resetDate.toLocaleString()}.`,
        resetTime: entry.resetTime
      };
    }
  }
  
  // Check IP-based successful mint limit (prevents multi-wallet bypass)
  if (ip) {
    const ipSuccessKey = `ip-success:${ip}`;
    const ipEntry = ipLimitStore.get(ipSuccessKey);
    
    if (ipEntry && now <= ipEntry.resetTime) {
      if (ipEntry.count >= RATE_LIMITS.IP_SUCCESS.maxRequests) {
        const resetDate = new Date(ipEntry.resetTime);
        return {
          allowed: false,
          reason: `Maximum mints per 24 hours reached from this IP address. Try again after ${resetDate.toLocaleString()}.`,
          resetTime: ipEntry.resetTime
        };
      }
    }
  }
  
  return { allowed: true };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of ipLimitStore.entries()) {
    if (now > entry.resetTime) {
      ipLimitStore.delete(key);
    }
  }
  
  for (const [key, entry] of walletLimitStore.entries()) {
    if (now > entry.resetTime) {
      walletLimitStore.delete(key);
    }
  }
}

/**
 * Reset rate limits for a specific wallet (admin/testing only)
 */
export function resetWalletRateLimits(walletAddress: string): void {
  const walletKey = walletAddress.toLowerCase();
  const successKey = `success:${walletKey}`;
  
  walletLimitStore.delete(walletKey);
  walletLimitStore.delete(successKey);
  
  console.log(`🗑️ Rate limits reset for wallet: ${walletAddress}`);
}

/**
 * Reset all rate limits (admin/testing only)
 */
export function resetAllRateLimits(): void {
  ipLimitStore.clear();
  walletLimitStore.clear();
  console.log('🗑️ All rate limits reset');
}

// Clean up every 10 minutes
setInterval(cleanupExpiredEntries, 10 * 60 * 1000);

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remainingRequests: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': RATE_LIMITS.WALLET.maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, remainingRequests).toString(),
    'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
  };
}
