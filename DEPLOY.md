# 🚀 Deploy to Base Mainnet

## Prerequisites

Before deploying, make sure:

1. ✅ Your `.env.local` has `NEXT_PUBLIC_ENABLE_MAINNET=true`
2. ✅ You have ~0.005 ETH in your deployer wallet for gas
3. ✅ All tests pass: `forge test`

## Deploy Command

Run this from your project root:

```bash
npx tsx scripts/deploy-mainnet.ts
```

## What Happens

The script will:

1. **Compile** the contract with Foundry
2. **Get your CDP wallets:**
   - Deployer wallet (pays for deployment)
   - Minting wallet (authorized to mint NFTs)
3. **Check balance** - needs at least 0.005 ETH
4. **Deploy contract** with:
   - Server wallet: (your CDP minting wallet)
   - Base URI: `${NEXT_PUBLIC_APP_URL}/api/metadata/`
   - Royalty receiver: `0xe5b0AE2782a61169218Da729EE40caa25eF47885`
5. **Transfer ownership** to your wallet
6. **Save deployment info** to `deployment-mainnet.json`
7. **Update .env.local** with contract address

## Cost

- Deployment: ~$1-5 (one-time)
- Gas on Base is super cheap (~$0.01 per transaction)

## After Deployment

1. **Fund the minting wallet** with ~0.01 ETH for minting
   - Address will be shown in deployment output
   - This wallet will pay gas for each mint (~$0.01 per mint)

2. **Test minting** via your app

3. **Execute airdrop** when ready:
   - Call `executeAirdrop()` from your app
   - Uses the server wallet
   - Costs ~$0.10 total for 47 NFTs

## Troubleshooting

### "Insufficient ETH for deployment"
Fund your deployer wallet with at least 0.005 ETH

### "Contract compilation failed"
Run `forge build` manually to see detailed errors

### "Transaction failed"
Check BaseScan for the transaction details and error message

## Contract Verification (Optional)

After deployment, verify on BaseScan for transparency:

```bash
forge verify-contract \
  --chain base \
  --constructor-args $(cast abi-encode "constructor(address,string,address)" <SERVER_WALLET> <BASE_URI> <ROYALTY_RECEIVER>) \
  <CONTRACT_ADDRESS> \
  contracts/X402ProtocolPioneers.sol:X402ProtocolPioneers \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Replace:
- `<SERVER_WALLET>` with minting wallet address
- `<BASE_URI>` with your metadata URL
- `<ROYALTY_RECEIVER>` with `0xe5b0AE2782a61169218Da729EE40caa25eF47885`
- `<CONTRACT_ADDRESS>` with deployed address

## Deployment Info

After successful deployment, check `deployment-mainnet.json` for:
- Contract address
- Transaction hashes
- Gas costs
- Wallet addresses
- BaseScan links

## Support

If you run into issues:
1. Check your CDP API keys
2. Verify ETH balance in deployer wallet
3. Make sure you're on Base mainnet
4. Check the deployment logs for specific errors
