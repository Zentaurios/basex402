// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/X402ProtocolPioneers.sol";

/**
 * @title X402AirdropGasTest
 * @dev CRITICAL TEST: Airdrop gas consumption verification
 * This tests the most important requirement from handoff - ensuring airdrop stays under 20M gas
 */
contract X402AirdropGasTest is Test {
    X402ProtocolPioneers public nft;
    
    // Test addresses
    address public owner = address(0x1);
    address public serverWallet = address(0x2);
    address public royaltyReceiver = address(0x5);
    
    // Test constants
    string public constant BASE_URI = "https://api.example.com/metadata/";
    uint256 public constant MAX_GAS_LIMIT = 25_000_000; // Base network single tx limit
    uint256 public constant SAFETY_BUFFER_GAS = 20_000_000; // 20M safety buffer
    
    function setUp() public {
        vm.prank(owner);
        nft = new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            royaltyReceiver
        );
    }
    
    /**
     * @dev CRITICAL TEST: Server-Controlled Airdrop Gas Consumption
     * Updated to test new server wallet controlled airdrop (no longer automatic on 225th mint)
     */
    function test_AirdropGasConsumption() public {
        console.log("=== CRITICAL AIRDROP GAS TEST ===");
        
        vm.startPrank(serverWallet);
        
        // Test server wallet controlled airdrop (can execute anytime)
        assertFalse(nft.airdropCompleted());
        assertTrue(nft.canExecuteAirdrop());
        
        // CRITICAL: Measure gas for airdrop execution
        console.log("=== MEASURING AIRDROP GAS CONSUMPTION ===");
        
        uint256 gasBeforeAirdrop = gasleft();
        
        // Server wallet executes airdrop directly
        nft.executeAirdrop();
        
        uint256 gasAfterAirdrop = gasleft();
        uint256 airdropGasUsed = gasBeforeAirdrop - gasAfterAirdrop;
        
        console.log("=== AIRDROP GAS RESULTS ===");
        console.log("Total gas used for airdrop:", airdropGasUsed);
        console.log("Gas per airdropped NFT (47 total):", airdropGasUsed / 47);
        console.log("Base network single tx limit: 25000000");
        console.log("Gas usage percentage:", (airdropGasUsed * 100) / MAX_GAS_LIMIT);
        
        // Verify airdrop executed correctly
        assertEq(nft.totalSupply(), 47); // 47 NFTs airdropped
        assertTrue(nft.airdropCompleted());
        assertFalse(nft.canExecuteAirdrop());
        
        console.log("=== SAFETY CHECK ===");
        console.log("Gas used:", airdropGasUsed);
        console.log("Safety buffer: 20000000");
        if (airdropGasUsed < SAFETY_BUFFER_GAS) {
            console.log("Within safety buffer: true");
        } else {
            console.log("Within safety buffer: false");
        }
        
        // CRITICAL ASSERTION: Gas must be under safety buffer (20M gas)
        assertLt(airdropGasUsed, SAFETY_BUFFER_GAS, "Airdrop exceeds 20M gas safety buffer");
        
        console.log("AIRDROP GAS TEST PASSED!");
        
        vm.stopPrank();
    }
    
    /**
     * @dev Test wallet limits with airdrop
     */
    function test_WalletLimitsWithAirdrop() public {
        // Execute server-controlled airdrop
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        // Check airdrop recipients
        address recipient5NFTs = 0x6b4d1927e81338EA8330B36ea2096432662bfb70; // Gets 5 NFTs
        address recipient1NFT = 0x120f6EBdE2B8582C569903AC76A8F150bBd0a6BD;   // Gets 1 NFT
        
        assertEq(nft.mintedPerWallet(recipient5NFTs), 5);
        assertEq(nft.mintedPerWallet(recipient1NFT), 1);
        
        // Recipient with 5 should be at limit
        assertEq(nft.getRemainingMints(recipient5NFTs), 0);
        assertEq(nft.getRemainingMints(recipient1NFT), 4);
        
        // Try to mint to recipient who's at limit - should fail
        vm.prank(serverWallet);
        vm.expectRevert("Exceeds wallet limit");
        nft.mint(recipient5NFTs, "x402", "base-sepolia");
        
        console.log("WALLET LIMITS TEST PASSED!");
    }
    
    /**
     * @dev Test rarity tiers
     */
    function test_RarityTiers() public {
        assertEq(nft.getRarityTier(1), "Genesis");
        assertEq(nft.getRarityTier(10), "Genesis");
        assertEq(nft.getRarityTier(11), "Pioneer");
        assertEq(nft.getRarityTier(100), "Pioneer");
        assertEq(nft.getRarityTier(101), "Early Adopter");
        assertEq(nft.getRarityTier(225), "Early Adopter");
        assertEq(nft.getRarityTier(226), "Protocol User");
        assertEq(nft.getRarityTier(402), "Protocol User");
        
        console.log("RARITY TIERS TEST PASSED!");
    }
}