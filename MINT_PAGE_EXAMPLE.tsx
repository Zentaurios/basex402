// Example: Updated Mint Page section using new wallet system
// Add these imports at the top:
import { useWallet } from '@/components/wallet/WalletProvider';
import { WalletButton } from '@/components/wallet/WalletButton';

// Replace the existing wallet connection section with:
export default function MintPage() {
  const { isConnected, address } = useWallet(); // Instead of useIsSignedIn/useEvmAddress
  // ... rest of your existing code

  // In your JSX, replace the WalletConnectionCard section:
  return (
    <div>
      {/* ... existing header/progress bar code ... */}

      {/* Wallet Connection Section - UPDATED */}
      {!isConnected ? (
        <div className="max-w-md mx-auto text-center py-12 px-4">
          <div className="mb-8">
            <div 
              className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${rarityTier.color} flex items-center justify-center text-4xl`}
            >
              {rarityTier.emoji}
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Mint x402 Protocol NFT
            </h2>
            <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
              Connect your embedded wallet to mint NFT #{NEXT_TOKEN_ID}
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Join the exclusive group of x402 pioneers
            </p>
          </div>

          {/* Use new WalletButton instead of WalletConnectionCard */}
          <WalletButton size="lg" className="w-full max-w-sm mx-auto">
            Connect Wallet to Mint
          </WalletButton>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Mail className="w-4 h-4" />
              <span>Email login</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Zap className="w-4 h-4" />
              <span>Instant wallet creation</span>
            </div>
          </div>
        </div>
      ) : (
        // ... your existing mint UI when connected
        <div>
          {/* Mint form and button */}
        </div>
      )}
    </div>
  );
}
