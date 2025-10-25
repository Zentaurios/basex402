// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Client.sol";
import "./IRouterClient.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title CCIPReceiver
 * @dev Minimal implementation for compilation
 */
abstract contract CCIPReceiver is ERC165 {
    address internal immutable i_router;

    constructor(address router) {
        require(router != address(0), "Router cannot be zero address");
        i_router = router;
    }

    function getRouter() public view returns (address) {
        return i_router;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(CCIPReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external virtual {
        require(msg.sender == i_router, "Only router can call");
        _ccipReceive(message);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal virtual;
}
