// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/X402ProtocolPioneers.sol";

/**
 * @title X402AirdropTest
 * @dev Test server wallet controlled airdrop system
 */
contract X402AirdropTest is Test {
    X402ProtocolPioneers public nft;
    
    // Test addresses
    address public owner = address(0x1);
    address public serverWallet = address(0x2);
    address public user1 = address(0x3);
    address public royaltyReceiver = address(0x5);
    
    // Test constants
    string public constant BASE_URI = "https://api.example.com/metadata/";
    
    event AirdropExecuted(uint256 totalRecipients, uint256 totalNFTs);
    
    function setUp() public {
        vm.prank(owner);
        nft = new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            royaltyReceiver
        );
    }
    
    /**
     * @dev Test server wallet controlled airdrop execution
     */
    function test_ServerWalletAirdropExecution() public {
        console.log("=== TESTING SERVER WALLET CONTROLLED AIRDROP ===");
        
        // Initial state
        assertFalse(nft.airdropCompleted());
        assertTrue(nft.canExecuteAirdrop());
        assertEq(nft.totalSupply(), 0);
        
        // Execute airdrop directly (no need to mint 225 first!)
        vm.expectEmit(true, true, false, true);
        emit AirdropExecuted(27, 47);
        
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        // Verify airdrop completed
        assertTrue(nft.airdropCompleted());
        assertFalse(nft.canExecuteAirdrop());
        assertEq(nft.totalSupply(), 47); // 47 NFTs airdropped
        
        console.log("Airdrop executed successfully!");
        console.log("Total NFTs minted:", nft.totalSupply());
    }
    
    /**
     * @dev Test airdrop gas consumption (CRITICAL TEST)
     */
    function test_AirdropGasConsumption() public {
        console.log("=== CRITICAL AIRDROP GAS TEST ===");
        
        vm.prank(serverWallet);
        
        uint256 gasBefore = gasleft();
        nft.executeAirdrop();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== AIRDROP GAS RESULTS ===");
        console.log("Total gas used for airdrop:", gasUsed);
        console.log("Gas per airdropped NFT (47 total):", gasUsed / 47);
        console.log("Base network limit: 25000000");
        console.log("Gas usage percentage:", (gasUsed * 100) / 25_000_000);
        
        // CRITICAL: Must be under 20M gas safety buffer
        uint256 SAFETY_BUFFER = 20_000_000;
        console.log("Safety buffer (20M): 20000000");
        if (gasUsed < SAFETY_BUFFER) {
            console.log("Within safety buffer: true");
        } else {
            console.log("Within safety buffer: false");
        }
        
        assertLt(gasUsed, SAFETY_BUFFER, "Airdrop exceeds 20M gas safety buffer");
        
        console.log("AIRDROP GAS TEST PASSED!");
    }
    
    /**
     * @dev Test airdrop recipients and amounts
     */
    function test_AirdropRecipientsAndAmounts() public {
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        // Test known recipients
        address recipient5NFTs = 0x6b4d1927e81338EA8330B36ea2096432662bfb70; // Gets 5 NFTs
        address recipient4NFTs = 0x68D79808A9757f5a29393a67BFc17dff1396F8a9; // Gets 4 NFTs  
        address recipient1NFT = 0x120f6EBdE2B8582C569903AC76A8F150bBd0a6BD;   // Gets 1 NFT
        
        assertEq(nft.mintedPerWallet(recipient5NFTs), 5);
        assertEq(nft.mintedPerWallet(recipient4NFTs), 4);
        assertEq(nft.mintedPerWallet(recipient1NFT), 1);
        
        // Test wallet limits after airdrop
        assertEq(nft.getRemainingMints(recipient5NFTs), 0); // At limit
        assertEq(nft.getRemainingMints(recipient4NFTs), 1); // 1 more allowed
        assertEq(nft.getRemainingMints(recipient1NFT), 4);  // 4 more allowed
        
        console.log("All airdrop recipients received correct amounts!");
    }
    
    /**
     * @dev Test airdrop can only be executed once
     */
    function test_AirdropCanOnlyBeExecutedOnce() public {
        // Execute airdrop first time
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        assertTrue(nft.airdropCompleted());
        
        // Try to execute again - should fail
        vm.prank(serverWallet);
        vm.expectRevert("Airdrop already completed");
        nft.executeAirdrop();
    }
    
    /**
     * @dev Test only server wallet can execute airdrop
     */
    function test_OnlyServerWalletCanExecuteAirdrop() public {
        // Owner cannot execute
        vm.prank(owner);
        vm.expectRevert("Only server wallet can mint");
        nft.executeAirdrop();
        
        // Random user cannot execute
        vm.prank(user1);
        vm.expectRevert("Only server wallet can mint");
        nft.executeAirdrop();
        
        // But server wallet can
        vm.prank(serverWallet);
        nft.executeAirdrop();
        assertTrue(nft.airdropCompleted());
    }
    
    /**
     * @dev Test airdrop status functions
     */
    function test_AirdropStatusFunctions() public {
        // Before airdrop
        assertTrue(nft.canExecuteAirdrop());
        (bool ready, bool completed) = nft.getAirdropStatus();
        assertTrue(ready);
        assertFalse(completed);
        
        // Execute airdrop
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        // After airdrop
        assertFalse(nft.canExecuteAirdrop());
        (ready, completed) = nft.getAirdropStatus();
        assertFalse(ready);
        assertTrue(completed);
    }
    
    /**
     * @dev Test minting still works normally after airdrop
     */
    function test_MintingAfterAirdrop() public {
        // Execute airdrop first
        vm.prank(serverWallet);
        nft.executeAirdrop();
        
        uint256 supplyAfterAirdrop = nft.totalSupply();
        assertEq(supplyAfterAirdrop, 47);
        
        // Now mint normally
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        assertEq(nft.totalSupply(), supplyAfterAirdrop + 1);
        assertEq(nft.ownerOf(48), user1); // Should be token #48
        assertEq(nft.mintedPerWallet(user1), 1);
        
        console.log("Normal minting works after airdrop!");
    }
}
