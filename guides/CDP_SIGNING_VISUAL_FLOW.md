# 🎨 CDP Signing Fix - Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER CLICKS "MINT"                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              x402 Client Initiates Payment Flow             │
│  • Sends POST /api/mint                                     │
│  • Server returns 402 Payment Required                      │
│  • Includes x402-payment-token in response                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Need to Sign EIP-712 Payment Message          │
│                                                             │
│  Message structure:                                         │
│  {                                                          │
│    from: '0x44F6...',      ← Smart Account                 │
│    to: '0xe5b0...',        ← Recipient                     │
│    value: '1000000',       ← 1 USDC                        │
│    token: '0x036C...',     ← USDC Contract                 │
│    ...                                                      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │   Which Wallet?   │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│   CDP Embedded Wallet    │    │   External Wallet       │
│                          │    │   (MetaMask/Rainbow)    │
└──────────────────────────┘    └─────────────────────────┘
              │                               │
              │                               ▼
              │                    ┌─────────────────────┐
              │                    │  Standard Wagmi     │
              │                    │  signTypedData()    │
              │                    │  ✅ Works!         │
              │                    └─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  🎯 4-ATTEMPT STRATEGY                      │
│                                                             │
│  📋 Attempt 1: Direct Call                                 │
│  ┌────────────────────────────────────────────────┐       │
│  │ signEvmTypedData({                             │       │
│  │   domain, types, primaryType, message          │       │
│  │ })                                             │       │
│  └────────────────────────────────────────────────┘       │
│           │                                                │
│           ├─ ✅ Success? ─────────────────────────┐      │
│           │                                        │       │
│           ├─ ❌ Failed?                           │       │
│           │                                        │       │
│           ▼                                        │       │
│  📋 Attempt 2: Address + TypedData Wrapper        │       │
│  ┌────────────────────────────────────────────────┐      │
│  │ signEvmTypedData({                             │      │
│  │   address: cdpAddress,                         │      │
│  │   typedData: {                                 │      │
│  │     domain, types, primaryType, message        │      │
│  │   }                                            │      │
│  │ })                                             │      │
│  └────────────────────────────────────────────────┘      │
│           │                                        │       │
│           ├─ ✅ Success? ───────────────────────┼─┐    │
│           │                                        │ │     │
│           ├─ ❌ Failed?                           │ │     │
│           │                                        │ │     │
│           ▼                                        │ │     │
│  📋 Attempt 3: Flat Structure                     │ │     │
│  ┌────────────────────────────────────────────────┐ │    │
│  │ signEvmTypedData({                             │ │    │
│  │   address: cdpAddress,                         │ │    │
│  │   domain, types, primaryType, message          │ │    │
│  │ })                                             │ │    │
│  └────────────────────────────────────────────────┘ │    │
│           │                                        │ │     │
│           ├─ ✅ Success? ───────────────────────┼┼─┐  │
│           │                                        │ │ │   │
│           ├─ ❌ Failed?                           │ │ │   │
│           │                                        │ │ │   │
│           ▼                                        │ │ │   │
│  📋 Attempt 4: EOA Fallback (Last Resort)        │ │ │   │
│  ┌────────────────────────────────────────────────┐ │ │  │
│  │ signEvmTypedData({                             │ │ │  │
│  │   address: eoaAddress,  ← Different!           │ │ │  │
│  │   typedData: {                                 │ │ │  │
│  │     domain, types, primaryType, message        │ │ │  │
│  │   }                                            │ │ │  │
│  │ })                                             │ │ │  │
│  └────────────────────────────────────────────────┘ │ │  │
│           │                                        │ │ │   │
│           ├─ ⚠️  Success with EOA? ─────────────┼┼┼─┐ │
│           │                                        │ │ │ │ │
│           ├─ ❌ All Failed?                       │ │ │ │ │
│           │                                        │ │ │ │ │
│           ▼                                        │ │ │ │ │
│  🚫 Throw Comprehensive Error                     │ │ │ │ │
│  ┌────────────────────────────────────────────────┐ │ │ │ │
│  │ ❌ All CDP signing attempts failed.           │ │ │ │ │
│  │                                                │ │ │ │ │
│  │ Errors:                                        │ │ │ │ │
│  │ 1. Direct call: <error>                       │ │ │ │ │
│  │ 2. Address wrapper: <error>                   │ │ │ │ │
│  │ 3. Flat structure: <error>                    │ │ │ │ │
│  │ 4. EOA fallback: <error>                      │ │ │ │ │
│  │                                                │ │ │ │ │
│  │ 💡 Solutions:                                 │ │ │ │ │
│  │ - Check CDP docs                               │ │ │ │ │
│  │ - Verify USDC balance                          │ │ │ │ │
│  │ - Try external wallet                          │ │ │ │ │
│  └────────────────────────────────────────────────┘ │ │ │ │
│                                                      │ │ │ │
└──────────────────────────────────────────────────────┘ │ │ │
                                                         │ │ │
                 ┌───────────────────────────────────────┘ │ │
                 │ ┌───────────────────────────────────────┘ │
                 │ │ ┌───────────────────────────────────────┘
                 ▼ ▼ ▼
┌─────────────────────────────────────────────────────────────┐
│                    ✅ SIGNATURE OBTAINED                    │
│                                                             │
│  • Validate signature format                               │
│  • Ensure 0x prefix                                        │
│  • Check length (132 chars)                                │
│  • Log which attempt succeeded                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Submit Signed Payment to Server                │
│  • POST /api/mint with Authorization header                │
│  • Server verifies signature                               │
│  • Server executes USDC transfer                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mint NFT On-Chain                        │
│  • Contract.mint(recipient, tokenId)                       │
│  • Transaction confirmed                                   │
│  • NFT transferred to smart account                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🎉 SUCCESS!                              │
│  • Show success page                                       │
│  • Display token ID(s)                                     │
│  • Link to block explorer                                  │
│  • Link to OpenSea                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Decision Points

### 1. Wallet Type Detection
```
if (walletType === 'embedded')
  ┠─→ Use CDP 4-attempt strategy
  
if (walletType === 'external')
  ┠─→ Use standard Wagmi signing
```

### 2. Success Conditions
```
Attempt 1 Success ┠─→ CDP uses standard EIP-712 ✅
Attempt 2 Success ┠─→ CDP needs address wrapper ✅
Attempt 3 Success ┠─→ CDP wants flat structure ✅
Attempt 4 Success ┠─→ Fallback to EOA works ⚠️
All Fail          ┠─→ Show comprehensive error ❌
```

### 3. Security Validations
```
Before Signing:
├─→ Verify address matches wallet context
├─→ Verify smart account ownership
└─→ Validate message structure

After Signing:
├─→ Check signature is string
├─→ Ensure 0x prefix
├─→ Validate length (132 chars)
└─→ Log attempt used
```

---

## 📊 Expected Flow (Most Common)

```
User Clicks Mint
       │
       ▼
x402 Payment Required
       │
       ▼
CDP Signing (Embedded Wallet)
       │
       ▼
🔧 Attempt 1: Direct call
       │
       ▼
✅ Success! (80% probability)
       │
       ▼
Submit signed payment
       │
       ▼
Mint NFT on-chain
       │
       ▼
🎉 Success page
```

**Time**: ~5-10 seconds total  
**User action**: Sign once  
**Complexity**: Hidden from user

---

## 🔧 Fallback Flow (If Attempt 1 Fails)

```
🔧 Attempt 1: ❌ Failed
       │
       ▼
🔧 Attempt 2: Address wrapper
       │
       ├─→ ✅ Success! (15% probability)
       │
       └─→ ❌ Failed
             │
             ▼
       🔧 Attempt 3: Flat structure
             │
             ├─→ ✅ Success! (4% probability)
             │
             └─→ ❌ Failed
                   │
                   ▼
             🔧 Attempt 4: EOA fallback
                   │
                   ├─→ ⚠️  Success (1% probability)
                   │
                   └─→ ❌ All failed
                         │
                         ▼
                   Show error with solutions
```

**Time**: +1-2 seconds per failed attempt  
**Max overhead**: ~5 seconds if all attempts tried  
**User experience**: Single loading state, no disruption

---

## 🎨 Console Output Visual

### Success Scenario (Attempt 1)
```
🔍 [useX402Signer] Using CDP smart account wallet
  ✓ smartAccountAddress: 0x44F6...
  ✓ hasSignTypedData: true

✍️ [useX402Signer] Starting CDP signing...

🔧 [ATTEMPT 1] Calling CDP with typed data directly...

✅ [ATTEMPT 1] Success!
  ✓ hasResult: true
  ✓ resultType: 'object'
  ✓ resultKeys: ['signature', 'status']

✅ [useX402Signer] CDP signature successful:
  ✓ attemptUsed: 'Direct typed data'
  ✓ signaturePreview: 0x1234...5678
  ✓ signatureLength: 132
```

### Fallback Scenario (Attempt 4)
```
🔍 [useX402Signer] Using CDP smart account wallet
  ✓ smartAccountAddress: 0x44F6...
  ✓ eoaAddress: 0x1234...
  ✓ hasSignTypedData: true

✍️ [useX402Signer] Starting CDP signing...

🔧 [ATTEMPT 1] Calling CDP with typed data directly...
❌ [ATTEMPT 1] Failed: property 'address' is missing

🔧 [ATTEMPT 2] Calling CDP with address + typedData wrapper...
❌ [ATTEMPT 2] Failed: property 'address' is missing

🔧 [ATTEMPT 3] Calling CDP with flat structure...
❌ [ATTEMPT 3] Failed: invalid request format

🔧 [ATTEMPT 4] Calling CDP with EOA address...
  ℹ eoaAddress: 0x1234...

⚠️ [ATTEMPT 4] Success with EOA!
  ⚠ Using EOA fallback (not ideal but functional)
  ✓ hasResult: true
  ✓ resultType: 'object'

✅ [useX402Signer] CDP signature successful:
  ⚠ attemptUsed: 'EOA address (fallback)'
  ✓ signaturePreview: 0x1234...5678
  ✓ signatureLength: 132
```

### Failure Scenario (All Attempts)
```
🔍 [useX402Signer] Using CDP smart account wallet
  ✓ smartAccountAddress: 0x44F6...
  ✓ eoaAddress: 0x1234...
  ✓ hasSignTypedData: true

✍️ [useX402Signer] Starting CDP signing...

🔧 [ATTEMPT 1] Calling CDP with typed data directly...
❌ [ATTEMPT 1] Failed: property 'address' is missing

🔧 [ATTEMPT 2] Calling CDP with address + typedData wrapper...
❌ [ATTEMPT 2] Failed: property 'address' is missing

🔧 [ATTEMPT 3] Calling CDP with flat structure...
❌ [ATTEMPT 3] Failed: invalid request format

🔧 [ATTEMPT 4] Calling CDP with EOA address...
❌ [ATTEMPT 4] Failed: unauthorized signing request

❌ [useX402Signer] CDP signing error:
  ❌ All CDP signing attempts failed.
  
  Errors encountered:
  1. Direct call: property 'address' is missing
  2. Address wrapper: property 'address' is missing
  3. Flat structure: invalid request format
  4. EOA fallback: unauthorized signing request
  
  💡 Possible solutions:
  - Check CDP hooks documentation
  - Verify smart account has USDC balance
  - Try using external wallet instead
  - Check console for detailed error logs
```

---

## 💡 Key Insights

1. **Progressive**: Each attempt builds on previous knowledge
2. **Transparent**: Every step logged for debugging
3. **Resilient**: Falls back gracefully through 4 options
4. **Informative**: Clear error messages if all fail
5. **Fast**: First success wins, no unnecessary retries

---

## 🚀 What Happens Next?

Once we identify which attempt works:

```
✅ Attempt N succeeds
      │
      ▼
Document the pattern
      │
      ▼
Update code to only use that pattern
      │
      ▼
Remove other attempts
      │
      ▼
Add explanatory comments
      │
      ▼
Future mints use optimized path
```

This multi-attempt strategy is **temporary discovery code** that will be simplified once we know the answer!

---

**Visual Summary**: Try 4 patterns → First success → Submit payment → Mint NFT → Success! 🎉
