import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Determine rarity tier based on tokenId
function getRarityTier(tokenId: number): string {
  if (tokenId >= 1 && tokenId <= 10) return 'genesis';
  if (tokenId >= 11 && tokenId <= 100) return 'pioneer';
  if (tokenId >= 101 && tokenId <= 225) return 'early-adopter';
  if (tokenId >= 226 && tokenId <= 402) return 'protocol-user';
  throw new Error('Invalid token ID');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
): Promise<NextResponse> {
  try {
    const { tokenId: tokenIdParam } = await params;
    const tokenId = parseInt(tokenIdParam);
    
    // Validate token ID
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 402) {
      return new NextResponse('Invalid token ID', { status: 404 });
    }

    // TODO: Check database for custom animation first (when implemented)
    // This allows users to upload their own animations in the future
    // const customAnimation = await db.getCustomAnimation(tokenId);
    // if (customAnimation) {
    //   // Fetch and serve custom animation from CDN/storage
    //   const animationResponse = await fetch(customAnimation.url);
    //   const animationBuffer = await animationResponse.arrayBuffer();
    //   return new NextResponse(animationBuffer, {
    //     headers: {
    //       'Content-Type': customAnimation.contentType || 'image/gif',
    //       'Cache-Control': 'public, max-age=31536000, immutable',
    //     },
    //   });
    // }

    // Get the rarity tier and serve default animation
    const rarityTier = getRarityTier(tokenId);
    const animationPath = join(process.cwd(), 'public', 'animations', `${rarityTier}.gif`);
    
    // Read and serve the animation file
    const animationBuffer = await readFile(animationPath);
    
    return new NextResponse(animationBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Animation route error:', error);
    return new NextResponse('Animation not found', { status: 404 });
  }
}
