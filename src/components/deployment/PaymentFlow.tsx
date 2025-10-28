'use client';

import { useState } from 'react';
import { useEvmAddress, useSendEvmTransaction } from "@coinbase/cdp-hooks";
// Using custom button instead of CDP React components
// import { Button } from "@coinbase/cdp-react";

// Simple Button component
const Button = ({ children, onClick, disabled, className, variant }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      variant === 'secondary'
        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        : className || 'bg-blue-600 text-white hover:bg-blue-700'
    }`}
  >
    {children}
  </button>
);

// Simple Loading Skeleton
const LoadingSkeleton = ({ className }: any) => (
  <div className={`animate-spin ${className || 'w-8 h-8'}`}>
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

import { 
  Zap, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';
const explorerUrl = isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org';

// Contract templates
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  gasEstimate: string;
  paymentAmount: string; // in USDC (human readable)
  paymentAmountWei: string; // in wei/atomic units
}

// Payment states
type PaymentState = 
  | 'idle' 
  | 'initiating' 
  | 'awaiting-payment' 
  | 'processing' 
  | 'deploying' 
  | 'success' 
  | 'error';

interface PaymentFlowProps {
  template: ContractTemplate;
  onSuccess?: (contractAddress: string, transactionHash: string) => void;
  onCancel?: () => void;
}

export function PaymentFlow({ template, onSuccess, onCancel }: PaymentFlowProps) {
  const { evmAddress } = useEvmAddress();
  const { sendEvmTransaction } = useSendEvmTransaction();
  
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<string | null>(null);
  
  const handleInitiatePayment = async () => {
    if (!evmAddress) {
      setError('No wallet address found');
      return;
    }

    try {
      setPaymentState('initiating');
      setError(null);

      // Step 1: Send HTTP request to deployment endpoint (will respond with 402)
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          walletAddress: evmAddress,
        }),
      });

      if (response.status === 402) {
        // Expected: Payment Required
        const paymentInfo = await response.json();
        
        setPaymentState('awaiting-payment');
        
        // Step 2: Process the x402 payment via embedded wallet
        await processX402Payment(paymentInfo);
        
      } else if (response.ok) {
        // Unexpected: should have gotten 402
        throw new Error('Expected payment required response');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setPaymentState('error');
    }
  };

  const processX402Payment = async (paymentInfo: any) => {
    try {
      setPaymentState('processing');

      // Use embedded wallet to send USDC payment
      const { transactionHash } = await sendEvmTransaction({
        transaction: {
          to: paymentInfo.recipientAddress,
          value: BigInt(paymentInfo.amount), // Amount in wei/atomic units
          chainId: isMainnet ? 8453 : 84532, // Base : Base Sepolia
          type: "eip1559",
        },
        evmAccount: evmAddress!,
        network: (isMainnet ? "base" : "base-sepolia") as any,
      });

      setPaymentTxHash(transactionHash);
      
      // Step 3: Submit payment proof and trigger deployment
      await submitPaymentProof(transactionHash, paymentInfo.sessionId);
      
    } catch (err) {
      console.error('Payment processing failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPaymentState('error');
    }
  };

  const submitPaymentProof = async (txHash: string, sessionId: string) => {
    try {
      setPaymentState('deploying');

      const response = await fetch('/api/deploy/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentTransactionHash: txHash,
          templateId: template.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setContractAddress(result.contractAddress);
        setDeploymentTxHash(result.deploymentTransactionHash);
        setPaymentState('success');
        
        if (onSuccess) {
          onSuccess(result.contractAddress, result.deploymentTransactionHash);
        }
      } else {
        throw new Error('Deployment failed');
      }
    } catch (err) {
      console.error('Deployment failed:', err);
      setError(err instanceof Error ? err.message : 'Deployment failed');
      setPaymentState('error');
    }
  };

  const getStateIcon = () => {
    switch (paymentState) {
      case 'idle':
        return <CreditCard className="w-8 h-8 text-base-blue" />;
      case 'initiating':
      case 'processing':
      case 'deploying':
        return <LoadingSkeleton className="w-8 h-8 rounded-full" />;
      case 'awaiting-payment':
        return <Clock className="w-8 h-8 text-warning animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-positive" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-negative" />;
      default:
        return <CreditCard className="w-8 h-8 text-base-blue" />;
    }
  };

  const getStateMessage = () => {
    switch (paymentState) {
      case 'idle':
        return `Ready to deploy ${template.name}`;
      case 'initiating':
        return 'Initiating x402 payment...';
      case 'awaiting-payment':
        return 'Confirm payment in your wallet';
      case 'processing':
        return 'Processing payment...';
      case 'deploying':
        return `Deploying ${template.name} to ${networkName}...`;
      case 'success':
        return 'Contract deployed successfully!';
      case 'error':
        return 'Deployment failed';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white border border-base-gray-100 rounded-lg p-8 max-w-lg mx-auto">
      <div className="text-center">
        {/* State Icon */}
        <div className="w-20 h-20 bg-base-gray-25 rounded-full flex items-center justify-center mx-auto mb-6">
          {getStateIcon()}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-base-black mb-2">
          {paymentState === 'success' ? 'Deployment Complete!' : 'Deploy Contract'}
        </h3>

        {/* State Message */}
        <p className="text-gray-700 mb-6">{getStateMessage()}</p>

        {/* Contract Details */}
        <div className="bg-base-gray-25 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-base-black mb-2">Contract Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Template:</span>
              <span className="font-mono text-base-black">{template.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Network:</span>
              <span className="font-mono text-base-black">{networkName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className="font-mono text-base-black">{template.paymentAmount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gas Estimate:</span>
              <span className="font-mono text-base-black">{template.gasEstimate}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-negative/5 border border-negative/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-negative">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-gray-700 mt-2">{error}</p>
          </div>
        )}

        {/* Transaction Links */}
        {(paymentTxHash || deploymentTxHash || contractAddress) && (
          <div className="bg-base-gray-25 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-base-black mb-3">Transaction Details</h4>
            <div className="space-y-2 text-sm">
              {paymentTxHash && (
                <div>
                  <span className="text-gray-600 block">Payment Transaction:</span>
                  <a
                    href={`${explorerUrl}/tx/${paymentTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-base-blue hover:underline flex items-center space-x-1"
                  >
                    <span>{paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {deploymentTxHash && (
                <div>
                  <span className="text-gray-600 block">Deployment Transaction:</span>
                  <a
                    href={`${explorerUrl}/tx/${deploymentTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-base-blue hover:underline flex items-center space-x-1"
                  >
                    <span>{deploymentTxHash.slice(0, 10)}...{deploymentTxHash.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {contractAddress && (
                <div>
                  <span className="text-gray-600 block">Contract Address:</span>
                  <a
                    href={`${explorerUrl}/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-base-blue hover:underline flex items-center space-x-1"
                  >
                    <span>{contractAddress}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {paymentState === 'idle' && (
            <>
              <Button
                onClick={handleInitiatePayment}
                disabled={!evmAddress}
                className="flex-1 bg-base-blue text-white hover:bg-base-black"
              >
                <Zap className="w-4 h-4 mr-2" />
                Deploy with x402
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="secondary"
                  className="px-6"
                >
                  Cancel
                </Button>
              )}
            </>
          )}

          {paymentState === 'success' && (
            <Button
              onClick={onCancel}
              className="flex-1 bg-positive text-white hover:bg-positive/90"
            >
              Deploy Another Contract
            </Button>
          )}

          {paymentState === 'error' && (
            <>
              <Button
                onClick={handleInitiatePayment}
                className="flex-1 bg-base-blue text-white hover:bg-base-black"
              >
                Try Again
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="secondary"
                  className="px-6"
                >
                  Cancel
                </Button>
              )}
            </>
          )}

          {['initiating', 'awaiting-payment', 'processing', 'deploying'].includes(paymentState) && onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={paymentState === 'processing' || paymentState === 'deploying'}
              className="px-6"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
