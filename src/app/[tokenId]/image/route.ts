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

    // TODO: Check database for custom image first (when implemented)
    // const customImage = await db.getCustomImage(tokenId);
    // if (customImage) {
    //   // Fetch and serve custom image from CDN/storage
    //   const imageResponse = await fetch(customImage.url);
    //   const imageBuffer = await imageResponse.arrayBuffer();
    //   return new NextResponse(imageBuffer, {
    //     headers: {
    //       'Content-Type': customImage.contentType || 'image/png',
    //       'Cache-Control': 'public, max-age=31536000, immutable',
    //     },
    //   });
    // }

    // Get the rarity tier and serve default image
    const rarityTier = getRarityTier(tokenId);
    const imagePath = join(process.cwd(), 'public', 'images', `${rarityTier}.png`);
    
    // Read and serve the image file
    const imageBuffer = await readFile(imagePath);
    
    return new NextResponse(imageBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Image route error:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
