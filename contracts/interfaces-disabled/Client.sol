// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Client Library for CCIP
 * @dev Minimal implementation for compilation
 */
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }
    
    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
        bytes extraArgs;
        address feeToken;
    }
    
    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EVMTokenAmount[] destTokenAmounts;
    }
    
    struct EVMExtraArgsV1 {
        uint256 gasLimit;
    }
    
    function _argsToBytes(EVMExtraArgsV1 memory extraArgs) internal pure returns (bytes memory) {
        return abi.encode(extraArgs);
    }
}
