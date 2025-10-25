'use client';

import { formatTokenAmount } from '@/lib/utils/token';
import { filterTokens, sortTokens } from '@/lib/tokens';

type TokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    network?: string;
    symbol?: string;
    name?: string;
    contractAddress?: string;
    mintAddress?: string;
  };
};

interface AssetsDisplayProps {
  balances: TokenBalance[] | null;
  loading: boolean;
  chain: 'ethereum' | 'solana';
  showUnverified?: boolean;
}

export function AssetsDisplay({ balances, loading, chain, showUnverified = false }: AssetsDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-base-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No assets found
        </p>
      </div>
    );
  }

  // Filter spam tokens
  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const filteredBalances = sortTokens(filterTokens(balances, {
    chain,
    network: isMainnet ? 'mainnet' : 'testnet',
    showUnverified,
  }));

  if (filteredBalances.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No verified tokens found
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Spam tokens are hidden for your safety
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredBalances.map((balance, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-opacity-50"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--card-border)' }}
            >
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {balance.token.symbol?.slice(0, 1) || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {balance.token.symbol || 'Unknown'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {balance.token.name || 
                  (balance.token.contractAddress 
                    ? balance.token.contractAddress.slice(0, 6) + '...' + balance.token.contractAddress.slice(-4)
                    : balance.token.mintAddress 
                      ? balance.token.mintAddress.slice(0, 6) + '...' + balance.token.mintAddress.slice(-4)
                      : 'Unknown'
                  )
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {formatTokenAmount(balance.amount.amount, balance.amount.decimals)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {balance.token.symbol}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
