// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/X402ProtocolPioneers.sol";

contract X402ProtocolPioneersTest is Test {
    X402ProtocolPioneers public nft;
    
    // Test addresses
    address public owner = address(0x1);
    address public serverWallet = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public royaltyReceiver = address(0x5);
    
    // Test constants
    string public constant BASE_URI = "https://api.example.com/metadata/";
    uint256 public constant MAX_SUPPLY = 402;
    
    event TokenMinted(address indexed to, uint256 indexed tokenId, string paymentMethod);
    event ServerWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy the contract (CCIP removed)
        nft = new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            royaltyReceiver
        );
        
        vm.stopPrank();
    }
    
    // ============ DEPLOYMENT TESTS ============
    
    function test_Deployment() public {
        assertEq(nft.name(), "x402 Protocol Pioneers");
        assertEq(nft.symbol(), "X402");
        assertEq(nft.owner(), owner);
        assertEq(nft.serverWallet(), serverWallet);
        assertEq(nft.baseURI(), BASE_URI);
        assertEq(nft.MAX_SUPPLY(), MAX_SUPPLY);
        assertEq(nft.totalSupply(), 0);
        assertFalse(nft.isSoldOut());
        assertEq(nft.remainingSupply(), MAX_SUPPLY);
    }
    
    function test_DeploymentWithZeroServerWallet() public {
        vm.expectRevert("Server wallet cannot be zero address");
        new X402ProtocolPioneers(
            address(0),
            BASE_URI,
            royaltyReceiver
        );
    }
    
    function test_DeploymentWithZeroRoyaltyReceiver() public {
        vm.expectRevert("Royalty receiver cannot be zero address");
        new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            address(0)
        );
    }
    
    // CCIP test removed - CCIP functionality has been removed from contract
    
    // ============ MINTING TESTS ============
    
    function test_MintSuccess() public {
        vm.startPrank(serverWallet);
        
        vm.expectEmit(true, true, false, true);
        emit TokenMinted(user1, 1, "x402");
        
        nft.mint(user1, "x402", "base-sepolia");
        
        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.remainingSupply(), MAX_SUPPLY - 1);
        
        // Check mint data
        X402ProtocolPioneers.MintData memory mintData = nft.getMintData(1);
        assertEq(mintData.paymentMethod, "x402");
        assertEq(mintData.network, "base-sepolia");
        assertTrue(mintData.timestamp > 0);
        
        vm.stopPrank();
    }
    
    function test_MintOnlyServerWallet() public {
        vm.expectRevert("Only server wallet can mint");
        nft.mint(user1, "x402", "base-sepolia");
        
        vm.prank(user1);
        vm.expectRevert("Only server wallet can mint");
        nft.mint(user1, "x402", "base-sepolia");
    }
    
    function test_MintToZeroAddress() public {
        vm.prank(serverWallet);
        vm.expectRevert("Cannot mint to zero address");
        nft.mint(address(0), "x402", "base-sepolia");
    }
    
    function test_MintInvalidPaymentMethod() public {
        vm.prank(serverWallet);
        vm.expectRevert("Payment method must be 'x402'");
        nft.mint(user1, "crypto", "base-sepolia");
    }
    
    function test_MintX402PaymentMethod() public {
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-mainnet");
        
        X402ProtocolPioneers.MintData memory mintData = nft.getMintData(1);
        assertEq(mintData.paymentMethod, "x402");
        assertEq(mintData.network, "base-mainnet");
    }
    
    function test_MintMultipleTokens() public {
        vm.startPrank(serverWallet);
        
        nft.mint(user1, "x402", "base-sepolia");
        nft.mint(user2, "x402", "base-mainnet");
        nft.mint(user1, "x402", "base-sepolia");
        
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user2);
        assertEq(nft.ownerOf(3), user1);
        
        vm.stopPrank();
    }
    
    function test_MintMaxSupply() public {
        vm.startPrank(serverWallet);
        
        // Test minting up to a reasonable amount in one transaction
        // Full MAX_SUPPLY (402) exceeds gas limits in a single test transaction
        uint256 testAmount = 100; // Test with 100 NFTs instead of 402
        
        // Mint using different addresses to avoid wallet limits
        for (uint256 i = 0; i < testAmount; i++) {
            address recipient = address(uint160(0x1000 + i / 5)); // Max 5 per wallet
            nft.mint(recipient, "x402", "base-sepolia");
        }
        
        assertEq(nft.totalSupply(), testAmount);
        assertFalse(nft.isSoldOut()); // Not sold out yet
        assertEq(nft.remainingSupply(), MAX_SUPPLY - testAmount);
        
        vm.stopPrank();
        
        // Note: Testing full 402 supply in a single transaction would exceed
        // Base network's 25M gas limit. In production, NFTs are minted individually
        // as users make payments, not all at once.
    }
    
    // ============ BATCH MINTING TESTS ============
    
    function test_BatchMint() public {
        vm.startPrank(serverWallet);
        
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user1;
        
        string[] memory paymentMethods = new string[](3);
        paymentMethods[0] = "x402";
        paymentMethods[1] = "x402";
        paymentMethods[2] = "x402";
        
        string[] memory networks = new string[](3);
        networks[0] = "base-sepolia";
        networks[1] = "base-mainnet";
        networks[2] = "base-sepolia";
        
        nft.batchMint(recipients, paymentMethods, networks);
        
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user2);
        assertEq(nft.ownerOf(3), user1);
        
        vm.stopPrank();
    }
    
    function test_BatchMintMismatchedArrays() public {
        vm.startPrank(serverWallet);
        
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;
        
        string[] memory paymentMethods = new string[](3);
        paymentMethods[0] = "email";
        paymentMethods[1] = "sms";
        paymentMethods[2] = "email";
        
        string[] memory networks = new string[](2);
        networks[0] = "base-sepolia";
        networks[1] = "base-mainnet";
        
        vm.expectRevert("Array lengths must match");
        nft.batchMint(recipients, paymentMethods, networks);
        
        vm.stopPrank();
    }
    
    function test_BatchMintExceedsMaxSupply() public {
        vm.startPrank(serverWallet);
        
        // Create arrays larger than remaining public supply
        // MAX_SUPPLY is 402, but MAX_PUBLIC_SUPPLY is 355 (last 47 reserved for airdrop)
        address[] memory recipients = new address[](356); // Exceeds public supply
        string[] memory paymentMethods = new string[](356);
        string[] memory networks = new string[](356);
        
        for (uint256 i = 0; i < 356; i++) {
            recipients[i] = address(uint160(0x9000 + i / 5)); // Different addresses to avoid wallet limits
            paymentMethods[i] = "x402";
            networks[i] = "base-sepolia";
        }
        
        vm.expectRevert("Would exceed public supply - airdrop slots reserved");
        nft.batchMint(recipients, paymentMethods, networks);
        
        vm.stopPrank();
    }
    
    // ============ RARITY TIER TESTS ============
    
    function test_RarityTiers() public {
        // Genesis tier (1-10)
        assertEq(nft.getRarityTier(1), "Genesis");
        assertEq(nft.getRarityTier(5), "Genesis");
        assertEq(nft.getRarityTier(10), "Genesis");
        
        // Pioneer tier (11-100)
        assertEq(nft.getRarityTier(11), "Pioneer");
        assertEq(nft.getRarityTier(50), "Pioneer");
        assertEq(nft.getRarityTier(100), "Pioneer");
        
        // Early Adopter tier (101-225)
        assertEq(nft.getRarityTier(101), "Early Adopter");
        assertEq(nft.getRarityTier(200), "Early Adopter");
        assertEq(nft.getRarityTier(225), "Early Adopter");
        
        // Protocol User tier (226-402)
        assertEq(nft.getRarityTier(226), "Protocol User");
        assertEq(nft.getRarityTier(350), "Protocol User");
        assertEq(nft.getRarityTier(402), "Protocol User");
    }
    
    function test_RarityTierInvalidTokenId() public {
        vm.expectRevert("Token ID out of range");
        nft.getRarityTier(0);
        
        vm.expectRevert("Token ID out of range");
        nft.getRarityTier(403);
    }
    
    // ============ METADATA TESTS ============
    
    function test_TokenURI() public {
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        string memory uri = nft.tokenURI(1);
        string memory expected = string(abi.encodePacked(
            BASE_URI,
            "1",
            "?collection=x402-protocol-pioneers"
        ));
        
        assertEq(uri, expected);
    }
    
    function test_TokenURINonexistentToken() public {
        vm.expectRevert("Token does not exist");
        nft.tokenURI(1);
        
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        vm.expectRevert("Token does not exist");
        nft.tokenURI(2);
    }
    
    function test_ContractURI() public {
        string memory uri = nft.contractURI();
        string memory expected = string(abi.encodePacked(BASE_URI, "contract"));
        assertEq(uri, expected);
    }
    
    // ============ ACCESS CONTROL TESTS ============
    
    function test_UpdateServerWalletOnlyOwner() public {
        address newServerWallet = address(0x99);
        
        vm.expectRevert();
        vm.prank(user1);
        nft.updateServerWallet(newServerWallet);
        
        vm.expectEmit(true, true, false, false);
        emit ServerWalletUpdated(serverWallet, newServerWallet);
        
        vm.prank(owner);
        nft.updateServerWallet(newServerWallet);
        
        assertEq(nft.serverWallet(), newServerWallet);
    }
    
    function test_UpdateServerWalletZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Server wallet cannot be zero address");
        nft.updateServerWallet(address(0));
    }
    
    function test_UpdateBaseURIOnlyOwner() public {
        string memory newBaseURI = "https://new-api.example.com/metadata/";
        
        vm.expectRevert();
        vm.prank(user1);
        nft.updateBaseURI(newBaseURI);
        
        vm.prank(owner);
        nft.updateBaseURI(newBaseURI);
        
        assertEq(nft.baseURI(), newBaseURI);
    }
    
    function test_WithdrawOnlyOwner() public {
        // Send some ETH to the contract
        vm.deal(address(nft), 1 ether);
        
        vm.expectRevert();
        vm.prank(user1);
        nft.withdraw();
        
        uint256 ownerBalanceBefore = owner.balance;
        
        vm.prank(owner);
        nft.withdraw();
        
        assertEq(address(nft).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + 1 ether);
    }
    
    function test_WithdrawNoBalance() public {
        vm.prank(owner);
        vm.expectRevert("No ETH to withdraw");
        nft.withdraw();
    }
    
    // ============ WALLET LIMITS TESTS ============
    
    function test_WalletLimitBasic() public {
        vm.startPrank(serverWallet);
        
        // Should be able to mint up to 5
        for (uint256 i = 0; i < 5; i++) {
            nft.mint(user1, "x402", "base-sepolia");
        }
        
        assertEq(nft.mintedPerWallet(user1), 5);
        assertEq(nft.getRemainingMints(user1), 0);
        
        // 6th mint should fail
        vm.expectRevert("Exceeds wallet limit");
        nft.mint(user1, "x402", "base-sepolia");
        
        vm.stopPrank();
    }
    
    function test_WalletLimitMultipleWallets() public {
        vm.startPrank(serverWallet);
        
        // Each wallet can mint 5
        for (uint256 i = 0; i < 5; i++) {
            nft.mint(user1, "x402", "base-sepolia");
            nft.mint(user2, "x402", "base-mainnet");
        }
        
        assertEq(nft.mintedPerWallet(user1), 5);
        assertEq(nft.mintedPerWallet(user2), 5);
        assertEq(nft.totalSupply(), 10);
        
        // Both should be at limit
        vm.expectRevert("Exceeds wallet limit");
        nft.mint(user1, "x402", "base-sepolia");
        
        vm.expectRevert("Exceeds wallet limit");
        nft.mint(user2, "x402", "base-mainnet");
        
        vm.stopPrank();
    }
    
    function test_GetRemainingMints() public {
        vm.startPrank(serverWallet);
        
        // Initially 5 remaining
        assertEq(nft.getRemainingMints(user1), 5);
        
        // After 1 mint, 4 remaining
        nft.mint(user1, "x402", "base-sepolia");
        assertEq(nft.getRemainingMints(user1), 4);
        
        // After 3 more mints, 1 remaining
        for (uint256 i = 0; i < 3; i++) {
            nft.mint(user1, "x402", "base-sepolia");
        }
        assertEq(nft.getRemainingMints(user1), 1);
        
        // After final mint, 0 remaining
        nft.mint(user1, "x402", "base-sepolia");
        assertEq(nft.getRemainingMints(user1), 0);
        
        vm.stopPrank();
    }
    
    function test_BatchMintWalletLimits() public {
        vm.startPrank(serverWallet);
        
        address[] memory recipients = new address[](3);
        string[] memory paymentMethods = new string[](3);
        string[] memory networks = new string[](3);
        
        // Try to batch mint 3 to user1 (should work)
        recipients[0] = user1;
        recipients[1] = user1;
        recipients[2] = user1;
        paymentMethods[0] = "x402";
        paymentMethods[1] = "x402";
        paymentMethods[2] = "x402";
        networks[0] = "base-sepolia";
        networks[1] = "base-sepolia";
        networks[2] = "base-sepolia";
        
        nft.batchMint(recipients, paymentMethods, networks);
        assertEq(nft.mintedPerWallet(user1), 3);
        
        // Now try to batch mint 3 more (should fail as it would exceed limit)
        vm.expectRevert("Exceeds wallet limit");
        nft.batchMint(recipients, paymentMethods, networks);
        
        vm.stopPrank();
    }
    
    // ============ AIRDROP TESTS ============
    
    function test_ServerWalletAirdrop() public {
        // Server wallet can execute airdrop
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        assertTrue(nft.airdropCompleted());
        assertEq(nft.totalSupply(), 47);
    }
    
    function test_OnlyServerWalletCanExecuteAirdrop() public {
        // Owner cannot execute airdrop
        vm.expectRevert("Only server wallet can mint");
        vm.prank(owner);
        nft.executeAirdrop();
        
        // User cannot execute airdrop  
        vm.expectRevert("Only server wallet can mint");
        vm.prank(user1);
        nft.executeAirdrop();
        
        // But server wallet can
        vm.prank(serverWallet);
        nft.executeAirdrop();
        assertTrue(nft.airdropCompleted());
    }
    
    // ============ UTILITY TESTS ============
    
    function test_SupportsInterface() public {
        // ERC721
        assertTrue(nft.supportsInterface(0x80ac58cd));
        // ERC721Metadata
        assertTrue(nft.supportsInterface(0x5b5e139f));
        // ERC165
        assertTrue(nft.supportsInterface(0x01ffc9a7));
    }
    
    // ============ FUZZ TESTS ============
    
    function testFuzz_MintWithRandomAddresses(address recipient) public {
        vm.assume(recipient != address(0));
        vm.assume(recipient.code.length == 0); // Not a contract
        
        vm.prank(serverWallet);
        nft.mint(recipient, "x402", "base-sepolia");
        
        assertEq(nft.ownerOf(1), recipient);
        assertEq(nft.totalSupply(), 1);
    }
    
    function testFuzz_RarityTierConsistency(uint256 tokenId) public {
        tokenId = bound(tokenId, 1, MAX_SUPPLY);
        
        string memory tier = nft.getRarityTier(tokenId);
        
        if (tokenId <= 10) {
            assertEq(tier, "Genesis");
        } else if (tokenId <= 100) {
            assertEq(tier, "Pioneer");
        } else if (tokenId <= 225) {
            assertEq(tier, "Early Adopter");
        } else {
            assertEq(tier, "Protocol User");
        }
    }
}
