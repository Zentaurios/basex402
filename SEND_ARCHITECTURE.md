# Send Feature - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                              │
│                    /components/wallet/WalletDropdown.tsx                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼────────┐ ┌─────▼──────┐ ┌───────▼────────┐
            │  Assets Tab    │ │  NFTs Tab  │ │  Send Tab  ⭐  │
            │  (Balances)    │ │  (Future)  │ │ /SendTab.tsx   │
            └────────────────┘ └────────────┘ └────────────────┘
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    │                  │                  │
                            ┌───────▼───────┐ ┌────────▼────────┐ ┌─────▼──────┐
                            │ Token Select  │ │ Recipient Input │ │Amount Input│
                            │ (Dropdown)    │ │ (Validated)     │ │(with MAX)  │
                            └───────────────┘ └─────────────────┘ └────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │ Confirmation     │
                                            │ Screen          │
                                            └──────────────────┘
                                                       │
                    ┌──────────────────────────────────┼──────────────────────┐
                    │                                  │                      │
            ┌───────▼────────┐               ┌─────────▼────────┐  ┌─────────▼────────┐
            │  Send Success  │               │  Send Loading    │  │   Send Error     │
            │ (with explorer)│               │  (spinner)       │  │  (with retry)    │
            └────────────────┘               └──────────────────┘  └──────────────────┘

═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVER ACTIONS (Next.js)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
        ┌───────────▼──────────────┐      ┌───────────▼──────────────┐
        │ send-transaction.ts      │      │ send-solana-transaction.ts│
        │ (EVM / Base)             │      │ (Solana)                  │
        └───────────────────────────┘      └───────────────────────────┘
                    │                                   │
        ┌───────────┼───────────┐         ┌────────────┼───────────┐
        │           │           │         │            │           │
    ┌───▼───┐   ┌──▼───┐   ┌──▼───┐ ┌───▼───┐   ┌────▼────┐  ┌──▼────┐
    │Native │   │ERC-20│   │Parse │ │Native │   │SPL Token│  │Parse  │
    │  ETH  │   │Token │   │Amount│ │  SOL  │   │ Token   │  │Amount │
    └───┬───┘   └──┬───┘   └──┬───┘ └───┬───┘   └────┬────┘  └──┬────┘
        │          │          │         │            │          │
        └──────────┴──────────┤         └────────────┴──────────┤
                              │                                  │
                    ┌─────────▼────────┐              ┌─────────▼────────┐
                    │ cdp.evm.send     │              │ cdp.solana.send  │
                    │ Transaction()    │              │ Transaction()    │
                    └──────────────────┘              └──────────────────┘

═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                  COINBASE DEVELOPER PLATFORM (CDP)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
        ┌───────────▼──────────────┐      ┌───────────▼──────────────┐
        │   EVM Smart Wallet       │      │   Solana Wallet          │
        │   (Base Network)         │      │   (Solana Network)       │
        └───────────────────────────┘      └───────────────────────────┘
                    │                                   │
        ┌───────────┼───────────┐         ┌────────────┼────────────┐
        │           │           │         │            │            │
    ┌───▼───┐   ┌──▼───┐   ┌──▼───┐ ┌───▼───┐   ┌────▼────┐  ┌───▼───┐
    │Smart  │   │Sign  │   │Gas   │ │Wallet │   │  Sign   │  │ Fee   │
    │Account│   │ Tx   │   │Sponsor│ │Account│   │   Tx    │  │Deduct │
    └───┬───┘   └──┬───┘   └──┬───┘ └───┬───┘   └────┬────┘  └───┬───┘
        │          │          │         │            │           │
        └──────────┴──────────┤         └────────────┴───────────┤
                              │                                  │
                    ┌─────────▼────────┐              ┌─────────▼────────┐
                    │  Base Blockchain │              │ Solana Blockchain│
                    │  (Settlement)    │              │  (Settlement)    │
                    └──────────────────┘              └──────────────────┘

═══════════════════════════════════════════════════════════════════════════════


                        TRANSACTION FLOW COMPARISON

┌────────────────────────────────────┬────────────────────────────────────┐
│         EVM (Base) - GASLESS!      │      Solana - Fee Required         │
├────────────────────────────────────┼────────────────────────────────────┤
│ 1. User enters amount              │ 1. User enters amount              │
│ 2. User confirms                   │ 2. User confirms                   │
│ 3. Parse amount to wei/units       │ 3. Parse amount to lamports        │
│ 4. Create transaction data         │ 4. Create transaction instruction  │
│ 5. Send to CDP Smart Wallet        │ 5. Serialize transaction           │
│ 6. CDP sponsors gas ✨              │ 6. Send to CDP Solana Wallet       │
│ 7. Transaction signed              │ 7. Deduct SOL fee from user        │
│ 8. Broadcast to Base               │ 8. Transaction signed              │
│ 9. Wait for confirmation           │ 9. Broadcast to Solana             │
│ 10. Return tx hash                 │ 10. Wait for confirmation          │
│ 11. Show success ✅                 │ 11. Return signature               │
│                                    │ 12. Show success ✅                 │
│ Cost to User: 0 ETH! 🎉            │ Cost to User: ~0.000005 SOL        │
└────────────────────────────────────┴────────────────────────────────────┘


                              STATE MACHINE

                             ┌──────────┐
                             │   IDLE   │ ← Initial state
                             └─────┬────┘
                                   │ User clicks Send
                                   ▼
                           ┌───────────────┐
                           │  CONFIRMING   │ ← Review details
                           └───────┬───────┘
                      Cancel ◄─────┼─────► Confirm
                      │            ▼       │
                      │    ┌──────────────┐│
                      │    │   SENDING    ││ ← In progress
                      │    └──────┬───────┘│
                      │           │        │
                      │    ┌──────┴──────┐ │
                      │    │   Success?  │ │
                      │    └──────┬──────┘ │
                      │           │        │
                      │     ┌─────┴─────┐  │
                      │     │ Yes │ No  │  │
                      │     │     │     │  │
                      │     ▼     ▼     │  │
                      │ ┌───────┐ ┌─────▼──┐
                      └►│SUCCESS│ │ ERROR  │
                        └───┬───┘ └───┬────┘
                            │         │
                            │         │ Try Again
                            │         │
                            └─────────┴─────► Back to IDLE


                          VALIDATION PIPELINE

    User Input
        │
        ▼
    ┌─────────────────┐
    │ Address Format  │ ← EVM: 0x + 40 hex chars
    │   Validation    │ ← Solana: Valid base58
    └────────┬────────┘
             │ Valid
             ▼
    ┌─────────────────┐
    │ Amount Format   │ ← Must be numeric
    │   Validation    │ ← Must be > 0
    └────────┬────────┘
             │ Valid
             ▼
    ┌─────────────────┐
    │ Balance Check   │ ← Amount ≤ Balance
    │   Validation    │ ← 
    └────────┬────────┘
             │ Valid
             ▼
    ┌─────────────────┐
    │ Solana Fee      │ ← Check SOL for fees
    │   Check         │ ← (Solana only)
    └────────┬────────┘
             │ All Checks Pass
             ▼
    ┌─────────────────┐
    │  Enable Send    │ ← Button active
    │     Button      │ ← User can proceed
    └─────────────────┘


                      DATA FLOW DIAGRAM

┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ Input: recipient, amount, token
       ▼
┌──────────────────┐
│  React State     │ ← useState hooks
│  Management      │ ← useEffect validation
└──────┬───────────┘
       │ Validated data
       ▼
┌──────────────────┐
│ Server Action    │ ← 'use server'
│  (Next.js)       │ ← Type-safe params
└──────┬───────────┘
       │ Transaction params
       ▼
┌──────────────────┐
│  CDP SDK         │ ← Authentication
│  Client          │ ← Network selection
└──────┬───────────┘
       │ Signed transaction
       ▼
┌──────────────────┐
│  Blockchain      │ ← Base or Solana
│  Network         │ ← Settlement
└──────┬───────────┘
       │ Transaction hash/signature
       ▼
┌──────────────────┐
│  Explorer Link   │ ← User verification
│  & Success UI    │ ← Transaction proof
└──────────────────┘


                    COMPONENT HIERARCHY

WalletDropdown
├── Chain Switcher
│   ├── Ethereum Logo (clickable)
│   └── Solana Logo (clickable)
├── Address Display
│   └── Copy Button
├── Tab Navigation
│   ├── Assets Tab
│   ├── NFTs Tab
│   └── Send Tab ⭐
│       ├── Token Selector
│       │   └── Dropdown (with balances)
│       ├── Recipient Input
│       │   ├── Text Input
│       │   └── Validation Error
│       ├── Amount Input
│       │   ├── Number Input
│       │   ├── MAX Button
│       │   └── Balance Display
│       ├── Send Button
│       ├── Confirmation Modal
│       │   ├── Transaction Details
│       │   ├── Fee Info Badge
│       │   ├── Cancel Button
│       │   └── Confirm Button
│       ├── Loading State
│       │   └── Spinner
│       ├── Success State
│       │   ├── Checkmark Icon
│       │   ├── Explorer Link
│       │   └── Send Another Button
│       └── Error State
│           ├── Error Icon
│           ├── Error Message
│           └── Try Again Button
└── Sign Out Button


                   DEPENDENCIES TREE

@coinbase/cdp-sdk (Core)
├── EVM Operations
│   ├── createAccount()
│   ├── sendTransaction()
│   └── listTokenBalances()
└── Solana Operations
    ├── createAccount()
    ├── sendTransaction()
    └── listTokenBalances()

@coinbase/cdp-hooks (React Integration)
├── useIsSignedIn()
├── useEvmAddress()
├── useSolanaAddress()
└── useCurrentUser()

viem (EVM Utilities)
├── parseUnits() ← Amount conversion
├── encodeFunctionData() ← ERC-20 encoding
└── Type definitions

@solana/web3.js (Solana Core)
├── PublicKey ← Address validation
├── Transaction ← Transaction building
└── SystemProgram ← Native transfers

@solana/spl-token (Solana Tokens)
├── createTransferInstruction()
└── getAssociatedTokenAddress()


                  FILE STRUCTURE

src/
├── app/
│   └── actions/
│       ├── send-transaction.ts ⭐
│       │   ├── sendEvmTransaction()
│       │   ├── isValidEvmAddress()
│       │   └── Types
│       └── send-solana-transaction.ts ⭐
│           ├── sendSolanaTransaction()
│           ├── isValidSolanaAddress()
│           └── Types
├── components/
│   └── wallet/
│       ├── WalletDropdown.tsx ⭐
│       │   ├── Chain switching
│       │   ├── Tab navigation
│       │   └── SendTab integration
│       └── SendTab.tsx ⭐
│           ├── Form UI
│           ├── Validation
│           ├── State management
│           └── Transaction flow
└── lib/
    └── utils/
        └── token.ts
            └── formatTokenAmount() ⭐


Legend:
⭐ = Key Send Feature Files
✨ = Gasless Transaction Magic
🎉 = User Experience Win
```
