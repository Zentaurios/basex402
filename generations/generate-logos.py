#!/usr/bin/env python3
"""
Generate x402logos and brand assets in multiple sizes
Matching the NFT PNG generator style exactly:
- Blue background (#0000ff)
- Black X
- White 402
- Monaco/Courier monospace font
- Proper spacing between X and 402
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path
from math import pi

# Brand colors (matching NFT collection)
BLUE = (0, 0, 255)  # #0000ff - background
BLACK = (0, 0, 0)  # #000000 - X
WHITE = (255, 255, 255)  # #ffffff - 402
GRAY_100 = (10, 11, 13)  # #0a0b0d

def get_fonts(x_size, num_size):
    """Get Monaco/Courier monospace fonts matching the NFT PNG style"""
    fonts = {}
    
    # Try to get good monospace fonts (same as generate-png-improved.py)
    font_paths = [
        "/System/Library/Fonts/Monaco.ttc",
        "/System/Library/Fonts/Courier.ttc", 
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf"
    ]
    
    try:
        # Try to find a good monospace font
        font_path = None
        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break
        
        if font_path:
            fonts['x'] = ImageFont.truetype(font_path, x_size)
            fonts['num'] = ImageFont.truetype(font_path, num_size)
        else:
            # Fallback to default
            fonts['x'] = ImageFont.load_default()
            fonts['num'] = ImageFont.load_default()
            
    except Exception as e:
        print(f"Font loading warning: {e}")
        fonts['x'] = ImageFont.load_default()
        fonts['num'] = ImageFont.load_default()
    
    return fonts


def create_rounded_rectangle(size: int) -> Image.Image:
    """
    Create a rounded rectangle mask matching Base logo style
    Base uses rounded corners with radius proportional to size
    """
    # Create mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Corner radius - Base uses ~7.9% of size (19.671/249 from their logo)
    radius = int(size * 0.079)
    
    # Draw rounded rectangle on mask
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    
    return mask


def create_favicon_version(size: int, padding_ratio: float = 0.12) -> Image.Image:
    """
    Create simplified favicon version (just white 402, no X)
    Optimized for tiny sizes (16x16, 32x32, 48x48)
    """
    # Create image with blue background and rounded corners
    img = Image.new('RGBA', (size, size), BLUE + (255,))
    
    # Apply rounded corners for sizes 32+
    if size >= 32:
        mask = create_rounded_rectangle(size)
        img.putalpha(mask)
    
    draw = ImageDraw.Draw(img)
    
    # Calculate font sizes for favicons - moderate size for just "402"
    # This is SEPARATE from x402logos - favicons are simpler
    num_size = int(size * 0.50)  # 50% of image size for standalone 402
    
    fonts = get_fonts(x_size=100, num_size=num_size)
    font = fonts['num']
    
    # Draw 402 centered
    text = "402"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2
    
    # Draw the text in white
    draw.text((text_x, text_y), text, font=font, fill=WHITE)
    
    return img


def create_logo_square(size: int, padding_ratio: float = 0.15, transparent_bg: bool = False) -> Image.Image:
    """
    Create the x402logo square with Base-style rounded corners
    - Blue background with rounded corners (or transparent)
    - Black "X" on top
    - White "402" below with proper spacing
    - Monaco/Courier monospace font
    - BIG and readable - fills 85-90% of square
    """
    # Create image
    if transparent_bg:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    else:
        img = Image.new('RGBA', (size, size), BLUE + (255,))
        # Apply rounded corners
        mask = create_rounded_rectangle(size)
        img.putalpha(mask)
    
    draw = ImageDraw.Draw(img)
    
    # Calculate font sizes to fill the logo square
    # SEPARATE from favicon logic - these need to be much bigger
    # X should be ~75% of image height
    # 402 should be ~37.5% of image height (half of X)
    x_font_size = int(size * 0.75)
    num_font_size = int(size * 0.375)
    
    fonts = get_fonts(x_size=x_font_size, num_size=num_font_size)
    
    # Calculate center
    center_x = size // 2
    center_y = size // 2
    
    # X color based on background
    x_color = BLUE if transparent_bg else BLACK
    
    # Draw X (positioned above center to make room for 402 at center)
    try:
        x_text = "X"
        x_font = fonts['x']
        
        # Get text dimensions
        bbox = draw.textbbox((0, 0), x_text, font=x_font)
        x_width = bbox[2] - bbox[0]
        x_height = bbox[3] - bbox[1]
        
        # Get 402 dimensions to calculate positioning
        num_text = "402"
        num_font = fonts['num']
        bbox_num = draw.textbbox((0, 0), num_text, font=num_font)
        num_width = bbox_num[2] - bbox_num[0]
        num_height = bbox_num[3] - bbox_num[1]
        
        # Spacing between X and 402
        spacing = int(size * 0.03)
        
        # Position 402 so its TOP is at center_y
        num_x = center_x - (num_width // 2)
        num_y = center_y
        
        # Position X above 402 (work backwards from 402 position)
        x_x = center_x - (x_width // 2)
        x_y = num_y - spacing - x_height
        
        # Add stroke for transparent backgrounds
        if transparent_bg:
            # White stroke for visibility on dark backgrounds
            stroke_width = max(int(size * 0.004), 1)
            for offset_x in range(-stroke_width, stroke_width + 1):
                for offset_y in range(-stroke_width, stroke_width + 1):
                    if offset_x != 0 or offset_y != 0:
                        draw.text((x_x + offset_x, x_y + offset_y), x_text, font=x_font, fill=WHITE)
        
        # Draw X
        draw.text((x_x, x_y), x_text, font=x_font, fill=x_color)
        
    except Exception as e:
        print(f"Warning: Could not render X properly: {e}")
        x_y = center_y - int(size * 0.156)
        x_height = int(size * 0.31)
    
    # Draw 402 (already positioned above, just draw it)
    try:
        
        # Draw 402 in white
        draw.text((num_x, num_y), num_text, font=num_font, fill=WHITE)
        
    except Exception as e:
        print(f"Warning: Could not render 402 properly: {e}")
    
    return img


def create_og_image(width: int = 1200, height: int = 630, 
                   title: str = "x402 Pioneers", 
                   subtitle: str = "x402 Micropayments on Base") -> Image.Image:
    """
    Create OpenGraph social sharing image
    """
    # Create image with blue background
    img = Image.new('RGBA', (width, height), BLUE + (255,))
    draw = ImageDraw.Draw(img)
    
    # Add logo in center-left
    logo_size = int(height * 0.5)
    logo = create_logo_square(logo_size, padding_ratio=0.15)
    logo_x = int(width * 0.12)
    logo_y = (height - logo_size) // 2
    img.paste(logo, (logo_x, logo_y), logo)
    
    # Add text on the right
    try:
        # Try to get nice fonts for text
        title_size = int(height * 0.12)
        subtitle_size = int(height * 0.055)
        
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", title_size)
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", subtitle_size)
        except:
            fonts = get_fonts(x_size=100, num_size=title_size)
            title_font = fonts['num']
            subtitle_font = fonts['num']
        
        text_x = logo_x + logo_size + int(width * 0.08)
        
        # Draw title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_height = title_bbox[3] - title_bbox[1]
        title_y = (height // 2) - int(title_height * 0.7)
        
        # Add shadow/stroke to title
        for offset_x, offset_y in [(-2, -2), (-2, 2), (2, -2), (2, 2), (-2, 0), (2, 0), (0, -2), (0, 2)]:
            draw.text((text_x + offset_x, title_y + offset_y), title, font=title_font, fill=BLUE)
        draw.text((text_x, title_y), title, font=title_font, fill=WHITE)
        
        # Draw subtitle
        subtitle_y = title_y + title_height + int(height * 0.06)
        
        # Add shadow to subtitle
        for offset_x, offset_y in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
            draw.text((text_x + offset_x, subtitle_y + offset_y), subtitle, font=subtitle_font, fill=BLUE)
        draw.text((text_x, subtitle_y), subtitle, font=subtitle_font, fill=WHITE)
        
    except Exception as e:
        print(f"Warning: Could not render OG text properly: {e}")
    
    return img


def create_collection_banner(width: int = 1200, height: int = 400) -> Image.Image:
    """
    Create collection banner for NFT marketplace
    """
    # Create gradient background (blue to darker blue)
    img = Image.new('RGBA', (width, height), BLUE + (255,))
    draw = ImageDraw.Draw(img)
    
    # Add subtle gradient overlay
    for y in range(height):
        alpha = int(30 * (y / height))  # Subtle darkening
        draw.rectangle([(0, y), (width, y + 1)], fill=(0, 0, 0, alpha))
    
    # Add large logo on left
    logo_size = int(height * 0.55)
    logo = create_logo_square(logo_size, padding_ratio=0.12)
    logo_x = int(width * 0.08)
    logo_y = (height - logo_size) // 2
    img.paste(logo, (logo_x, logo_y), logo)
    
    # Add text
    try:
        title_size = int(height * 0.18)
        subtitle_size = int(height * 0.08)
        
        # Try to get nice fonts for banner text
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", title_size)
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", subtitle_size)
        except:
            fonts = get_fonts(x_size=100, num_size=title_size)
            title_font = fonts['num']
            subtitle_font = fonts['num']
        
        text_x = logo_x + logo_size + int(width * 0.06)
        
        # Title
        title = "x402Collection"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_height = title_bbox[3] - title_bbox[1]
        title_y = (height // 2) - int(title_height * 0.8)
        
        # Shadow
        for offset_x, offset_y in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
            draw.text((text_x + offset_x, title_y + offset_y), title, font=title_font, fill=GRAY_100)
        draw.text((text_x, title_y), title, font=title_font, fill=WHITE)
        
        # Subtitle
        subtitle = "Limited to 402 • x402 Protocol • Base"
        subtitle_y = title_y + title_height + int(height * 0.08)
        
        for offset_x, offset_y in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
            draw.text((text_x + offset_x, subtitle_y + offset_y), subtitle, font=subtitle_font, fill=GRAY_100)
        draw.text((text_x, subtitle_y), subtitle, font=subtitle_font, fill=WHITE)
        
    except Exception as e:
        print(f"Warning: Could not render banner text: {e}")
    
    return img


def generate_all_assets():
    """Generate all required logo sizes and brand assets"""
    
    # Create output directories
    public_dir = Path("public")
    images_dir = public_dir / "images"
    icons_dir = public_dir / "icons"
    
    images_dir.mkdir(parents=True, exist_ok=True)
    icons_dir.mkdir(parents=True, exist_ok=True)
    
    print("🎨 Generating x402Brand Assets...")
    print("   Style: Matching NFT PNG Generator")
    print("   Colors: Blue BG + Black X + White 402")
    print("   Font: Monaco/Courier Monospace")
    print("   Spacing: X and 402 properly separated")
    print()
    
    # 1. Generate main logo (multiple sizes)
    logo_sizes = [
        (512, "logo.png"),
        (256, "logo-256.png"),
        (128, "logo-128.png"),
        (64, "logo-64.png"),
        (32, "logo-32.png"),
    ]
    
    print("📦 Generating logos...")
    for size, filename in logo_sizes:
        logo = create_logo_square(size)
        output_path = images_dir / filename
        logo.save(output_path, "PNG")
        print(f"   ✓ {filename} ({size}x{size})")
    
    # 2. Generate logo with transparent background
    print("\n🎭 Generating transparent logos...")
    transparent_sizes = [
        (512, "logo-transparent.png"),
        (256, "logo-transparent-256.png"),
    ]
    
    for size, filename in transparent_sizes:
        logo = create_logo_square(size, transparent_bg=True)
        output_path = images_dir / filename
        logo.save(output_path, "PNG")
        print(f"   ✓ {filename} ({size}x{size}) - blue X with white stroke")
    
    # 3. Generate favicon sizes (simplified version for tiny sizes)
    print("\n🌐 Generating favicons...")
    
    # Small favicons - use simplified version (just 402, no X)
    small_favicon_sizes = [16, 32, 48]
    for size in small_favicon_sizes:
        favicon = create_favicon_version(size)
        output_path = icons_dir / f"favicon-{size}x{size}.png"
        favicon.save(output_path, "PNG")
        print(f"   ✓ favicon-{size}x{size}.png (simplified)")
    
    # Larger favicons - use full logo
    large_favicon_sizes = [64, 128, 256]
    for size in large_favicon_sizes:
        logo = create_logo_square(size, padding_ratio=0.12)
        output_path = icons_dir / f"favicon-{size}x{size}.png"
        logo.save(output_path, "PNG")
        print(f"   ✓ favicon-{size}x{size}.png (full logo)")
    
    # 4. Apple Touch Icon (full logo version)
    print("\n🍎 Generating Apple Touch Icon...")
    apple_icon = create_logo_square(180, padding_ratio=0.1)
    apple_icon.save(public_dir / "apple-touch-icon.png", "PNG")
    print("   ✓ apple-touch-icon.png (180x180)")
    
    # 5. OpenGraph images
    print("\n📱 Generating OpenGraph images...")
    og_variants = [
        ("og-default.png", "x402 Pioneers", "x402 Micropayments on Base"),
        ("og-home.png", "x402 Pioneers", "Limited Edition NFTs • Base Blockchain"),
        ("og-mint.png", "Mint x402 NFTs", "Only 402 Available • $1 USDC Each"),
    ]
    
    for filename, title, subtitle in og_variants:
        og_img = create_og_image(title=title, subtitle=subtitle)
        output_path = images_dir / filename
        og_img.save(output_path, "PNG")
        print(f"   ✓ {filename} (1200x630)")
    
    # 6. Collection Banner
    print("\n🎭 Generating collection banner...")
    banner = create_collection_banner()
    banner.save(images_dir / "collection-banner.png", "PNG")
    print("   ✓ collection-banner.png (1200x400)")
    
    # 7. Generate favicon.ico (multi-size ICO file with simplified small sizes)
    print("\n⭐ Generating favicon.ico...")
    try:
        # Use simplified version for tiny sizes, full logo for larger
        ico_images = [
            create_favicon_version(16),
            create_favicon_version(32),
            create_favicon_version(48),
            create_logo_square(64, padding_ratio=0.12)
        ]
        ico_sizes = [16, 32, 48, 64]
        ico_path = public_dir / "favicon.ico"
        ico_images[0].save(
            ico_path,
            format='ICO',
            sizes=[(s, s) for s in ico_sizes],
            append_images=ico_images[1:]
        )
        print("   ✓ favicon.ico (multi-size with optimized small icons)")
    except Exception as e:
        print(f"   ⚠ Could not generate favicon.ico: {e}")
        print("   ℹ You can convert favicon-32x32.png manually if needed")
    
    print("\n✨ All assets generated successfully!")
    print(f"\n📁 Output locations:")
    print(f"   • Logos: {images_dir}/")
    print(f"   • Icons: {icons_dir}/")
    print(f"   • Favicon: {public_dir}/favicon.ico")
    print(f"   • Apple Icon: {public_dir}/apple-touch-icon.png")
    print("\n🎉 Your x402 Pioneer brand is ready!")
    print("✅ Matched NFT PNG generator proportions and spacing")


if __name__ == "__main__":
    generate_all_assets()
