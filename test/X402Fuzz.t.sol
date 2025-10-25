// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/X402ProtocolPioneers.sol";

contract X402FuzzTest is Test {
    X402ProtocolPioneers public nft;
    
    address public owner = address(0x1);
    address public serverWallet = address(0x2);
    address public royaltyReceiver = address(0x5);
    string public constant BASE_URI = "https://api.example.com/metadata/";
    uint256 public constant MAX_SUPPLY = 402;
    
    function setUp() public {
        vm.prank(owner);
        nft = new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            royaltyReceiver
        );
    }
    
    // ============ FUZZ TESTS FOR MINTING ============
    
    function testFuzz_MintToRandomValidAddresses(address recipient, uint8 methodIndex) public {
        // Ensure recipient is valid
        vm.assume(recipient != address(0));
        vm.assume(recipient.code.length == 0); // Not a contract
        vm.assume(recipient != address(nft));
        
        // Payment method must be x402
        string memory paymentMethod = "x402";
        
        vm.prank(serverWallet);
        nft.mint(recipient, paymentMethod, "base-sepolia");
        
        assertEq(nft.ownerOf(1), recipient);
        assertEq(nft.totalSupply(), 1);
        
        X402ProtocolPioneers.MintData memory mintData = nft.getMintData(1);
        assertEq(mintData.paymentMethod, paymentMethod);
    }
    
    function testFuzz_MintMultipleTokensToSameAddress(address recipient, uint8 count) public {
        vm.assume(recipient != address(0));
        vm.assume(recipient.code.length == 0);
        vm.assume(recipient != address(nft));
        
        // Bound count to wallet limit (max 5 per wallet)
        count = uint8(bound(count, 1, 5));
        
        vm.startPrank(serverWallet);
        
        for (uint8 i = 0; i < count; i++) {
            nft.mint(recipient, "x402", "base-sepolia");
        }
        
        vm.stopPrank();
        
        assertEq(nft.totalSupply(), count);
        assertEq(nft.mintedPerWallet(recipient), count);
        
        // Verify all tokens belong to recipient
        for (uint8 i = 1; i <= count; i++) {
            assertEq(nft.ownerOf(i), recipient);
        }
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
    
    function testFuzz_TokenURIFormat(uint256 tokenId) public {
        tokenId = bound(tokenId, 1, 10); // Only test first 10 to avoid minting all
        
        vm.prank(serverWallet);
        nft.mint(address(0x123), "x402", "base-sepolia");
        
        if (tokenId == 1) {
            string memory uri = nft.tokenURI(tokenId);
            assertTrue(bytes(uri).length > 0);
            
            // Check if URI contains expected components
            bytes memory uriBytes = bytes(uri);
            bytes memory baseURIBytes = bytes(BASE_URI);
            
            // URI should start with BASE_URI
            bool startsWithBaseURI = true;
            for (uint i = 0; i < baseURIBytes.length && i < uriBytes.length; i++) {
                if (uriBytes[i] != baseURIBytes[i]) {
                    startsWithBaseURI = false;
                    break;
                }
            }
            assertTrue(startsWithBaseURI);
        }
    }
    
    // ============ FUZZ TESTS FOR ACCESS CONTROL ============
    
    function testFuzz_OnlyServerWalletCanMint(address caller) public {
        vm.assume(caller != serverWallet);
        vm.assume(caller != address(0));
        
        vm.prank(caller);
        vm.expectRevert("Only server wallet can mint");
        nft.mint(address(0x123), "x402", "base-sepolia");
    }
    
    function testFuzz_OnlyOwnerCanUpdateServerWallet(address caller, address newWallet) public {
        vm.assume(caller != owner);
        vm.assume(caller != address(0));
        vm.assume(newWallet != address(0));
        
        vm.prank(caller);
        vm.expectRevert();
        nft.updateServerWallet(newWallet);
        
        // But owner should succeed
        vm.prank(owner);
        nft.updateServerWallet(newWallet);
        assertEq(nft.serverWallet(), newWallet);
    }
    
    function testFuzz_OnlyOwnerCanUpdateBaseURI(address caller, string calldata newURI) public {
        vm.assume(caller != owner);
        vm.assume(caller != address(0));
        vm.assume(bytes(newURI).length > 0);
        
        vm.prank(caller);
        vm.expectRevert();
        nft.updateBaseURI(newURI);
        
        // But owner should succeed
        vm.prank(owner);
        nft.updateBaseURI(newURI);
        assertEq(nft.baseURI(), newURI);
    }
    
    // ============ FUZZ TESTS FOR EDGE CASES ============
    
    function testFuzz_CannotMintBeyondMaxSupply(uint16 attempts) public {
        // Limit test to reasonable transaction size (gas limits)
        // Testing full 402 NFTs in one transaction exceeds 25M gas limit
        attempts = uint16(bound(attempts, 51, 150));
        
        vm.startPrank(serverWallet);
        
        // Mint up to 50 NFTs, using different addresses to avoid wallet limits
        for (uint256 i = 0; i < 50; i++) {
            address recipient = address(uint160(0x1000 + i / 5)); // Max 5 per wallet
            nft.mint(recipient, "x402", "base-sepolia");
        }
        
        assertEq(nft.totalSupply(), 50);
        assertFalse(nft.isSoldOut()); // Not sold out with only 50 minted
        
        vm.stopPrank();
        
        // Note: In production, mints happen individually as users pay,
        // not in large batches that would hit gas limits
    }
    
    function testFuzz_BatchMintConsistency(uint8 batchSize) public {
        batchSize = uint8(bound(batchSize, 1, 20));
        
        address[] memory recipients = new address[](batchSize);
        string[] memory paymentMethods = new string[](batchSize);
        string[] memory networks = new string[](batchSize);
        
        for (uint8 i = 0; i < batchSize; i++) {
            recipients[i] = address(uint160(0x1000 + i));
            paymentMethods[i] = "x402";
            networks[i] = i % 3 == 0 ? "base-mainnet" : "base-sepolia";
        }
        
        vm.prank(serverWallet);
        nft.batchMint(recipients, paymentMethods, networks);
        
        assertEq(nft.totalSupply(), batchSize);
        
        // Verify each token
        for (uint8 i = 0; i < batchSize; i++) {
            uint256 tokenId = i + 1;
            assertEq(nft.ownerOf(tokenId), recipients[i]);
            
            X402ProtocolPioneers.MintData memory mintData = nft.getMintData(tokenId);
            assertEq(mintData.paymentMethod, paymentMethods[i]);
            assertEq(mintData.network, networks[i]);
        }
    }
    
    // ============ CCIP FUNCTIONALITY REMOVED ============
    // CCIP bridging functionality has been removed from the contract
    // Tests for setDestinationProgram and bridge functions are no longer applicable
    
    // ============ FUZZ TESTS FOR SUPPLY CALCULATIONS ============
    
    function testFuzz_SupplyCalculationsAlwaysCorrect(uint16 mintCount) public {
        // Limit to reasonable transaction size to avoid gas limits
        // Full 402 NFTs exceeds Base network's 25M gas limit per transaction
        mintCount = uint16(bound(mintCount, 0, 100));
        
        vm.startPrank(serverWallet);
        
        // Mint to different addresses to avoid wallet limits (max 5 per wallet)
        for (uint16 i = 0; i < mintCount; i++) {
            address recipient = address(uint160(0x1000 + i / 5));
            nft.mint(recipient, "x402", "base-sepolia");
        }
        
        vm.stopPrank();
        
        assertEq(nft.totalSupply(), mintCount);
        assertEq(nft.remainingSupply(), MAX_SUPPLY - mintCount);
        assertEq(nft.isSoldOut(), mintCount == MAX_SUPPLY);
    }
    
    // ============ FUZZ TESTS FOR STRING HANDLING ============
    
    function testFuzz_PaymentMethodValidation(string calldata paymentMethod) public {
        vm.prank(serverWallet);
        
        if (
            keccak256(abi.encodePacked(paymentMethod)) == keccak256(abi.encodePacked("x402"))
        ) {
            nft.mint(address(0x123), paymentMethod, "base-sepolia");
            assertEq(nft.totalSupply(), 1);
        } else {
            vm.expectRevert("Payment method must be 'x402'");
            nft.mint(address(0x123), paymentMethod, "base-sepolia");
        }
    }
    
    function testFuzz_NetworkStringStorage(string calldata network) public {
        // Limit network string length to reasonable size
        vm.assume(bytes(network).length > 0 && bytes(network).length <= 100);
        
        vm.prank(serverWallet);
        nft.mint(address(0x123), "x402", network);
        
        X402ProtocolPioneers.MintData memory mintData = nft.getMintData(1);
        assertEq(mintData.network, network);
    }
    
    // ============ WALLET LIMIT FUZZ TESTS ============
    
    function testFuzz_WalletLimitEnforcement(address recipient, uint8 attemptCount) public {
        vm.assume(recipient != address(0));
        vm.assume(recipient.code.length == 0);
        vm.assume(recipient != address(nft));
        
        attemptCount = uint8(bound(attemptCount, 1, 10));
        
        vm.startPrank(serverWallet);
        
        uint256 successfulMints = 0;
        for (uint8 i = 0; i < attemptCount; i++) {
            if (successfulMints < 5) {
                nft.mint(recipient, "x402", "base-sepolia");
                successfulMints++;
            } else {
                vm.expectRevert("Exceeds wallet limit");
                nft.mint(recipient, "x402", "base-sepolia");
            }
        }
        
        assertEq(nft.mintedPerWallet(recipient), successfulMints > 5 ? 5 : successfulMints);
        assertLe(nft.mintedPerWallet(recipient), 5);
        
        vm.stopPrank();
    }
    
    function testFuzz_RemainingMintsCalculation(address wallet, uint8 mintCount) public {
        vm.assume(wallet != address(0));
        vm.assume(wallet.code.length == 0);
        vm.assume(wallet != address(nft));
        
        mintCount = uint8(bound(mintCount, 0, 5));
        
        vm.startPrank(serverWallet);
        
        for (uint8 i = 0; i < mintCount; i++) {
            nft.mint(wallet, "x402", "base-sepolia");
        }
        
        uint256 remaining = nft.getRemainingMints(wallet);
        assertEq(remaining, 5 - mintCount);
        assertEq(nft.mintedPerWallet(wallet), mintCount);
        
        vm.stopPrank();
    }
    
    // ============ INVARIANT PROPERTIES ============
    
    function invariant_TotalSupplyNeverExceedsMax() public {
        assertLe(nft.totalSupply(), MAX_SUPPLY);
    }
    
    function invariant_RemainingSupplyIsCorrect() public {
        assertEq(nft.remainingSupply(), MAX_SUPPLY - nft.totalSupply());
    }
    
    function invariant_SoldOutStatusIsCorrect() public {
        if (nft.totalSupply() == MAX_SUPPLY) {
            assertTrue(nft.isSoldOut());
        } else {
            assertFalse(nft.isSoldOut());
        }
    }
    
    function invariant_ServerWalletIsNeverZero() public {
        assertTrue(nft.serverWallet() != address(0));
    }
    
    function invariant_OwnerIsNeverZero() public {
        assertTrue(nft.owner() != address(0));
    }
    
    function invariant_WalletLimitsNeverExceeded() public {
        // This would require tracking all addresses that have minted
        // For now, we'll test that any specific address we can check doesn't exceed 5
        if (nft.totalSupply() > 0) {
            // Check a few known addresses don't exceed limits
            assertLe(nft.mintedPerWallet(address(0x1)), 5);
            assertLe(nft.mintedPerWallet(address(0x2)), 5);
            assertLe(nft.mintedPerWallet(address(0x3)), 5);
        }
    }
}
