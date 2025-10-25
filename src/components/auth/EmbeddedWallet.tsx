'use client';

import { useEffect } from 'react';
import { useIsInitialized, useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { Wallet, Zap, User, CheckCircle2, Mail, Smartphone, FileText } from "lucide-react";

// Simple loading skeleton component
function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded ${className}`} style={{ backgroundColor: 'var(--surface)' }}></div>
  );
}

interface EmbeddedWalletStatusProps {
  showBalance?: boolean;
  className?: string;
}

export function EmbeddedWalletStatus({ showBalance = false, className = "" }: EmbeddedWalletStatusProps) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();

  // Show loading skeleton while initializing
  if (!isInitialized) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSkeleton className="w-6 h-6 rounded-full" />
        <LoadingSkeleton className="w-24 h-4" />
      </div>
    );
  }

  // If user is signed in, show wallet info
  if (isSignedIn && evmAddress) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <Wallet className="w-4 h-4 text-base-blue" />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
            {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
          </span>
        </div>
        <AuthButton />
      </div>
    );
  }

  // If not signed in, show sign in button
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <AuthButton />
    </div>
  );
}

interface WalletConnectionCardProps {
  title?: string;
  description?: string;
  onConnected?: () => void;
}

export function WalletConnectionCard({ 
  title = "Connect Embedded Wallet", 
  description = "Sign in with email or SMS to create your embedded wallet and deploy contracts with x402 payments.",
  onConnected 
}: WalletConnectionCardProps) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();

  // Check if mainnet
  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const networkName = isMainnet ? 'Base' : 'Base Sepolia';

  // Handle connection success in useEffect to avoid calling setState during render
  useEffect(() => {
    if (isSignedIn && evmAddress && onConnected) {
      onConnected();
    }
  }, [isSignedIn, evmAddress, onConnected]);

  if (!isInitialized) {
    return (
      <div className="border rounded-lg p-8 card">
        <div className="text-center">
          <LoadingSkeleton className="w-12 h-12 rounded-lg mx-auto mb-4" />
          <LoadingSkeleton className="w-48 h-6 mx-auto mb-2" />
          <LoadingSkeleton className="w-64 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (isSignedIn && evmAddress) {
    return (
      <div className="bg-positive/5 border border-positive/20 rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-positive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-positive" />
          </div>
          
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Wallet Connected
          </h3>
          
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your embedded wallet is ready for x402 payments on {networkName}
          </p>

          <div className="rounded-lg p-4 mb-6 card">
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-5 h-5 text-base-blue" />
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {evmAddress.slice(0, 8)}...{evmAddress.slice(-6)}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-8 card">
      <div className="text-center">
        <div className="w-16 h-16 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-base-blue" />
        </div>
        
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>

        {/* Authentication Methods */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email OTP</span>
            </div>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--card-border)' }}></div>
            <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">SMS OTP</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <AuthButton />
        </div>

        <div className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          Powered by Coinbase CDP • Secure & Non-Custodial
        </div>
      </div>
    </div>
  );
}

interface WalletFlowStepsProps {
  currentStep?: number;
}

export function WalletFlowSteps({ currentStep = 1 }: WalletFlowStepsProps) {
  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Sign in with email/SMS",
      icon: User
    },
    {
      number: 2,
      title: "Select Contract",
      description: "Choose template to deploy",
      icon: FileText
    },
    {
      number: 3,
      title: "x402 Payment",
      description: "Pay $0.05 USDC",
      icon: Zap
    }
  ];

  return (
    <div className="flex justify-center items-center space-x-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                isCompleted 
                  ? 'bg-positive text-white' 
                  : isActive 
                  ? 'bg-base-blue text-white' 
                  : ''
              }`} style={!isCompleted && !isActive ? { backgroundColor: 'var(--surface)', color: 'var(--text-muted)' } : {}}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <h4 className={`text-sm font-medium ${
                isActive ? '' : ''
              }`} style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {step.title}
              </h4>
              <p className="text-xs max-w-20" style={{ color: 'var(--text-muted)' }}>
                {step.description}
              </p>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`w-8 h-px mx-4 ${
                currentStep > step.number ? 'bg-positive' : ''
              }`} style={currentStep <= step.number ? { backgroundColor: 'var(--card-border)' } : {}}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
