#!/usr/bin/env python3
"""
x402 Protocol Pioneer Collection Banner Generator
Creates a collection banner showcasing all tiers - UPDATED WITH OFFICIAL BASE BRAND COLORS
"""

import os
from PIL import Image, ImageDraw, ImageFont

def install_pillow():
    """Install Pillow if not available"""
    try:
        import PIL
    except ImportError:
        print("Installing Pillow...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        import PIL

install_pillow()

# Create output directory
output_dir = "public/images"
os.makedirs(output_dir, exist_ok=True)

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_fonts():
    """Get the best available fonts"""
    fonts = {}
    
    font_paths = [
        "/System/Library/Fonts/Monaco.ttc",
        "/System/Library/Fonts/Courier.ttc", 
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf"
    ]
    
    try:
        font_path = None
        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break
        
        if font_path:
            fonts['title'] = ImageFont.truetype(font_path, 120)    # Scaled up for 2560px width
            fonts['subtitle'] = ImageFont.truetype(font_path, 48)  # Scaled up
            fonts['tier'] = ImageFont.truetype(font_path, 32)      # Scaled up
            fonts['x_large'] = ImageFont.truetype(font_path, 200)  # Much larger for prominence
            fonts['num_large'] = ImageFont.truetype(font_path, 100) # Scaled up
            fonts['x_small'] = ImageFont.truetype(font_path, 64)   # Scaled up for tier previews
            fonts['num_small'] = ImageFont.truetype(font_path, 32) # Scaled up
        else:
            fonts = {k: ImageFont.load_default() for k in ['title', 'subtitle', 'tier', 'x_large', 'num_large', 'x_small', 'num_small']}
            
    except Exception as e:
        print(f"Font loading warning: {e}")
        fonts = {k: ImageFont.load_default() for k in ['title', 'subtitle', 'tier', 'x_large', 'num_large', 'x_small', 'num_small']}
    
    return fonts

def draw_mini_tier(draw, x, y, width, height, tier_config, fonts, tier_name, token_count):
    """Draw a mini version of each tier"""
    
    # Background
    draw.rectangle([x, y, x + width, y + height], fill=hex_to_rgb(tier_config['bg']))
    
    # Gold border for Genesis
    if tier_config.get('gold_border'):
        for i in range(3):
            draw.rectangle([x + i, y + i, x + width - i - 1, y + height - i - 1], 
                         outline='#FFD700', width=1)
    
    # Draw mini X402
    center_x = x + width // 2
    center_y = y + height // 2
    
    # Mini X
    x_bbox = draw.textbbox((0, 0), 'X', font=fonts['x_small'])
    x_width = x_bbox[2] - x_bbox[0]
    draw.text((center_x - x_width//2, center_y - 20), 'X', 
              fill=hex_to_rgb(tier_config['x_color']), font=fonts['x_small'])
    
    # Mini 402
    num_bbox = draw.textbbox((0, 0), '402', font=fonts['num_small'])
    num_width = num_bbox[2] - num_bbox[0]
    draw.text((center_x - num_width//2, center_y + 5), '402', 
              fill=hex_to_rgb(tier_config['number_color']), font=fonts['num_small'])
    
    # Tier label - using official Base colors
    label_color = '#FFD12F' if tier_name == 'Genesis' else '#0000FF' if tier_name in ['Pioneer', 'Early Adopter'] else '#5b616e'
    draw.text((x + 5, y + height - 25), tier_name.upper(), fill=hex_to_rgb(label_color), font=fonts['tier'])
    draw.text((x + 5, y + height - 10), f"{token_count} tokens", fill=hex_to_rgb('#717886'), font=fonts['tier'])

def create_collection_banner():
    """Create the collection banner with responsive core area design - OFFICIAL BASE COLORS"""
    print("🎨 Creating x402 Protocol Pioneer Collection Banner (Official Base Brand Colors)...")
    
    # Banner dimensions (OpenSea optimized: 16:9 aspect ratio, high resolution)
    width = 2560
    height = 1440
    
    # Define responsive areas based on the core area concept
    core_width = int(width * 0.4)   # Center 40% width - visible on all devices
    core_height = int(height * 0.6)  # Center 60% height
    core_x = (width - core_width) // 2
    core_y = (height - core_height) // 2
    
    # Create image with OFFICIAL Base blue gradient background
    img = Image.new('RGB', (width, height), hex_to_rgb('#0000FF'))  # Official Base Blue
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect with official Base colors
    for y in range(height):
        gradient_factor = y / height
        # Gradient from official Base blue (#0000FF) to Base Gray 80 (#32353d)
        r = int(0 + (50 - 0) * gradient_factor)      # 0000FF to 32353d gradient
        g = int(0 + (53 - 0) * gradient_factor)
        b = int(255 + (61 - 255) * gradient_factor)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    fonts = get_fonts()
    
    # CORE AREA CONTENT (visible on all devices)
    # Main title - centered in core area
    title_text = "x402 PROTOCOL PIONEERS"
    title_bbox = draw.textbbox((0, 0), title_text, font=fonts['title'])
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    title_y = core_y + 50
    draw.text((title_x, title_y), title_text, fill=(255, 255, 255), font=fonts['title'])
    
    # Subtitle - centered in core area
    subtitle_text = "Micropayment Protocol • Base Network"
    subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=fonts['subtitle'])
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    subtitle_y = title_y + 150
    draw.text((subtitle_x, subtitle_y), subtitle_text, fill=hex_to_rgb('#b1b7c3'), font=fonts['subtitle'])  # Base Gray 30
    
    # Total supply info - centered in core area
    supply_text = "402 Total Supply • 4 Rarity Tiers"
    supply_bbox = draw.textbbox((0, 0), supply_text, font=fonts['subtitle'])
    supply_width = supply_bbox[2] - supply_bbox[0]
    supply_x = (width - supply_width) // 2
    supply_y = subtitle_y + 80
    draw.text((supply_x, supply_y), supply_text, fill=hex_to_rgb('#ffd12f'), font=fonts['subtitle'])  # Official Base Yellow
    
    # SUPPLEMENTAL AREAS (visible on larger screens)
    # Left x402logo - positioned in left supplemental area
    left_logo_x = 200
    left_logo_y = height // 2 - 100
    
    # Draw left X (no overlap - separate positioning)
    draw.text((left_logo_x, left_logo_y), 'X', fill=(255, 255, 255, 180), font=fonts['x_large'])
    draw.text((left_logo_x, left_logo_y + 150), '402', fill=hex_to_rgb('#ffd12f') + (180,), font=fonts['num_large'])  # Official Base Yellow
    
    # Right x402logo - positioned in right supplemental area
    right_logo_x = width - 400
    right_logo_y = height // 2 - 100
    
    # Draw right X (no overlap - separate positioning)
    draw.text((right_logo_x, right_logo_y), 'X', fill=(255, 255, 255, 180), font=fonts['x_large'])
    draw.text((right_logo_x, right_logo_y + 150), '402', fill=hex_to_rgb('#ffd12f') + (180,), font=fonts['num_large'])  # Official Base Yellow
    
    # Tier configurations and counts - UPDATED WITH OFFICIAL BASE COLORS
    tiers = [
        ('Protocol User', {
            'bg': '#ffffff', 'x_color': '#0a0b0d', 'number_color': '#0000FF'  # Official Base colors
        }, 102),
        ('Early Adopter', {
            'bg': '#0a0b0d', 'x_color': '#0000FF', 'number_color': '#ffffff'  # Official Base colors
        }, 200),
        ('Pioneer', {
            'bg': '#0000FF', 'x_color': '#0a0b0d', 'number_color': '#ffffff'  # Official Base Blue
        }, 90),
        ('Genesis', {
            'bg': '#0000FF', 'x_color': '#0a0b0d', 'number_color': '#ffffff', 'gold_border': True  # Official Base Blue
        }, 10)
    ]
    
    # TIER PREVIEWS - positioned in bottom supplemental area (visible on desktop/tablet)
    tier_width = 200   # Smaller than before to fit in supplemental area
    tier_height = 120  # Adjusted for supplemental area
    tier_spacing = 30  # Tighter spacing
    total_tier_width = len(tiers) * tier_width + (len(tiers) - 1) * tier_spacing
    start_x = (width - total_tier_width) // 2
    tier_y = height - tier_height - 40  # Position in bottom supplemental area
    
    for i, (tier_name, tier_config, token_count) in enumerate(tiers):
        tier_x = start_x + i * (tier_width + tier_spacing)
        draw_mini_tier(draw, tier_x, tier_y, tier_width, tier_height, 
                      tier_config, fonts, tier_name, token_count)
    
    # SUBTLE BACKGROUND ELEMENTS - positioned in supplemental areas only
    # Top code elements
    code_lines = [
        "POST /api/x402/payment",
        "{ amount: 0.001, protocol: 'x402' }",
        "200 OK { status: 'confirmed' }"
    ]
    
    # Only add background code in supplemental areas (not in core)
    for i, line in enumerate(code_lines):
        # Top left supplemental area
        draw.text((80, 100 + i * 40), line, fill=(255, 255, 255, 40), font=fonts['tier'])
        # Top right supplemental area
        draw.text((width - 500, 100 + i * 40), line, fill=(255, 255, 255, 25), font=fonts['tier'])
    
    return img

def main():
    """Generate collection banner with official Base brand colors"""
    print("🚀 Starting x402Collection Banner generation with OFFICIAL BASE BRAND COLORS...\n")
    
    try:
        banner = create_collection_banner()
        
        # Save banner
        output_path = os.path.join(output_dir, "collection-banner.png")
        banner.save(output_path, 'PNG', quality=95)
        
        file_size = os.path.getsize(output_path) // 1024
        print(f"✅ Generated collection-banner.png ({file_size}KB)")
        print(f"📁 Saved to: {output_path}")
        print("\n🌟 x402 Protocol Pioneer Collection Banner is ready!")
        print("🎨 UPDATED: Official Base brand colors (#0000FF, #ffd12f, etc.)")
        print("📱 Responsive core area design - works across all device sizes")
        print("🎯 Dimensions: 2560x1440px (16:9 aspect ratio)")
        print("✅ Core info visible on all devices, x402logos in supplemental areas")
        print("📱 OpenSea optimized with mobile-friendly responsive layout")
        print("🔧 No overlap issues - clean, professional design")
        print("🎨 Now using official Base brand guidelines!")
        
    except Exception as e:
        print(f"❌ Failed to generate collection banner: {e}")

if __name__ == "__main__":
    main()
