'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, Check, ExternalLink, Loader2 } from 'lucide-react';
import { 
  useEvmAddress, 
  useSolanaAddress,
  useCurrentUser,
  useSendUserOperation,
  useSendSolanaTransaction 
} from '@coinbase/cdp-hooks';
import { formatTokenAmount } from '@/lib/utils/token';
import { parseUnits, encodeFunctionData } from 'viem';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { filterTokens, sortTokens, type FilteredToken } from '@/lib/tokens';

type TokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    symbol?: string;
    name?: string;
    contractAddress?: string; // EVM
    mintAddress?: string;     // Solana
  };
};

type SendTabProps = {
  chain: 'ethereum' | 'solana';
  userAddress: string;
  balances: TokenBalance[];
};

type TransactionState = 'idle' | 'confirming' | 'sending' | 'success' | 'error';

// ERC-20 ABI for transfer function
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function SendTab({ chain, userAddress, balances }: SendTabProps) {
  const { evmAddress } = useEvmAddress();
  const { solanaAddress } = useSolanaAddress();
  const { currentUser } = useCurrentUser();
  
  // CDP hooks for sending transactions
  const { sendUserOperation } = useSendUserOperation();
  const { sendSolanaTransaction } = useSendSolanaTransaction();
  
  // Filter spam tokens from balances - never allow sending spam tokens!
  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const filteredBalances = sortTokens(filterTokens(balances, {
    chain,
    network: isMainnet ? 'mainnet' : 'testnet',
    showUnverified: false, // Only allow sending verified tokens
  }));
  
  const [selectedToken, setSelectedToken] = useState<FilteredToken<TokenBalance> | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [txState, setTxState] = useState<TransactionState>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');

  // Reset selected token when chain changes
  useEffect(() => {
    setSelectedToken(null);
    setRecipientAddress('');
    setAmount('');
  }, [chain]);

  // Auto-select first token when balances load or change
  useEffect(() => {
    if (filteredBalances && filteredBalances.length > 0) {
      if (!selectedToken || !filteredBalances.find(b => 
        (b.token.contractAddress && b.token.contractAddress === selectedToken.token.contractAddress) ||
        (b.token.mintAddress && b.token.mintAddress === selectedToken.token.mintAddress) ||
        (b.token.symbol === selectedToken.token.symbol && !b.token.contractAddress && !b.token.mintAddress)
      )) {
        setSelectedToken(filteredBalances[0]);
      }
    }
  }, [filteredBalances, selectedToken]);

  // Validate recipient address
  useEffect(() => {
    if (!recipientAddress) {
      setAddressError('');
      return;
    }

    const validateAddress = () => {
      if (chain === 'ethereum') {
        const isValid = /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);
        if (!isValid) {
          setAddressError('Invalid Ethereum address (must start with 0x)');
        } else {
          setAddressError('');
        }
      } else {
        // Basic Solana validation
        if (recipientAddress.length < 32 || recipientAddress.length > 44) {
          setAddressError('Invalid Solana address');
        } else {
          const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
          if (!base58Regex.test(recipientAddress)) {
            setAddressError('Invalid Solana address');
          } else {
            setAddressError('');
          }
        }
      }
    };

    validateAddress();
  }, [recipientAddress, chain]);

  const handleMaxClick = () => {
    if (!selectedToken) return;
    const maxAmount = formatTokenAmount(
      selectedToken.amount.amount,
      selectedToken.amount.decimals
    );
    setAmount(maxAmount);
  };

  const handleSend = async () => {
    if (!selectedToken || !recipientAddress || !amount) return;
    setTxState('confirming');
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedToken) return;

    setTxState('sending');
    setError('');

    try {
      if (chain === 'ethereum') {
        await sendEvm();
      } else {
        await sendSol();
      }
    } catch (err: any) {
      console.error('Send failed:', err);
      setError(err?.message || err?.shortMessage || 'Failed to send transaction');
      setTxState('error');
    }
  };

  const sendEvm = async () => {
    if (!selectedToken || !currentUser?.evmSmartAccounts?.[0]) return;

    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const network = isMainnet ? 'base' : 'base-sepolia';
    
    // Get the Smart Account - this is what sends the transaction
    const smartAccount = currentUser.evmSmartAccounts[0];
    
    const amountInSmallestUnit = parseUnits(amount, selectedToken.amount.decimals);

    console.log('Sending Smart Account transaction:', {
      smartAccount,
      to: recipientAddress,
      amount: amountInSmallestUnit.toString(),
      token: selectedToken.token.symbol,
      network
    });

    // Native ETH transfer
    if (!selectedToken.token.contractAddress) {
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: network as 'base' | 'base-sepolia',
        calls: [{
          to: recipientAddress as `0x${string}`,
          value: amountInSmallestUnit,
          data: '0x',
        }],
        useCdpPaymaster: true, // Enable gas sponsorship
      });

      console.log('User operation sent:', result);
      // Use userOperationHash as the transaction identifier
      setTxHash(result.userOperationHash || '');
      setTxState('success');
      return;
    }

    // ERC-20 token transfer
    const transferData = encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, amountInSmallestUnit],
    });

    const result = await sendUserOperation({
      evmSmartAccount: smartAccount,
      network: network as 'base' | 'base-sepolia',
      calls: [{
        to: selectedToken.token.contractAddress as `0x${string}`,
        value: BigInt(0), // No ETH value for ERC20 transfers
        data: transferData,
      }],
      useCdpPaymaster: true, // Enable gas sponsorship
    });

    console.log('User operation sent:', result);
    // Use userOperationHash as the transaction identifier
    setTxHash(result.userOperationHash || '');
    setTxState('success');
  };

  const sendSol = async () => {
    if (!selectedToken || !solanaAddress) return;

    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const network = isMainnet ? 'solana' : 'solana-devnet';
    
    // Convert to lamports (SOL has 9 decimals)
    const amountInLamports = Math.floor(
      parseFloat(amount) * Math.pow(10, selectedToken.amount.decimals)
    );

    console.log('Building Solana transaction:', {
      from: solanaAddress,
      to: recipientAddress,
      amount: amountInLamports,
      amountSOL: amountInLamports / LAMPORTS_PER_SOL,
      token: selectedToken.token.symbol,
      network,
      balance: selectedToken.amount.amount,
    });

    // Validate addresses
    try {
      new PublicKey(solanaAddress);
      new PublicKey(recipientAddress);
    } catch (err) {
      throw new Error('Invalid Solana address');
    }

    // Check if we have enough balance (including a buffer for fees)
    const balanceInLamports = parseFloat(selectedToken.amount.amount); // Already in lamports!
    const minFee = 5000; // ~0.000005 SOL for fees
    if (amountInLamports + minFee > balanceInLamports) {
      throw new Error(`Insufficient balance. Have: ${(balanceInLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL, Need: ${((amountInLamports + minFee) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    }

    // Build the transaction using @solana/web3.js
    const fromPubkey = new PublicKey(solanaAddress);
    const toPubkey = new PublicKey(recipientAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amountInLamports,
      })
    );

    // Set required fields (CDP will replace these with actual values)
    transaction.recentBlockhash = SYSVAR_RECENT_BLOCKHASHES_PUBKEY.toBase58();
    transaction.feePayer = fromPubkey;

    // Serialize and encode to base64
    const serialized = transaction.serialize({
      requireAllSignatures: false,
    });
    const base64Transaction = Buffer.from(serialized).toString('base64');

    console.log('Sending Solana transaction...', {
      base64Length: base64Transaction.length,
      transactionSize: serialized.length,
    });

    const result = await sendSolanaTransaction({
      transaction: base64Transaction,
      solanaAccount: solanaAddress,
      network: network as 'solana' | 'solana-devnet',
    });

    console.log('Solana transaction sent:', result);
    setTxHash(result.transactionSignature);
    setTxState('success');
  };

  const handleReset = () => {
    setRecipientAddress('');
    setAmount('');
    setTxState('idle');
    setTxHash('');
    setError('');
    setAddressError('');
  };

  const getExplorerUrl = () => {
    if (!txHash) return '';
    
    if (chain === 'ethereum') {
      const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
      const baseUrl = isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org';
      return `${baseUrl}/tx/${txHash}`;
    } else {
      const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
      const cluster = isMainnet ? '' : '?cluster=devnet';
      return `https://explorer.solana.com/tx/${txHash}${cluster}`;
    }
  };

  const canSend = selectedToken && 
    recipientAddress && 
    !addressError &&
    amount && 
    parseFloat(amount) > 0 &&
    txState === 'idle';

  // Confirmation screen
  if (txState === 'confirming') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Confirm Transaction
          </h3>
        </div>

        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--card-border)' }}>
          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Token</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedToken?.token.symbol || 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Amount</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {amount} {selectedToken?.token.symbol}
              </p>
            </div>

            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>To</p>
              <p className="text-xs font-mono break-all" style={{ color: 'var(--text-primary)' }}>
                {recipientAddress}
              </p>
            </div>

            {chain === 'ethereum' && (
              <div className="p-2 rounded bg-positive/10 border border-positive/20">
                <p className="text-xs" style={{ color: 'var(--positive)' }}>
                  ✨ Gasless transaction - no ETH needed!
                </p>
              </div>
            )}

            {chain === 'solana' && (
              <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-500">
                  ℹ️ Small SOL fee required for transaction
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTxState('idle')}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-base-blue hover:bg-base-blue/90 transition-colors"
          >
            Confirm Send
          </button>
        </div>
      </div>
    );
  }

  // Sending state
  if (txState === 'sending') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-base-blue" />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Sending transaction...
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Signing with your embedded wallet
        </p>
      </div>
    );
  }

  // Success state
  if (txState === 'success') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-positive/20 flex items-center justify-center">
            <Check className="w-6 h-6" style={{ color: 'var(--positive)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transaction Sent!
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {amount} {selectedToken?.token.symbol} sent successfully
          </p>
        </div>

        {txHash && (
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-base-blue hover:bg-base-blue/90 transition-colors"
        >
          Send Another
        </button>
      </div>
    );
  }

  // Error state
  if (txState === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-negative/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-negative" />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transaction Failed
          </p>
          <p className="text-xs text-center px-4 text-negative">
            {error}
          </p>
        </div>

        <button
          onClick={handleReset}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-base-blue hover:bg-base-blue/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main send form
  return (
    <div className="space-y-4">
      {filteredBalances && filteredBalances.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            No verified tokens available to send
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Spam tokens are hidden for your safety
          </p>
        </div>
      ) : (
        <>
          {/* Token Selector */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Token
            </label>
            <select
              value={selectedToken ? filteredBalances.indexOf(selectedToken) : -1}
              onChange={(e) => setSelectedToken(filteredBalances[parseInt(e.target.value)])}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-base-blue"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            >
              {filteredBalances.map((balance, index) => (
                <option key={index} value={index}>
                  {balance.token.symbol || 'Unknown'} - {formatTokenAmount(balance.amount.amount, balance.amount.decimals)}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={chain === 'ethereum' ? '0x...' : 'Solana address'}
              className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-base-blue font-mono"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: addressError ? 'var(--negative)' : 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            />
            {addressError && (
              <p className="text-xs text-negative mt-1">{addressError}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="any"
                min="0"
                className="w-full px-3 py-2 pr-16 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-base-blue"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium bg-base-blue text-white hover:bg-base-blue/90 transition-colors"
              >
                MAX
              </button>
            </div>
            {selectedToken && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Balance: {formatTokenAmount(selectedToken.amount.amount, selectedToken.amount.decimals)} {selectedToken.token.symbol}
              </p>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSend ? 'var(--base-blue)' : 'var(--surface)',
              color: canSend ? 'white' : 'var(--text-secondary)',
            }}
          >
            {canSend ? (
              <>
                Send {selectedToken?.token.symbol}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Enter details to send'
            )}
          </button>
        </>
      )}
    </div>
  );
}
