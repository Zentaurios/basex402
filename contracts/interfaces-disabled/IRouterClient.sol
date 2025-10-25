// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Client.sol";

/**
 * @title IRouterClient Interface
 * @dev Minimal implementation for compilation
 */
interface IRouterClient {
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external view returns (uint256 fee);
    
    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external payable returns (bytes32);
}
