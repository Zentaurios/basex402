# NFT Mint Rate Limiting

This implements comprehensive rate limiting for the NFT minting API to prevent abuse and ensure fair access.

## Rate Limits

### 1. IP-Based Limiting
- **Limit**: 10 requests per hour
- **Purpose**: Prevents spam from a single source
- **Scope**: All mint attempts from the same IP

### 2. Wallet-Based Limiting
- **Limit**: 5 mint attempts per hour
- **Purpose**: Prevents excessive attempts from single wallet
- **Scope**: All mint attempts from the same wallet address

### 3. Successful Mint Limiting (Strictest)
- **Limit**: 3 successful mints per 24 hours
- **Purpose**: Prevents hoarding and ensures fair distribution
- **Scope**: Only counts successful mints with payment

## Implementation Details

### Request Flow
1. Request arrives at `/api/mint`
2. Extract IP address and wallet address
3. Check IP rate limit (10/hour)
4. Check wallet attempt limit (5/hour)
5. Check successful mint limit (3/24hrs)
6. Process x402 payment
7. Mint NFT on success
8. Track successful mint
9. Return response with rate limit headers

### Response Headers
All responses include rate limit information:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1234567890
```

### Error Responses

#### 429 Too Many Requests (Rate Limit)
```json
{
  "success": false,
  "error": {
    "message": "Too many requests from this IP. Try again after 2:30 PM.",
    "code": "RATE_LIMIT_EXCEEDED",
    "resetTime": 1234567890000
  }
}
```

#### 429 Too Many Requests (Mint Limit)
```json
{
  "success": false,
  "error": {
    "message": "Maximum mints per 24 hours reached. Try again after Jan 1, 2025, 2:30 PM.",
    "code": "MINT_LIMIT_EXCEEDED", 
    "resetTime": 1234567890000
  }
}
```

## Storage

Currently uses **in-memory storage** (Map) which:
- ✅ Works for single-server deployments
- ✅ Zero external dependencies
- ✅ Automatic cleanup every 10 minutes
- ❌ Resets on server restart
- ❌ Doesn't work across multiple server instances

### Production Upgrade Path

For production with multiple servers, upgrade to **Redis/Upstash**:

```typescript
// Install: npm install @upstash/redis

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Update checkRateLimit to use Redis
async function checkRateLimit(key: string, max: number, window: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, Math.floor(window / 1000));
  }
  return current <= max;
}
```

## Security Benefits

1. **Prevents Spam**: IP limiting stops automated abuse
2. **Fair Distribution**: Successful mint limits prevent hoarding
3. **Cost Protection**: Limits server costs from excessive requests
4. **Network Protection**: Reduces blockchain RPC load
5. **Payment Protection**: Prevents payment processing abuse

## Testing Rate Limits

```bash
# Test IP rate limit (should block after 10 requests)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/mint \
    -H "Content-Type: application/json" \
    -d '{"recipientWallet":"0x...","paymentMethod":"email","quantity":1}'
done

# Test wallet rate limit (should block after 5 attempts)
# Use same wallet in multiple requests

# Test successful mint limit (should block after 3 mints)
# Complete 3 successful mints with payment within 24 hours
```

## Monitoring

Check rate limit logs in server output:
```
📍 Request from IP: 192.168.1.1
⚠️ Rate limit exceeded: Too many requests from this IP. Try again after 2:30 PM.
📋 Successful mint tracked for rate limiting
```

## Configuration

Edit limits in `/src/lib/rate-limit/mint-rate-limiter.ts`:

```typescript
const RATE_LIMITS = {
  IP: {
    maxRequests: 10,    // Adjust as needed
    windowMs: 60 * 60 * 1000,
  },
  WALLET: {
    maxRequests: 5,     // Adjust as needed
    windowMs: 60 * 60 * 1000,
  },
  SUCCESS: {
    maxRequests: 3,     // Adjust as needed
    windowMs: 24 * 60 * 60 * 1000,
  }
};
```

## Bypassing Rate Limits (Admin)

For admin/testing purposes, you can temporarily disable:

```typescript
// In mint route.ts, comment out rate limit checks:
// const rateLimitCheck = checkMintRateLimit(clientIp, mintRequest.recipientWallet);
// if (!rateLimitCheck.allowed) { ... }
```

⚠️ **Never deploy with rate limiting disabled!**
