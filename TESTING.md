# x402 Protocol Pioneers - Testing with Foundry

This project now includes comprehensive testing using **Foundry**, the blazing fast Solidity testing framework. Foundry provides superior testing capabilities compared to Hardhat, including:

- ⚡ **Speed**: 10-100x faster than Hardhat
- 🔍 **Fuzz Testing**: Built-in property testing
- 📊 **Gas Reporting**: Detailed gas analysis
- 🎯 **Coverage**: Code coverage analysis
- 🔧 **Solidity Tests**: Write tests in Solidity (more familiar for smart contract devs)

## 🚀 Quick Start

### Install Foundry
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies  
npm install
```

### Run Tests
```bash
# Run all tests
npm run test

# Run with verbose output (shows logs)
npm run test:verbose

# Run with gas reporting
npm run test:gas

# Run with coverage analysis
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

## 📁 Test Structure

```
test/
├── X402ProtocolPioneers.t.sol  # Core contract functionality
├── X402CCIP.t.sol              # Cross-chain bridging features
├── X402Fuzz.t.sol              # Fuzz testing & invariants
└── X402Gas.t.sol               # Gas optimization analysis
```

## 🧪 Test Categories

### 1. **Core Functionality Tests** (`X402ProtocolPioneers.t.sol`)
- ✅ Contract deployment & initialization
- ✅ NFT minting (single & batch)
- ✅ Access control (owner/server wallet permissions)
- ✅ Collection limits (402 max supply)
- ✅ Rarity tier calculations
- ✅ Metadata generation
- ✅ URI handling

### 2. **CCIP Cross-Chain Tests** (`X402CCIP.t.sol`)
- ✅ Destination program configuration
- ✅ Bridge to Solana functionality
- ✅ Fee estimation
- ✅ Token locking/unlocking
- ✅ Emergency recovery functions
- ✅ Complete bridge flow simulation

### 3. **Fuzz Testing** (`X402Fuzz.t.sol`)
- 🎲 Random input testing
- 🔍 Edge case discovery
- 📐 Invariant checking
- 🎯 Property verification
- 📊 Statistical analysis of contract behavior

### 4. **Gas Optimization** (`X402Gas.t.sol`)
- ⛽ Function gas cost analysis
- 📈 Performance benchmarking
- 🔧 Optimization opportunities
- 📊 Comparative analysis

## 🎯 Key Testing Features

### Fuzz Testing Examples
```solidity
// Test with random valid addresses
function testFuzz_MintToRandomValidAddresses(address recipient, uint8 methodIndex) public

// Test rarity tier consistency across all token IDs
function testFuzz_RarityTierConsistency(uint256 tokenId) public

// Test access control with random callers
function testFuzz_OnlyServerWalletCanMint(address caller) public
```

### Gas Reporting
```bash
npm run test:gas
```
Shows detailed gas costs for:
- Single mints vs batch mints
- View function efficiency
- Storage operations
- Cross-chain operations

### Coverage Analysis
```bash
npm run test:coverage
```
Generates coverage reports showing:
- Line coverage
- Branch coverage  
- Function coverage

## 🔧 Configuration

### `foundry.toml`
- Solidity version: 0.8.19
- Optimizer enabled (200 runs)
- Fuzz runs: 1000
- Invariant runs: 256

### Gas Settings
- Gas limit: Unlimited
- Gas price: 20 gwei
- Detailed gas reporting enabled

## 📊 Test Commands Reference

```bash
# Basic testing
forge test                          # Run all tests
forge test -vv                      # Verbose (show logs)
forge test -vvv                     # Very verbose (show execution traces)
forge test --match-test testMint    # Run specific test pattern

# Gas analysis
forge test --gas-report             # Show gas usage
forge test --gas-report --json      # Gas report in JSON

# Coverage
forge coverage                      # Coverage analysis
forge coverage --report lcov        # LCOV format for tools

# Fuzz testing
forge test --fuzz-runs 10000        # More fuzz runs
forge test --fuzz-seed 42           # Deterministic fuzzing

# Watch mode
forge test --watch                  # Re-run on changes
forge test --watch src/             # Watch specific directory
```

## 🎯 Testing Best Practices

### 1. **Test Organization**
- ✅ Group related tests in the same contract
- ✅ Use clear, descriptive test names
- ✅ Include both positive and negative test cases

### 2. **Fuzz Testing**
- ✅ Use `vm.assume()` to filter valid inputs
- ✅ Use `bound()` to constrain random values
- ✅ Test edge cases and boundary conditions

### 3. **Gas Optimization**
- ✅ Measure gas costs for key operations
- ✅ Compare batch vs individual operations
- ✅ Optimize view functions for efficiency

### 4. **Coverage Goals**
- 🎯 Aim for >95% line coverage
- 🎯 Test all revert conditions
- 🎯 Verify all events are emitted correctly

## 🚨 Common Testing Patterns

### Setup Pattern
```solidity
function setUp() public {
    vm.prank(owner);
    nft = new X402ProtocolPioneers(serverWallet, BASE_URI, ccipRouter);
}
```

### Event Testing
```solidity
vm.expectEmit(true, true, false, true);
emit TokenMinted(user1, 1, "email");
nft.mint(user1, "email", "base-sepolia");
```

### Revert Testing
```solidity
vm.expectRevert("Only server wallet can mint");
nft.mint(user1, "email", "base-sepolia");
```

### Fuzz Testing
```solidity
function testFuzz_Example(uint256 value) public {
    value = bound(value, 1, 1000); // Constrain to valid range
    // Test logic here
}
```

## 🔍 Debugging Tips

### View Test Logs
```bash
forge test -vvv --match-test failing_test_name
```

### Debug Failed Transactions
```bash
forge test --debug failing_test_name
```

### Gas Analysis for Specific Function
```bash
forge test --gas-report --match-test testGas_SpecificFunction
```

## 📈 Performance Benchmarks

Expected gas costs (as of testing):
- **Single mint**: ~150,000 gas
- **Batch mint (10)**: ~100,000 gas per token  
- **Token URI generation**: <50,000 gas
- **Rarity tier lookup**: <10,000 gas
- **CCIP bridge initiation**: ~200,000 gas

## 🎉 Benefits of This Testing Setup

1. **Confidence**: Comprehensive test coverage ensures contract reliability
2. **Speed**: Foundry tests run 10-100x faster than Hardhat
3. **Discovery**: Fuzz testing finds edge cases you might miss
4. **Optimization**: Gas analysis helps reduce deployment and operation costs
5. **Quality**: Invariant testing ensures contract properties always hold

Happy testing! 🧪✨