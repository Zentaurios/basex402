# x402 Protocol Pioneer NFTs

> Exclusive limited-edition NFT collection demonstrating cutting-edge Coinbase Developer Platform integration: x402 micropayments, CDP Embedded Wallets, and Server Wallets v2.

**Live Demo:** [basex402.com](https://basex402.com) *(coming soon)*  
**Contract:** Base Sepolia *(deployment in progress)*

---

## 🎯 Project Overview

**x402 Protocol Pioneer** is a limited collection of **only 402 NFTs** commemorating early adoption of Coinbase's revolutionary x402 HTTP micropayments protocol. Each NFT costs **$1 USDC** and serves as collectible proof of participation in the future of seamless web payments.

This portfolio project showcases advanced integration of three cutting-edge Coinbase Developer Platform features:
- **x402 Payment Protocol**: HTTP 402 Payment Required standard for seamless micropayments
- **CDP Embedded Wallets**: Simplified wallet creation with email/SMS authentication
- **CDP Server Wallets v2**: Secure automated NFT minting without private key management

### Why This Matters
- **Real Economic Viability**: $1 USDC pricing creates sustainable economics vs gas costs (~$0.01/mint)
- **Genuine Scarcity**: Hard-capped at 402 NFTs with sequential minting and rarity tiers
- **Protocol Innovation**: First-class implementation of emerging x402 payment standard
- **Production-Ready**: Built for Base mainnet with full testnet support

---

## ✨ Key Features

### NFT Collection
- **Limited Supply**: Only 402 NFTs will ever exist
- **Rarity System**: Four tiers based on mint order (#1-10 Genesis, #11-100 Pioneer, etc.)
- **Dynamic Metadata**: Mint timestamp, payment method, and rarity traits
- **OpenSea Ready**: Standard ERC-721 with full marketplace compatibility

### Payment Flow
- **x402 Integration**: Proper HTTP 402 Payment Required responses
- **USDC Payments**: $1 USDC via CDP Embedded Wallets
- **Instant Minting**: Automated NFT deployment upon payment confirmation
- **Gas-Free UX**: Server Wallet covers all transaction costs

### Tech Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, TailwindCSS
- **Blockchain**: Base (production) / Base Sepolia (testnet)
- **Wallet**: CDP Embedded Wallets Beta with email/SMS OTP
- **Smart Contracts**: Solidity with Hardhat & Foundry toolchains
- **Infrastructure**: Vercel deployment, CDP Server Wallets v2

---

## 🏗 Architecture Highlights

### Smart Contract Design
```solidity
contract x402 Protocol is ERC721 {
    uint256 public constant MAX_SUPPLY = 402;
    
    struct MintData {
        uint256 timestamp;
        string paymentMethod;  // "email" or "sms"
        string network;        // "base" or "base-sepolia"
    }
    
    // Server-wallet-only minting prevents payment bypass
    function mint(address to, string memory paymentMethod) 
        external onlyOwner { ... }
}
```

### x402 Payment Integration
```typescript
// API route returns HTTP 402 with payment details
if (!paymentVerified) {
  return new Response('Payment Required', {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      'X-Payment-Amount': '1000000', // $1 USDC (6 decimals)
    }
  });
}

// Frontend handles payment with CDP hooks
const { sendTransaction } = useSendEvmTransaction();
await sendTransaction({ to: recipient, value: amount });
```

### Server Wallet Automation
- CDP Server Wallets v2 handles all contract interactions
- AWS Nitro Enclave security for private key management
- Automatic gas fee coverage from wallet balance
- No user-exposed private keys or complex wallet management

---

## 📱 User Experience Flow

1. **Discovery** → Landing page showcases collection with live mint progress (e.g., "287/402 minted")
2. **Authentication** → Email or SMS OTP creates embedded wallet instantly
3. **Payment Gate** → HTTP 402 triggers $1 USDC payment request
4. **Confirmation** → User approves USDC transfer through embedded wallet
5. **Minting** → Server Wallet automatically mints NFT to user's address
6. **Success** → NFT appears in wallet with unique token ID and rarity tier
7. **Collection** → View on OpenSea, share on social, mint additional NFTs (if supply remains)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Coinbase Developer Platform account ([portal.cdp.coinbase.com](https://portal.cdp.coinbase.com))
- Base Sepolia testnet ETH and USDC for testing

### Installation

```bash
# Clone repository
cd x402-contract-deployer

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

### Environment Configuration

```bash
# Required CDP API keys (from CDP Portal)
CDP_API_KEY_ID=your_api_key_id
CDP_API_KEY_SECRET=your_api_key_secret
CDP_WALLET_SECRET=your_wallet_secret

# CDP React configuration
NEXT_PUBLIC_CDP_PROJECT_ID=your_project_id

# Network configuration
NEXT_PUBLIC_ENABLE_MAINNET=false  # true for Base, false for Base Sepolia

# Payment configuration
NEXT_PUBLIC_PAYMENT_AMOUNT=1000000  # $1 USDC (6 decimals)
NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e  # Base Sepolia USDC

# Optional: Analytics, monitoring, etc.
```

### Development

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
```

### Smart Contract Development

```bash
# Compile contracts with Hardhat
npm run compile

# Or use Foundry
npm run forge:build

# Run tests
npm run test

# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

---

## 📂 Project Structure

```
x402-contract-deployer/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page with collection showcase
│   │   ├── mint/page.tsx               # NFT minting interface
│   │   ├── api/
│   │   │   ├── mint/route.ts          # x402 payment + minting logic
│   │   │   ├── metadata/[id]/route.ts # Dynamic NFT metadata
│   │   │   └── collection/route.ts    # Collection statistics
│   │   └── providers.tsx              # CDP React Provider setup
│   ├── components/
│   │   ├── auth/
│   │   │   └── EmbeddedWallet.tsx     # CDP Embedded Wallet UI
│   │   └── nft/
│   │       ├── MintProgress.tsx       # Live minting statistics
│   │       └── NFTPreview.tsx         # Preview with rarity display
│   └── lib/
│       ├── cdp-client.ts              # CDP Server Wallet v2 client
│       ├── x402.ts                    # Payment protocol implementation
│       └── contracts.ts               # Smart contract interactions
├── contracts/
│   └── x402 Protocol.sol               # ERC-721 NFT contract
├── scripts/
│   └── deploy.js                      # Contract deployment scripts
├── test/
│   └── x402 Protocol.t.sol             # Foundry contract tests
└── claude-context/                     # Architecture documentation
    ├── project-overview.md
    ├── technical-architecture.md
    └── implementation-context.md
```

---

## 🎨 NFT Rarity System

| Tier | Token IDs | Supply | Artwork | Description |
|------|-----------|--------|---------|-------------|
| **Genesis** | #1-10 | 10 | Golden | Founding collectors, highest rarity |
| **Pioneer** | #11-100 | 90 | Silver | Early protocol adopters |
| **Early Adopter** | #101-300 | 200 | Bronze | Community supporters |
| **Protocol User** | #301-402 | 102 | Standard | Protocol participants |

Each NFT includes metadata attributes:
- Sequential token ID (#1-402)
- Mint timestamp
- Payment authentication method (email/SMS)
- Blockchain network (Base/Base Sepolia)
- Rarity tier designation

---

## 🔧 Technical Highlights

### What Makes This Implementation Unique

**1. Full x402 Protocol Compliance**
- Proper HTTP 402 status code handling
- Payment verification before state changes
- Retry logic with payment headers
- EIP-3009 compatible payment authorization

**2. Production-Grade CDP Integration**
- CDP Embedded Wallets with Base.org theme customization
- Server Wallets v2 for secure automated operations
- Proper error handling and user feedback
- Network-agnostic design (testnet/mainnet switching)

**3. Smart Contract Security**
- Server-wallet-only minting prevents payment bypass
- Hard supply cap enforced at contract level
- Reentrancy protection on sensitive functions
- Comprehensive Foundry test coverage

**4. Modern Frontend Architecture**
- Next.js 15 App Router with React Server Components
- TypeScript for type safety across entire stack
- TailwindCSS with Base.org design system
- Framer Motion for smooth animations

---

## 📊 Economics & Sustainability

**Revenue Model:**
- 402 NFTs × $1 USDC = **$402 total revenue**
- Base gas costs: ~$0.01/mint × 402 = **~$4 gas costs**
- **Net: ~$398 profit (~99% margin)**

**Why This Works:**
- x402 payments are instant and low-overhead
- Base L2 provides negligible gas costs
- Server Wallets eliminate need for manual transaction signing
- Hard supply cap creates genuine scarcity and collectible value

---

## 🎯 Portfolio Impact

### Skills Demonstrated

**Blockchain Development:**
- ERC-721 NFT smart contract development
- Solidity security best practices
- Multi-toolchain proficiency (Hardhat + Foundry)
- Base/Ethereum L2 deployment expertise

**Full-Stack Web3:**
- Next.js 15 + React 19 modern architecture
- TypeScript across entire application
- CDP SDK integration (Embedded + Server Wallets)
- Real-time blockchain event handling

**Payment Systems:**
- x402 HTTP micropayments protocol
- USDC stablecoin integration
- Payment verification and security
- User-friendly payment UX design

**Product Thinking:**
- Viable economic model from day one
- Scarcity-driven value proposition
- Clean, accessible user experience
- Production-ready deployment strategy

### Target Roles
Perfect showcase for:
- **Base Senior Fullstack Engineer (Frontend Leaning)**
- **Base Staff Developer Advocate**
- **Senior Web3 Frontend Engineer**
- **Protocol Engineer (dApps)**
- Any role requiring deep Coinbase ecosystem knowledge

---

## 📚 Resources & Documentation

**Project Documentation:**
- [Technical Architecture](./claude-context/technical-architecture.md)
- [Implementation Context](./claude-context/implementation-context.md)
- [x402 Protocol Guide](./claude-context/x402-protocol-guide.md)

**External References:**
- [x402 Protocol Specification](https://x402.dev)
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com)
- [Base Network Documentation](https://docs.base.org)
- [OnchainKit Documentation](https://onchainkit.xyz)

---

## 🚧 Current Status

### ✅ Completed
- [x] Next.js 15 + React 19 + TypeScript foundation
- [x] CDP Embedded Wallets integration
- [x] Landing page with collection showcase
- [x] Mint interface with wallet connection
- [x] Smart contract architecture (ERC-721)
- [x] x402 payment protocol structure
- [x] Base.org theme customization
- [x] Project documentation

### 🔄 In Progress
- [ ] Smart contract deployment to Base Sepolia
- [ ] Server Wallets v2 integration testing
- [ ] x402 payment flow end-to-end testing
- [ ] Dynamic NFT metadata API
- [ ] OpenSea collection setup
- [ ] Production deployment to basex402.com

### 📋 Roadmap
1. Complete testnet deployment and testing
2. Deploy to Base mainnet
3. Launch limited minting campaign
4. Add collection analytics dashboard
5. Implement social sharing features
6. Create promotional materials

---

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome! If you spot issues or have ideas for improvements:

1. Open an issue describing the problem/suggestion
2. PRs welcome for bug fixes or documentation improvements
3. For major changes, please open an issue first to discuss

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 👤 About

Built by **Ryan Reiss** | [GitHub](https://github.com/yourusername) | [LinkedIn](https://linkedin.com/in/yourprofile) | [Portfolio](https://webb3fitty.dev)

Showcasing advanced Web3 development with Coinbase Developer Platform integration.

**Contact:** reisscoding@gmail.com

---

**Note:** This project demonstrates cutting-edge features that may still be in beta. x402 protocol is an emerging standard, and CDP Embedded Wallets are in active development. Implementation details may change as these platforms evolve.

Built with ❤️ for the Coinbase Developer Community
