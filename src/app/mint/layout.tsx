import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(
  "Mint x402 NFTs | Limited to 402 on Base",
  "Mint your exclusive x402NFT for just $1 USDC. Limited collection of 402 NFTs celebrating the x402 micropayments protocol on Base blockchain.",
  "/images/og-mint.png",
  ["mint", "NFT minting", "Base NFT", "x402 protocol", "limited edition"]
);

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
