#!/usr/bin/env python3
"""
x402 Protocol Pioneer NFT PNG Generator - VISIBILITY FIXED
Fixed faint text issue on white background Protocol User tier
"""

import os
from PIL import Image, ImageDraw, ImageFont
import subprocess
import sys

def install_pillow():
    """Install Pillow if not available"""
    try:
        import PIL
    except ImportError:
        print("Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        import PIL

# Ensure Pillow is installed
install_pillow()

from PIL import Image, ImageDraw, ImageFont

# Create output directory
output_dir = "public/images"
os.makedirs(output_dir, exist_ok=True)

# Tier configurations - CORRECTED COLOR SCHEMES
tiers = {
    'protocol-user': {
        'name': 'Protocol User',
        'bg': '#ffffff',        # White background
        'x_color': '#000000',   # Pure Black X (for maximum contrast)
        'number_color': '#0000ff',  # Pure Blue 402
        'code_color': '#666666',    # Darker gray for better visibility
        'accent_color': '#0000ff',  # Blue for accents
        'border_color': '#0000ff'   # Blue border
    },
    'early-adopter': {
        'name': 'Early Adopter', 
        'bg': '#0a0b0d',        # Black background
        'x_color': '#0000ff',   # Blue X
        'number_color': '#ffffff',  # White 402
        'code_color': '#3c8aff',    # Base Cerulean for code
        'accent_color': '#3c8aff',  # Cerulean for accents
        'border_color': '#0000ff'   # Blue border
    },
    'pioneer': {
        'name': 'Pioneer',
        'bg': '#0000ff',        # Blue background
        'x_color': '#000000',   # Pure Black X (for contrast on blue)
        'number_color': '#ffffff',  # White 402
        'code_color': '#b1b7c3',    # Light gray for code visibility
        'accent_color': '#ffffff',  # White for accents
        'border_color': '#ffffff'   # White border
    },
    'genesis': {
        'name': 'Genesis',
        'bg': '#0000ff',        # Blue background
        'x_color': '#000000',   # Pure Black X (for contrast)
        'number_color': '#ffffff',  # White 402
        'code_color': '#ffd12f',    # Yellow for code
        'accent_color': '#ffd12f',  # Yellow for accents
        'border_color': '#ffd12f',  # Yellow border
        'gold_border': True
    }
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_fonts():
    """Get the best available fonts"""
    fonts = {}
    
    # Try to get good monospace fonts
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
            fonts['code'] = ImageFont.truetype(font_path, 18)      # Code font
            fonts['x'] = ImageFont.truetype(font_path, 160)        # Large X
            fonts['num'] = ImageFont.truetype(font_path, 80)       # 402
            fonts['tier'] = ImageFont.truetype(font_path, 28)      # Tier name
            fonts['small'] = ImageFont.truetype(font_path, 20)     # Small text
        else:
            # Fallback to default
            fonts = {k: ImageFont.load_default() for k in ['code', 'x', 'num', 'tier', 'small']}
            
    except Exception as e:
        print(f"Font loading warning: {e}")
        fonts = {k: ImageFont.load_default() for k in ['code', 'x', 'num', 'tier', 'small']}
    
    return fonts

def create_static_nft(config, tier_key, width=512, height=512):
    """Create a static NFT image with BOLD VISIBLE design"""
    
    # Create image - PURE RGB mode to avoid transparency issues
    img = Image.new('RGB', (width, height), hex_to_rgb(config['bg']))
    draw = ImageDraw.Draw(img)
    
    # Get fonts
    fonts = get_fonts()
    
    # PROMINENT border design
    border_width = 8 if config.get('gold_border') else 6
    
    # Outer border
    for i in range(border_width):
        alpha = 255 - (i * 20)
        if alpha > 100:
            draw.rectangle([i, i, width-i-1, height-i-1], 
                         outline=hex_to_rgb(config['border_color']), width=2)
    
    # Gold border special treatment for Genesis
    if config.get('gold_border'):
        for i in range(15):
            alpha_factor = 1 - (i / 15)
            if alpha_factor > 0.3:
                draw.rectangle([i, i, width-i-1, height-i-1], 
                             outline=hex_to_rgb(config['border_color']), width=1)
        
        # Inner premium accent
        for i in range(3):
            draw.rectangle([25+i, 25+i, width-25-i-1, height-25-i-1], 
                         outline=hex_to_rgb(config['accent_color']), width=2)
    
    # Protocol name at top - DIRECT DRAWING (no transparency)
    protocol_text = "x402 PROTOCOL"
    protocol_bbox = draw.textbbox((0, 0), protocol_text, font=fonts['small'])
    protocol_width = protocol_bbox[2] - protocol_bbox[0]
    protocol_x = (width - protocol_width) // 2
    protocol_y = 15
    
    draw.text((protocol_x, protocol_y), protocol_text, 
              fill=hex_to_rgb(config['accent_color']), font=fonts['small'])
    
    # REQUEST at top - DIRECT DRAWING with better visibility
    request_lines = [
        'POST /api/x402/payment',
        '{ "amount": 0.001,',
        '  "to": "0x742d35C...",',
        '  "protocol": "x402" }'
    ]
    
    # Draw request DIRECTLY on image (no alpha compositing)
    start_y = 45
    code_color_rgb = hex_to_rgb(config['code_color'])
    
    for i, line in enumerate(request_lines):
        y_pos = start_y + (i * 22)
        draw.text((20, y_pos), line, fill=code_color_rgb, font=fonts['code'])
    
    # MAIN x402LOGO - DIRECT DRAWING WITH MAXIMUM CONTRAST
    # Calculate positions to avoid overlap
    center_x = width // 2
    center_y = height // 2
    
    # Get text dimensions for perfect centering
    x_bbox = draw.textbbox((0, 0), 'X', font=fonts['x'])
    x_width = x_bbox[2] - x_bbox[0]
    x_height = x_bbox[3] - x_bbox[1]
    
    num_bbox = draw.textbbox((0, 0), '402', font=fonts['num'])
    num_width = num_bbox[2] - num_bbox[0]
    num_height = num_bbox[3] - num_bbox[1]
    
    # X position - slightly higher than center
    x_x = center_x - (x_width // 2)
    x_y = center_y - 80  # Higher position
    
    # 402 position - below X with proper spacing
    num_x = center_x - (num_width // 2)
    num_y = x_y + x_height + 15  # Proper spacing after X
    
    # MAIN LOGO - DIRECT DRAWING WITH PURE COLORS (no transparency)
    x_color_rgb = hex_to_rgb(config['x_color'])
    num_color_rgb = hex_to_rgb(config['number_color'])
    
    print(f"Drawing {tier_key}: X color {config['x_color']} -> {x_color_rgb}, 402 color {config['number_color']} -> {num_color_rgb}")
    
    # Draw X and 402 with MAXIMUM VISIBILITY
    draw.text((x_x, x_y), 'X', fill=x_color_rgb, font=fonts['x'])
    draw.text((num_x, num_y), '402', fill=num_color_rgb, font=fonts['num'])
    
    # RESPONSE at bottom - DIRECT DRAWING
    response_lines = [
        '200 OK',
        '{ "status": "confirmed",',
        '  "txHash": "0x8f2a..." }'
    ]
    
    # Calculate response position to avoid overlap with logo
    response_start_y = max(num_y + num_height + 20, height - 100)
    
    for i, line in enumerate(response_lines):
        y_pos = response_start_y + (i * 22)
        if y_pos < height - 60:  # Make sure it fits
            draw.text((20, y_pos), line, fill=code_color_rgb, font=fonts['code'])
    
    # Tier name at bottom - DIRECT DRAWING
    tier_text = config['name'].upper()
    tier_bbox = draw.textbbox((0, 0), tier_text, font=fonts['tier'])
    tier_width = tier_bbox[2] - tier_bbox[0]
    tier_x = (width - tier_width) // 2
    tier_y = height - 35
    
    # Draw tier name DIRECTLY
    draw.text((tier_x, tier_y), tier_text, 
              fill=hex_to_rgb(config['accent_color']), font=fonts['tier'])
    
    # Corner accents - DIRECT DRAWING
    accent_size = 25
    accent_color_rgb = hex_to_rgb(config['accent_color'])
    
    # Top-left accent
    draw.polygon([(10, 10), (10 + accent_size, 10), (10, 10 + accent_size)], 
                fill=accent_color_rgb)
    
    # Top-right accent
    draw.polygon([(width - 10, 10), (width - 10 - accent_size, 10), (width - 10, 10 + accent_size)], 
                fill=accent_color_rgb)
    
    # Bottom-left accent
    draw.polygon([(10, height - 10), (10 + accent_size, height - 10), (10, height - 10 - accent_size)], 
                fill=accent_color_rgb)
    
    # Bottom-right accent
    draw.polygon([(width - 10, height - 10), (width - 10 - accent_size, height - 10), (width - 10, height - 10 - accent_size)], 
                fill=accent_color_rgb)
    
    return img

def create_svg_version(config, tier_key, width=512, height=512):
    """Create SVG version of the NFT with fixed design"""
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .bg {{ fill: {config['bg']}; }}
            .x-color {{ fill: {config['x_color']}; font-family: Monaco, monospace; font-size: 160px; font-weight: bold; }}
            .num-color {{ fill: {config['number_color']}; font-family: Monaco, monospace; font-size: 80px; font-weight: bold; }}
            .code-color {{ fill: {config['code_color']}; font-family: Monaco, monospace; font-size: 16px; }}
            .accent-color {{ fill: {config['accent_color']}; font-family: Monaco, monospace; font-size: 28px; font-weight: bold; }}
            .small-text {{ fill: {config['accent_color']}; font-family: Monaco, monospace; font-size: 20px; font-weight: bold; }}
            .border {{ fill: none; stroke: {config['border_color']}; stroke-width: 6; }}
        </style>
    </defs>
    
    <!-- Background -->
    <rect width="{width}" height="{height}" class="bg"/>
    
    <!-- Border -->
    <rect x="0" y="0" width="{width}" height="{height}" class="border"/>
    <rect x="6" y="6" width="{width-12}" height="{height-12}" class="border"/>
    
    {'<!-- Gold border for Genesis -->' if config.get('gold_border') else ''}
    {f'<rect x="12" y="12" width="{width-24}" height="{height-24}" fill="none" stroke="{config["border_color"]}" stroke-width="3"/>' if config.get('gold_border') else ''}
    
    <!-- Protocol name -->
    <text x="{width//2}" y="30" text-anchor="middle" class="small-text">x402 PROTOCOL</text>
    
    <!-- REQUEST at top -->
    <text x="20" y="65" class="code-color">POST /api/x402/payment</text>
    <text x="20" y="87" class="code-color">{{ "amount": 0.001,</text>
    <text x="20" y="109" class="code-color">  "to": "0x742d35C...",</text>
    <text x="20" y="131" class="code-color">  "protocol": "x402" }}</text>
    
    <!-- MAIN x402logo with proper spacing -->
    <text x="{width//2}" y="220" text-anchor="middle" class="x-color">X</text>
    <text x="{width//2}" y="320" text-anchor="middle" class="num-color">402</text>
    
    <!-- RESPONSE at bottom -->
    <text x="20" y="380" class="code-color">200 OK</text>
    <text x="20" y="402" class="code-color">{{ "status": "confirmed",</text>
    <text x="20" y="424" class="code-color">  "txHash": "0x8f2a..." }}</text>
    
    <!-- Tier name -->
    <text x="{width//2}" y="{height - 15}" text-anchor="middle" class="accent-color">{config['name'].upper()}</text>
    
    <!-- Corner accents -->
    <polygon points="10,10 35,10 10,35" fill="{config['accent_color']}"/>
    <polygon points="{width-10},{10} {width-35},{10} {width-10},{35}" fill="{config['accent_color']}"/>
    <polygon points="10,{height-10} 35,{height-10} 10,{height-35}" fill="{config['accent_color']}"/>
    <polygon points="{width-10},{height-10} {width-35},{height-10} {width-10},{height-35}" fill="{config['accent_color']}"/>
</svg>'''
    
    return svg_content

def generate_png(tier_key, config):
    """Generate PNG for a tier with MAXIMUM VISIBILITY"""
    print(f"🎨 Generating {tier_key}.png with MAXIMUM VISIBILITY...")
    
    # Create PNG
    img = create_static_nft(config, tier_key)
    
    # Save PNG
    png_path = os.path.join(output_dir, f"{tier_key}.png")
    img.save(png_path, 'PNG', quality=95)
    
    png_size = os.path.getsize(png_path) // 1024
    print(f"✅ Generated {tier_key}.png ({png_size}KB)")
    
    # Create SVG version
    svg_content = create_svg_version(config, tier_key)
    svg_path = os.path.join(output_dir, f"{tier_key}.svg")
    
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    svg_size = os.path.getsize(svg_path) // 1024
    print(f"✅ Generated {tier_key}.svg ({svg_size}KB)")
    
    return png_path, svg_path

def main():
    """Generate all PNG and SVG files with MAXIMUM VISIBILITY"""
    print("🚀 Starting x402 Protocol Pioneer PNG/SVG generation...")
    print("🔧 VISIBILITY FIXED: Pure RGB drawing, no transparency issues\n")
    print("🎨 Color Schemes:")
    print("  • Protocol User: PURE BLACK X + PURE BLUE 402 (on white)")
    print("  • Early Adopter: Blue X + White 402 (on black)")
    print("  • Pioneer: PURE BLACK X + White 402 (on blue)")  
    print("  • Genesis: PURE BLACK X + White 402 (on blue, gold accents)\n")
    
    results = []
    
    for tier_key, config in tiers.items():
        try:
            png_path, svg_path = generate_png(tier_key, config)
            results.append((tier_key, png_path, svg_path, True))
        except Exception as e:
            print(f"❌ Failed to generate {tier_key}: {e}")
            results.append((tier_key, str(e), None, False))
        
        print()  # Add spacing
    
    # Summary
    print("📊 Generation Summary:")
    print("=====================")
    
    successful = [r for r in results if r[3]]
    failed = [r for r in results if not r[3]]
    
    total_png_size = 0
    total_svg_size = 0
    
    for tier_key, png_path, svg_path, _ in successful:
        png_size = os.path.getsize(png_path) // 1024
        svg_size = os.path.getsize(svg_path) // 1024
        total_png_size += png_size
        total_svg_size += svg_size
        print(f"✅ {os.path.basename(png_path)} - {png_size}KB")
        print(f"✅ {os.path.basename(svg_path)} - {svg_size}KB")
    
    if failed:
        print("\nFailed:")
        for tier_key, error, _, _ in failed:
            print(f"❌ {tier_key} - {error}")
    
    print(f"\n🎉 Generated {len(successful)}/{len(results)} tier sets successfully!")
    print(f"📁 Files saved to: {output_dir}")
    print(f"📊 Total PNG size: {total_png_size}KB")
    print(f"📊 Total SVG size: {total_svg_size}KB")
    
    if len(successful) == 4:
        print("\n🌟 x402 Protocol Pioneer NFT static collection is ready!")
        print("✅ FIXED: Maximum visibility with pure RGB drawing")
        print("✅ FIXED: No transparency issues affecting text")
        print("✅ FIXED: Pure black/blue colors for maximum contrast")
        print("🎨 Features: Official Base brand colors, professional design")
        print("📱 Perfect for NFT platforms, marketplaces, and web display")

if __name__ == "__main__":
    main()
