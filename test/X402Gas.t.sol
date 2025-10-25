// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/X402ProtocolPioneers.sol";

contract X402GasTest is Test {
    X402ProtocolPioneers public nft;
    
    address public owner = address(0x1);
    address public serverWallet = address(0x2);
    address public user1 = address(0x3);
    address public royaltyReceiver = address(0x5);
    
    string public constant BASE_URI = "https://api.example.com/metadata/";
    
    function setUp() public {
        vm.prank(owner);
        nft = new X402ProtocolPioneers(
            serverWallet,
            BASE_URI,
            royaltyReceiver
        );
    }
    
    function testGas_SingleMint() public {
        vm.prank(serverWallet);
        uint256 gasBefore = gasleft();
        nft.mint(user1, "x402", "base-sepolia");
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Single mint gas used:", gasUsed);
        
        // EnumerableSet adds ~40k gas per mint for ownership tracking
        // This enables querying all NFTs owned by an address on-chain!
        assertLt(gasUsed, 250_000);
    }
    
    function testGas_BatchMint() public {
        address[] memory recipients = new address[](10);
        string[] memory paymentMethods = new string[](10);
        string[] memory networks = new string[](10);
        
        for (uint i = 0; i < 10; i++) {
            recipients[i] = address(uint160(0x1000 + i));
            paymentMethods[i] = "x402";
            networks[i] = "base-sepolia";
        }
        
        vm.prank(serverWallet);
        uint256 gasBefore = gasleft();
        nft.batchMint(recipients, paymentMethods, networks);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Batch mint (10 tokens) gas used:", gasUsed);
        console.log("Gas per token in batch:", gasUsed / 10);
        
        // EnumerableSet adds gas cost, but enables on-chain NFT queries
        // Trade-off: ~40k extra gas per mint for zero-dependency ownership tracking
        assertLt(gasUsed / 10, 220_000);
    }
    
    function testGas_TokenURIGeneration() public {
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        uint256 gasBefore = gasleft();
        string memory uri = nft.tokenURI(1);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("TokenURI generation gas used:", gasUsed);
        console.log("URI:", uri);
        
        // URI generation should be efficient
        assertLt(gasUsed, 50_000);
    }
    
    function testGas_RarityTierLookup() public {
        uint256 gasBefore = gasleft();
        string memory tier1 = nft.getRarityTier(1);
        uint256 gasUsed1 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        string memory tier100 = nft.getRarityTier(100);
        uint256 gasUsed2 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        string memory tier402 = nft.getRarityTier(402);
        uint256 gasUsed3 = gasBefore - gasleft();
        
        console.log("Rarity tier lookup gas - Token 1:", gasUsed1);
        console.log("Rarity tier lookup gas - Token 100:", gasUsed2);
        console.log("Rarity tier lookup gas - Token 402:", gasUsed3);
        
        console.log("Tier 1:", tier1);
        console.log("Tier 100:", tier100);
        console.log("Tier 402:", tier402);
        
        // All lookups should use similar gas (constant time)
        assertLt(gasUsed1, 10_000);
        assertLt(gasUsed2, 10_000);
        assertLt(gasUsed3, 10_000);
    }
    
    function testGas_ServerWalletUpdate() public {
        address newWallet = address(0x99);
        
        vm.prank(owner);
        uint256 gasBefore = gasleft();
        nft.updateServerWallet(newWallet);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Server wallet update gas used:", gasUsed);
        
        // Simple storage update should be cheap
        assertLt(gasUsed, 30_000);
    }
    
    function testGas_BaseURIUpdate() public {
        string memory newURI = "https://new-api.example.com/metadata/";
        
        vm.prank(owner);
        uint256 gasBefore = gasleft();
        nft.updateBaseURI(newURI);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Base URI update gas used:", gasUsed);
        
        // String storage update
        assertLt(gasUsed, 50_000);
    }
    
    function testGas_SupplyQueries() public {
        uint256 gasBefore = gasleft();
        uint256 total = nft.totalSupply();
        uint256 gasUsed1 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        uint256 remaining = nft.remainingSupply();
        uint256 gasUsed2 = gasBefore - gasleft();
        
        gasBefore = gasleft();
        bool soldOut = nft.isSoldOut();
        uint256 gasUsed3 = gasBefore - gasleft();
        
        console.log("totalSupply() gas:", gasUsed1);
        console.log("remainingSupply() gas:", gasUsed2);
        console.log("isSoldOut() gas:", gasUsed3);
        
        console.log("Total:", total);
        console.log("Remaining:", remaining);
        console.log("Sold out:", soldOut);
        
        // View functions should be very cheap
        assertLt(gasUsed1, 10_000);
        assertLt(gasUsed2, 10_000);
        assertLt(gasUsed3, 10_000);
    }
    
    function testGas_MintDataRetrieval() public {
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        uint256 gasBefore = gasleft();
        X402ProtocolPioneers.MintData memory data = nft.getMintData(1);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("getMintData() gas:", gasUsed);
        console.log("Payment method:", data.paymentMethod);
        console.log("Network:", data.network);
        console.log("Timestamp:", data.timestamp);
        
        // Struct retrieval should be reasonable
        assertLt(gasUsed, 20_000);
    }
    
    function testGas_ContractURIGeneration() public {
        uint256 gasBefore = gasleft();
        string memory contractURI = nft.contractURI();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("contractURI() gas:", gasUsed);
        console.log("Contract URI:", contractURI);
        
        // String concatenation should be efficient
        assertLt(gasUsed, 15_000);
    }
    
    // CCIP functionality has been removed from contract
    // Destination program tests are no longer applicable
    
    function testGas_AirdropGasConsumption() public {
        console.log("=== CRITICAL AIRDROP GAS TEST ===");
        
        vm.startPrank(serverWallet);
        
        // Test direct airdrop execution (much simpler!)
        console.log("Testing server wallet controlled airdrop...");
        
        assertFalse(nft.airdropCompleted());
        
        // CRITICAL: Measure gas for airdrop execution
        uint256 gasBefore = gasleft();
        nft.executeAirdrop();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("AIRDROP GAS RESULTS:");
        console.log("Total gas for 47 airdrop NFTs:", gasUsed);
        console.log("Base network limit: 25000000");
        console.log("Gas usage percentage:", (gasUsed * 100) / 25_000_000);
        if (gasUsed < 20_000_000) {
            console.log("Safety margin (should be <20M): true");
        } else {
            console.log("Safety margin (should be <20M): false");
        }
        
        // Verify airdrop completed
        assertEq(nft.totalSupply(), 47); // 47 NFTs airdropped
        assertTrue(nft.airdropCompleted());
        
        // CRITICAL ASSERTION: Must be under 20M gas safety buffer
        assertLt(gasUsed, 20_000_000, "Airdrop exceeds 20M gas safety buffer");
        
        // Additional detailed logging for analysis
        console.log("Gas per airdropped NFT:", gasUsed / 47);
        
        vm.stopPrank();
    }
    
    function testGas_CompareViewFunctionCosts() public {
        vm.prank(serverWallet);
        nft.mint(user1, "x402", "base-sepolia");
        
        // Test multiple view functions
        uint256[] memory gasCosts = new uint256[](7);
        
        uint256 gasBefore = gasleft();
        nft.name();
        gasCosts[0] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.symbol();
        gasCosts[1] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.totalSupply();
        gasCosts[2] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.ownerOf(1);
        gasCosts[3] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.tokenURI(1);
        gasCosts[4] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.getRarityTier(1);
        gasCosts[5] = gasBefore - gasleft();
        
        gasBefore = gasleft();
        nft.getMintData(1);
        gasCosts[6] = gasBefore - gasleft();
        
        console.log("View function gas costs:");
        console.log("name():", gasCosts[0]);
        console.log("symbol():", gasCosts[1]);
        console.log("totalSupply():", gasCosts[2]);
        console.log("ownerOf():", gasCosts[3]);
        console.log("tokenURI():", gasCosts[4]);
        console.log("getRarityTier():", gasCosts[5]);
        console.log("getMintData():", gasCosts[6]);
        
        // All view functions should be reasonably cheap
        for (uint i = 0; i < gasCosts.length; i++) {
            assertLt(gasCosts[i], 50_000);
        }
    }
}
