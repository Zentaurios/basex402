'use client';

import { Wallet as WalletIcon } from 'lucide-react';
import { useWallet } from './WalletProvider';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function WalletButton({ 
  className = '', 
  variant = 'default',
  size = 'md',
  children 
}: WalletButtonProps) {
  const { openModal } = useWallet();

  const handleClick = () => {
    openModal();
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    default: {
      backgroundColor: 'var(--base-blue)',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--card-border)',
    },
    minimal: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    },
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-base-blue focus:ring-offset-2 ${sizeClasses[size]} ${className}`}
      style={variantStyles[variant]}
    >
      <WalletIcon className="w-4 h-4" />
      {children || 'Connect'}
    </button>
  );
}
