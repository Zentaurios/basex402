'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type NFTWithMetadata } from '@/app/actions/nft-balances';
import { 
  verifyNFTOwnership, 
  getNFTTransferData
} from '@/app/actions/send-nft';
import { isValidAddress } from '@/lib/utils/validation';
import { 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../WalletProvider';
import { useWalletClient, usePublicClient } from 'wagmi';
import { useEvmAddress, useSendEvmTransaction } from '@coinbase/cdp-hooks';
import { encodeFunctionData } from 'viem';

interface SendNFTModalProps {
  nft: NFTWithMetadata;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendStep = 'input' | 'confirming' | 'sending' | 'success' | 'error';

// ERC-721 ABI for safeTransferFrom
const ERC721_SAFE_TRANSFER_ABI = [{
  inputs: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'tokenId', type: 'uint256' }
  ],
  name: 'safeTransferFrom',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
}] as const;

export function SendNFTModal({ nft, onClose, onSuccess }: SendNFTModalProps) {
  const { address, walletType } = useWallet();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // CDP hooks for embedded wallet
  const { evmAddress: cdpAddress } = useEvmAddress();
  const { sendEvmTransaction } = useSendEvmTransaction();
  
  const [recipientAddress, setRecipientAddress] = useState('');
  const [step, setStep] = useState<SendStep>('input');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const explorerUrl = isMainnet 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org';
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT as `0x${string}`;

  const validateAndPrepare = async () => {
    setError('');

    // Validate address format
    if (!isValidAddress(recipientAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    // Check not sending to self
    if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
      setError('Cannot send NFT to yourself');
      return;
    }

    // Verify ownership
    setStep('confirming');
    const ownership = await verifyNFTOwnership(nft.tokenId, address || '');
    
    if (!ownership.isOwner) {
      setError('You do not own this NFT');
      setStep('error');
      return;
    }

    // All checks passed, ready to send
    await handleSend();
  };

  const handleSend = async () => {
    try {
      setStep('sending');
      setError('');

      if (!address) {
        throw new Error('No wallet connected');
      }

      if (!nftContractAddress) {
        throw new Error('NFT contract address not configured');
      }

      let hash: string;

      if (walletType === 'external' && walletClient) {
        // External wallet (wagmi) - use encoded transaction data
        const txData = await getNFTTransferData(
          address,
          recipientAddress,
          nft.tokenId
        );

        hash = await walletClient.sendTransaction({
          to: txData.to,
          data: txData.data,
          value: txData.value,
        });
      } else if (walletType === 'embedded') {
        // Embedded wallet - use CDP's useSendCall hook
        
        // SECURITY CHECK: Verify the CDP address matches the connected address
        if (!cdpAddress || cdpAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Wallet address mismatch. Please reconnect your wallet.');
        }

        console.log('📤 Sending NFT transfer using embedded wallet...');
        console.log('🔒 From address (verified):', address);
        console.log('📥 To address:', recipientAddress);
        console.log('🎨 Token ID:', nft.tokenId.toString());
        
        // Encode the safeTransferFrom call
        const data = encodeFunctionData({
          abi: ERC721_SAFE_TRANSFER_ABI,
          functionName: 'safeTransferFrom',
          args: [
            address as `0x${string}`, // CRITICAL: Use the verified connected address
            recipientAddress as `0x${string}`,
            nft.tokenId
          ],
        });

        // Use CDP's sendEvmTransaction to execute the transaction
        const network = isMainnet ? 'base' : 'base-sepolia';
        // Provide chainId required by AllowedEvmTransactionType
        const chainId = isMainnet ? 8453 : 84531;
        
        const result = await sendEvmTransaction({
          transaction: {
            to: nftContractAddress,
            data,
            value: 0n,
            chainId,
          },
          evmAccount: cdpAddress,
          network: network as any,
        });

        hash = result.transactionHash;
        console.log('✅ NFT transfer submitted:', hash);
        
        // Wait for confirmation
        if (publicClient) {
          console.log('⏳ Waiting for transaction confirmation...');
          await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
          console.log('✅ NFT transfer confirmed');
        }
      } else {
        throw new Error('Wallet not properly connected');
      }

      setTxHash(hash);

      // Wait for transaction confirmation for external wallets
      if (publicClient && walletType === 'external') {
        await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      }

      setStep('success');
      
      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error sending NFT:', err);
      setError(err instanceof Error ? err.message : 'Failed to send NFT');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step !== 'sending') {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          Send NFT
        </h3>
        <button
          onClick={handleClose}
          disabled={step === 'sending'}
          className="p-1 rounded-lg transition-colors hover:bg-opacity-80 disabled:opacity-50"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* NFT Info */}
      <div 
        className="p-3 rounded-lg flex items-center space-x-3"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: 'var(--card-border)' }}
        >
          #{nft.tokenId.toString()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            x402 Pioneer #{nft.tokenId.toString()}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {nft.rarityTier}
          </p>
        </div>
      </div>

      {/* Input Step */}
      {step === 'input' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ 
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {error && (
            <div 
              className="p-3 rounded-lg flex items-start space-x-2"
              style={{ backgroundColor: 'var(--negative)/10', border: '1px solid var(--negative)/20' }}
            >
              <AlertCircle className="w-4 h-4 text-negative flex-shrink-0 mt-0.5" />
              <p className="text-xs text-negative">{error}</p>
            </div>
          )}

          <button
            onClick={validateAndPrepare}
            disabled={!recipientAddress}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium bg-base-blue text-white hover:bg-base-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Send NFT</span>
          </button>
        </div>
      )}

      {/* Confirming Step */}
      {step === 'confirming' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Verifying ownership...
          </p>
        </div>
      )}

      {/* Sending Step */}
      {step === 'sending' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-base-blue" />
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Sending NFT...
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {walletType === 'external' 
                ? 'Please confirm in your wallet'
                : 'Processing transaction...'}
            </p>
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--positive)/10' }}
          >
            <CheckCircle className="w-10 h-10 text-positive" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              NFT Sent Successfully!
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Your NFT has been transferred
            </p>
          </div>
          {txHash && (
            <Link
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-base-blue hover:underline"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--negative)/10' }}
          >
            <AlertCircle className="w-10 h-10 text-negative" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Transfer Failed
            </p>
            <p className="text-xs px-4" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => {
              setStep('input');
              setError('');
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
