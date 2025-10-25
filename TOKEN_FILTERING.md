# Token Filtering System 🛡️

## Overview

This system protects users from spam/scam tokens by implementing a three-layer filtering approach:

1. **Token Allowlist** - Curated list of verified tokens
2. **Spam Detection** - Automatic detection of suspicious tokens
3. **User Toggle** - Option to show/hide unverified tokens

## How It Works

### 1. Token Allowlist (`/src/lib/tokens/allowlist.ts`)

Maintains verified token lists for:
- **Base Mainnet**: ETH, USDC, WETH, DAI, cbETH
- **Base Sepolia**: ETH, USDC
- **Solana Mainnet**: SOL, USDC, USDT
- **Solana Devnet**: SOL

Tokens on this list show a **green shield icon** ✅ and are always displayed.

### 2. Spam Detection (`/src/lib/tokens/spam-detection.ts`)

Automatically flags tokens with:
- **Social media links** (t.me, discord.gg, twitter.com)
- **Suspicious URLs** (claim sites, airdrop sites)
- **Unicode lookalike characters** (UЅDС instead of USDC)
- **Excessive length** (symbols > 10 characters)
- **Scam keywords** (claim, airdrop, visit, limited, expires)
- **Multiple separators** (|, *, •) in token names

Detected spam tokens show a **warning icon** ⚠️ and are hidden by default.

### 3. User Interface

#### Wallet Modal (Assets Tab)
- Shows verified tokens first
- Displays badge for verified tokens (🛡️)
- Shows warning for spam tokens (⚠️)
- Toggle button: "Show/Hide X hidden tokens"
- Expandable spam details explaining why a token was flagged

#### Send Tab
- **Only shows verified tokens** in the dropdown
- Prevents accidentally sending spam tokens
- Shows message: "Spam tokens are hidden for your safety"

## Usage Example

```typescript
import { filterTokens, sortTokens } from '@/lib/tokens';

// Filter tokens for Base Sepolia testnet
const filteredTokens = filterTokens(rawTokens, {
  chain: 'ethereum',
  network: 'testnet',
  showUnverified: false, // Hide spam tokens
});

// Sort with verified tokens first
const sortedTokens = sortTokens(filteredTokens);
```

## Example: The Scam Token You Found

```
Token Name: UЅDС | t.me/s/US_CIRCLE | *claim until 17.10.25
```

**Why it's flagged:**
- ❌ Unicode lookalike characters (UЅDС instead of USDC)
- ❌ Telegram link (t.me/s/US_CIRCLE)
- ❌ Scam keyword ("claim")
- ❌ Urgency tactic ("until 17.10.25")
- ❌ Multiple separators (|, *)

**What happens:**
- Hidden by default in wallet
- Cannot be selected in Send tab
- If user clicks "Show", displays with warning
- Expandable details explain each red flag

## Adding New Verified Tokens

To add a new verified token, update `/src/lib/tokens/allowlist.ts`:

```typescript
// Base Mainnet example
export const BASE_MAINNET_TOKENS: Record<string, TokenInfo> = {
  // ... existing tokens ...
  
  // New token
  NEWTOKEN: {
    symbol: 'NEWTOKEN',
    name: 'New Token Name',
    decimals: 18,
    address: '0x1234567890abcdef...',
  },
};
```

## Security Benefits

### ✅ Protects Users From:
- Clicking malicious links in token names
- Attempting to sell/swap fake tokens on phishing sites
- Accidentally sending spam tokens
- Approving dangerous token permissions
- Visual confusion from lookalike tokens

### 🎯 Best Practices:
- **Never** interact with unverified tokens
- **Never** click links in token names
- **Never** try to sell tokens you don't recognize
- **Report** suspicious tokens if you see them

## Technical Details

### Spam Detection Heuristics

1. **Pattern Matching**: Regex patterns for URLs, social links, keywords
2. **Unicode Analysis**: Detects non-ASCII characters that look like ASCII
3. **Length Checks**: Flags excessively long symbols/names
4. **Separator Count**: Unusual number of | * • characters

### Performance

- Filtering happens client-side (instant)
- No API calls required
- Minimal performance impact
- Cached results per user session

## Maintenance

### When to Update Allowlists:
- New popular tokens launch on Base/Solana
- Official tokens from major protocols
- High-volume stablecoins or wrapped assets

### When to Update Spam Detection:
- New scam patterns emerge
- False positives reported by users
- New Unicode attack vectors discovered

## Future Improvements

Potential enhancements:
- [ ] Backend integration with token reputation services
- [ ] User-reported spam database
- [ ] Machine learning spam classifier
- [ ] Token contract verification
- [ ] Integration with CoinGecko/CoinMarketCap for token info
- [ ] Custom user allowlists/blocklists

## Support

If you encounter:
- **False Positives**: Legitimate token marked as spam → Update allowlist
- **False Negatives**: Spam token not detected → Improve spam detection patterns
- **New Scam Patterns**: Report to update detection rules

---

**Remember**: When in doubt, don't interact with unknown tokens! 🚀
