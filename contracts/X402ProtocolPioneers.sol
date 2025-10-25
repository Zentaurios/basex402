// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title X402ProtocolPioneers
 * @dev ERC-721 NFT collection proving early adoption of x402 payment protocol
 * Limited to 402 total NFTs with rarity tiers based on mint order
 */
contract X402ProtocolPioneers is ERC721, ERC2981, Ownable {
    using Strings for uint256;
    using EnumerableSet for EnumerableSet.UintSet;

    // Collection constants
    uint256 public constant MAX_SUPPLY = 402;
    uint256 public constant MAX_PUBLIC_SUPPLY = 355; // Reserve last 47 for airdrop
    uint256 public constant AIRDROP_SIZE = 47;
    uint256 public constant MAX_PER_WALLET = 5;
    
    // Collection state
    uint256 public totalSupply;
    address public serverWallet;
    string private _baseTokenURI;
    
    // Royalty state
    address public royaltyReceiver;
    uint96 public royaltyBasisPoints; // In basis points (e.g., 1000 = 10%)
    
    // Airdrop state
    bool public airdropCompleted = false;
    
    // Per-wallet minting limits
    mapping(address => uint256) public mintedPerWallet;
    
    // Collection metadata constant
    string public constant COLLECTION_ID = "x402-protocol-pioneers";
    
    // EnumerableSet for tracking tokens owned by each address
    mapping(address => EnumerableSet.UintSet) private _tokensOwned;
    
    // Mint data for metadata generation
    struct MintData {
        uint256 timestamp;
        string paymentMethod;
        string network;
    }
    
    // Struct for returning NFT data with metadata
    struct TokenWithMetadata {
        uint256 tokenId;
        string tokenURI;
        string rarityTier;
        MintData mintData;
    }
    
    mapping(uint256 => MintData) public mintData;
    
    // Events
    event ServerWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TokenMinted(address indexed to, uint256 indexed tokenId, string paymentMethod);
    event AirdropExecuted(uint256 totalRecipients, uint256 totalNFTs);
    event BaseURIUpdated(string indexed oldURI, string indexed newURI);
    event RoyaltyReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event RoyaltyBasisPointsUpdated(uint96 oldBasisPoints, uint96 newBasisPoints);

    constructor(
        address _serverWallet,
        string memory _baseURI,
        address _royaltyReceiver
    ) ERC721("x402 Protocol Pioneers", "X402") Ownable(msg.sender) {
        require(_serverWallet != address(0), "Server wallet cannot be zero address");
        require(_royaltyReceiver != address(0), "Royalty receiver cannot be zero address");
        
        serverWallet = _serverWallet;
        _baseTokenURI = _baseURI;
        royaltyReceiver = _royaltyReceiver;
        royaltyBasisPoints = 1000; // Default 10% royalty
        
        // Set default royalty info for ERC2981
        _setDefaultRoyalty(_royaltyReceiver, 1000);
    }

    /**
     * @dev Modifier to restrict minting to server wallet only
     */
    modifier onlyServerWallet() {
        require(msg.sender == serverWallet, "Only server wallet can mint");
        _;
    }
    
    /**
     * @dev Modifier to enforce per-wallet minting limits
     */
    modifier withinWalletLimit(address to, uint256 amount) {
        require(mintedPerWallet[to] + amount <= MAX_PER_WALLET, "Exceeds wallet limit");
        _;
    }

    /**
     * @dev Override _update to maintain EnumerableSet tracking
     * This is called on mint, transfer, and burn
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Remove from previous owner's set (if not minting)
        if (from != address(0)) {
            _tokensOwned[from].remove(tokenId);
        }
        
        // Add to new owner's set (if not burning)
        if (to != address(0)) {
            _tokensOwned[to].add(tokenId);
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Get all NFTs owned by an address with full metadata
     * This is a single RPC call that returns complete NFT data
     * @param owner The address to query
     * @return Array of TokenWithMetadata structs containing all NFT data
     */
    function getNFTsOwned(address owner) 
        public 
        view 
        returns (TokenWithMetadata[] memory) 
    {
        uint256 balance = _tokensOwned[owner].length();
        TokenWithMetadata[] memory tokens = new TokenWithMetadata[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = _tokensOwned[owner].at(i);
            tokens[i] = TokenWithMetadata({
                tokenId: tokenId,
                tokenURI: tokenURI(tokenId),
                rarityTier: getRarityTier(tokenId),
                mintData: mintData[tokenId]
            });
        }
        
        return tokens;
    }
    
    /**
     * @dev Get just the token IDs owned by an address
     * More gas efficient if you only need the IDs
     * @param owner The address to query
     * @return Array of token IDs
     */
    function getTokenIdsOwned(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = _tokensOwned[owner].length();
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = _tokensOwned[owner].at(i);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get the number of NFTs owned by an address
     * @param owner The address to query
     * @return Number of NFTs owned
     */
    function balanceOf(address owner) 
        public 
        view 
        override 
        returns (uint256) 
    {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _tokensOwned[owner].length();
    }

    /**
     * @dev Mint a new x402 Protocol Pioneer NFT
     * Can only be called by the designated server wallet
     * @param to Address to mint the NFT to
     * @param paymentMethod Always "x402" for privacy
     * @param network Network where payment was made ("base" or "base-sepolia")
     */
    function mint(
        address to,
        string calldata paymentMethod,
        string calldata network
    ) public onlyServerWallet withinWalletLimit(to, 1) {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply < MAX_PUBLIC_SUPPLY, "Public minting closed - airdrop slots reserved");
        require(
            keccak256(abi.encodePacked(paymentMethod)) == keccak256(abi.encodePacked("x402")),
            "Payment method must be 'x402'"
        );

        uint256 tokenId = totalSupply + 1;
        totalSupply++;

        // Store mint data for metadata
        mintData[tokenId] = MintData({
            timestamp: block.timestamp,
            paymentMethod: paymentMethod,
            network: network
        });
        
        // Track mints per wallet
        mintedPerWallet[to]++;

        _mint(to, tokenId);
        emit TokenMinted(to, tokenId, paymentMethod);
    }

    /**
     * @dev Batch mint multiple NFTs
     * @param recipients Array of addresses to mint to
     * @param paymentMethods Array of payment methods
     * @param networks Array of networks
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata paymentMethods,
        string[] calldata networks
    ) external onlyServerWallet {
        require(
            recipients.length == paymentMethods.length && 
            paymentMethods.length == networks.length,
            "Array lengths must match"
        );
        require(totalSupply + recipients.length <= MAX_PUBLIC_SUPPLY, "Would exceed public supply - airdrop slots reserved");
        
        // Pre-validate all recipients don't exceed wallet limits
        for (uint256 i = 0; i < recipients.length; i++) {
            require(mintedPerWallet[recipients[i]] < MAX_PER_WALLET, "Recipient would exceed wallet limit");
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], paymentMethods[i], networks[i]);
        }
    }

    /**
     * @dev Internal function to execute the full airdrop
     * Called by executeAirdrop() function when server wallet triggers it
     * Optimized for gas efficiency
     */
    function _executeFullAirdrop() internal {
        require(!airdropCompleted, "Airdrop already completed");
        require(totalSupply + 47 <= MAX_SUPPLY, "Airdrop would exceed max supply");
        
        airdropCompleted = true;
        
        // Gas-optimized airdrop data: recipients and amounts
        address[27] memory recipients = [
            0x6b4d1927e81338EA8330B36ea2096432662bfb70,
            0x68D79808A9757f5a29393a67BFc17dff1396F8a9,
            0x416AA2d7adBB3F599F42768636a761C9BAF0C8E4,
            0xad9cC1a85e74Bd1300c57082ba86Ed21E6AAA5e8,
            0xB3CcE18DDA084502ba37a454563fF835559f89a8,
            0x003bd719c43D683335513e1435Ff976FE73Ab65E,
            0x18717190340A530A4b74BfA823CdC70fDC7d813B,
            0x5660E1a26B68f50B4DabB92d4271aa5035b476ac,
            0x5bD75193b70050A40EDDFb13d1AA1851236d1012,
            0x968974717B8209006a661657c1F2852ffc6870bd,
            0xBc364A87a5257957679BaDEcE3E3610FaaA91511,
            0xe68bc10cB855b108dedc1cFE6E77B089d46CD45A,
            0x120f6EBdE2B8582C569903AC76A8F150bBd0a6BD,
            0x1DB3FEd7AaA3418AAACA6d2094717Dc214f1b0c2,
            0x3D5AE9E34ab7d7b06156cF831f73A9955619f28f,
            0x461acd846B4cc249b96242F1AB7c72a39d94747c,
            0x703EDc0c7e64d30F52073650bf7860b26d9949cF,
            0x78f52b01D061b8C71f8ACBC8fDc7D111C9d6d9F9,
            0x7F854378EC0D23346f16F17A161383CDd00438Bd,
            0x8B6B94Bab1097E7c2c06D16cf48A9e8959DB92F8,
            0x8e225dae9B895Ea75feE06c64E1899CbA23355EA,
            0x943590A42C27D08e3744202c4Ae5eD55c2dE240D,
            0xA487b2e2B9028D3C6b9783fe517519f108c133ce,
            0xB458D89B71a1ad74Ff5D509B96e666c1B0130C28,
            0xc54A1BdB11D728373c79db86F042582aD9F04452,
            0xc634c79097ae12C3c6484aDad9cF4d91aA7B6e2a,
            0xf1eFAf60F6a3d28b78D2614E08200d379DF4d591
        ];
        
        uint8[27] memory amounts = [5,4,3,3,3,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
        
        // Optimized mint loop
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            
            for (uint256 j = 0; j < amount; j++) {
                uint256 tokenId = totalSupply + 1;
                totalSupply++;
                
                // Minimal storage writes for gas optimization
                mintData[tokenId] = MintData({
                    timestamp: block.timestamp,
                    paymentMethod: "x402",
                    network: "base"
                });
                
                mintedPerWallet[recipient]++;
                _mint(recipient, tokenId);
                emit TokenMinted(recipient, tokenId, "x402");
            }
        }
        
        emit AirdropExecuted(recipients.length, 47);
    }
    
    /**
     * @dev Execute the full airdrop (server wallet controlled)
     * Can be called by server wallet when ready to distribute airdrop
     */
    function executeAirdrop() external onlyServerWallet {
        _executeFullAirdrop();
    }
    
    /**
     * @dev Check if airdrop can be executed
     * @return Boolean indicating if airdrop is ready and not completed
     */
    function canExecuteAirdrop() external view returns (bool) {
        return !airdropCompleted;
    }
    
    /**
     * @dev Get airdrop status information
     * @return ready Can airdrop be started (always true if not completed)
     * @return completed Is airdrop fully completed
     */
    function getAirdropStatus() external view returns (
        bool ready,
        bool completed
    ) {
        ready = !airdropCompleted;
        completed = airdropCompleted;
    }
    
    /**
     * @dev Get remaining mints available for a wallet
     * @param wallet The wallet address to check
     * @return Number of NFTs the wallet can still mint
     */
    function getRemainingMints(address wallet) external view returns (uint256) {
        if (mintedPerWallet[wallet] >= MAX_PER_WALLET) {
            return 0;
        }
        return MAX_PER_WALLET - mintedPerWallet[wallet];
    }
    
    /**
     * @dev Get rarity tier for a given token ID
     * @param tokenId The token ID to check
     * @return Rarity tier name
     */
    function getRarityTier(uint256 tokenId) public pure returns (string memory) {
        require(tokenId > 0 && tokenId <= MAX_SUPPLY, "Token ID out of range");
        
        if (tokenId <= 10) return "Genesis";
        if (tokenId <= 100) return "Pioneer";
        if (tokenId <= 225) return "Early Adopter";
        return "Protocol User";
    }

    /**
     * @dev Returns the token URI for OpenSea metadata
     * @param tokenId The token ID to get URI for
     * @return Token URI pointing to metadata endpoint
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token does not exist");
        
        return string(abi.encodePacked(
            _baseTokenURI, 
            tokenId.toString(),
            "?collection=",
            COLLECTION_ID
        ));
    }

    /**
     * @dev Update the server wallet address (owner only)
     * @param _newServerWallet New server wallet address
     */
    function updateServerWallet(address _newServerWallet) external onlyOwner {
        require(_newServerWallet != address(0), "Server wallet cannot be zero address");
        address oldWallet = serverWallet;
        serverWallet = _newServerWallet;
        emit ServerWalletUpdated(oldWallet, _newServerWallet);
    }

    /**
     * @dev Update the base URI for metadata (owner only)
     * @param _newBaseURI New base URI
     */
    function updateBaseURI(string calldata _newBaseURI) external onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(oldURI, _newBaseURI);
    }

    /**
     * @dev Get the base URI
     * @return Current base URI
     */
    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Check if collection is sold out
     * @return Boolean indicating if sold out
     */
    function isSoldOut() external view returns (bool) {
        return totalSupply >= MAX_SUPPLY;
    }

    /**
     * @dev Get remaining supply
     * @return Number of NFTs remaining to mint
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply;
    }

    /**
     * @dev Get mint data for a token (for metadata generation)
     * @param tokenId Token ID to get data for
     * @return MintData struct with timestamp, payment method, and network
     */
    function getMintData(uint256 tokenId) external view returns (MintData memory) {
        require(tokenId > 0 && tokenId <= totalSupply, "Token does not exist");
        return mintData[tokenId];
    }

    /**
     * @dev OpenSea contract-level metadata
     * @return Contract metadata URI
     */
    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked(_baseTokenURI, "contract"));
    }

    /**
     * @dev Update the royalty receiver address (owner only)
     * @param _newReceiver New royalty receiver address
     */
    function updateRoyaltyReceiver(address _newReceiver) external onlyOwner {
        require(_newReceiver != address(0), "Royalty receiver cannot be zero address");
        address oldReceiver = royaltyReceiver;
        royaltyReceiver = _newReceiver;
        
        // Update ERC2981 default royalty receiver
        _setDefaultRoyalty(_newReceiver, royaltyBasisPoints);
        
        emit RoyaltyReceiverUpdated(oldReceiver, _newReceiver);
    }

    /**
     * @dev Update the royalty percentage (owner only)
     * @param _newBasisPoints New royalty in basis points (0-1000 = 0-10%)
     */
    function updateRoyaltyBasisPoints(uint96 _newBasisPoints) external onlyOwner {
        require(_newBasisPoints <= 1000, "Royalty cannot exceed 10%");
        uint96 oldBasisPoints = royaltyBasisPoints;
        royaltyBasisPoints = _newBasisPoints;
        
        // Update ERC2981 default royalty
        _setDefaultRoyalty(royaltyReceiver, _newBasisPoints);
        
        emit RoyaltyBasisPointsUpdated(oldBasisPoints, _newBasisPoints);
    }

    /**
     * @dev Get current royalty settings
     * @return receiver Address receiving royalties
     * @return basisPoints Royalty percentage in basis points
     */
    function getRoyaltyInfo() external view returns (address receiver, uint96 basisPoints) {
        return (royaltyReceiver, royaltyBasisPoints);
    }

    /**
     * @dev Withdraw any accidentally sent ETH (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Support for ERC-165 interface detection
     * Includes support for ERC721 and ERC2981 (royalty standard)
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
