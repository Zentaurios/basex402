#!/usr/bin/env python3
"""
x402 Protocol Pioneer NFT GIF Generator
Python version - more reliable than Node.js canvas
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
output_dir = "public/animations"
os.makedirs(output_dir, exist_ok=True)

# Tier configurations
tiers = {
    'protocol-user': {
        'bg': '#ffffff',
        'x_color': '#000000',
        'number_color': '#0052FF',
        'code_color': '#333333',
        'trail_color': '#cccccc'
    },
    'early-adopter': {
        'bg': '#000000',
        'x_color': '#0052FF',
        'number_color': '#ffffff',
        'code_color': '#0052FF',
        'trail_color': '#0052FF'
    },
    'pioneer': {
        'bg': '#0052FF',
        'x_color': '#000000',
        'number_color': '#ffffff',
        'code_color': '#ffffff',
        'trail_color': '#ffffff'
    },
    'genesis': {
        'bg': '#0052FF',
        'x_color': '#000000',
        'number_color': '#ffffff',
        'code_color': '#FFD700',
        'trail_color': '#FFD700',
        'gold_border': True
    }
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def draw_frame(config, frame_num, width=512, height=512):
    """Draw a single animation frame"""
    
    # Create image
    img = Image.new('RGB', (width, height), hex_to_rgb(config['bg']))
    draw = ImageDraw.Draw(img)
    
    # Try to use a monospace font, fallback to default
    try:
        font_code = ImageFont.truetype("/System/Library/Fonts/Monaco.ttc", 16)
        font_x = ImageFont.truetype("/System/Library/Fonts/Monaco.ttc", 120)
        font_num = ImageFont.truetype("/System/Library/Fonts/Monaco.ttc", 60)
    except:
        try:
            font_code = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 16)
            font_x = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 120)
            font_num = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 60)
        except:
            font_code = ImageFont.load_default()
            font_x = ImageFont.load_default()
            font_num = ImageFont.load_default()
    
    # Gold border for Genesis
    if config.get('gold_border'):
        # Outer gold border
        for i in range(6, 12):
            draw.rectangle([i, i, width-i-1, height-i-1], outline='#FFD700', width=1)
        # Inner accent
        draw.rectangle([18, 18, width-19, height-19], outline='#FFD700', width=3)
    
    # Animation sequence (60 frames = 2 seconds at 30fps)
    frame = frame_num % 60
    
    code_color = hex_to_rgb(config['code_color'])
    x_color = hex_to_rgb(config['x_color'])
    number_color = hex_to_rgb(config['number_color'])
    trail_color = hex_to_rgb(config['trail_color'])
    
    if frame < 20:
        # Code typing phase
        progress = frame / 20
        line1 = 'POST /api/x402/payment'
        line2 = '{ "amount": 0.001,'
        line3 = '  "to": "0x742d35C...",'
        line4 = '  "protocol": "x402" }'
        
        chars1 = int(progress * len(line1))
        chars2 = int(max(0, progress - 0.3) * len(line2) / 0.7)
        chars3 = int(max(0, progress - 0.5) * len(line3) / 0.5)
        chars4 = int(max(0, progress - 0.7) * len(line4) / 0.3)
        
        draw.text((20, 40), line1[:chars1], fill=code_color, font=font_code)
        if chars2 > 0:
            draw.text((20, 60), line2[:chars2], fill=code_color, font=font_code)
        if chars3 > 0:
            draw.text((20, 80), line3[:chars3], fill=code_color, font=font_code)
        if chars4 > 0:
            draw.text((20, 100), line4[:chars4], fill=code_color, font=font_code)
            
    elif frame < 30:
        # Logo fade in + response
        draw.text((20, 40), 'POST /api/x402/payment', fill=code_color, font=font_code)
        draw.text((20, 60), '{ "amount": 0.001,', fill=code_color, font=font_code)
        draw.text((20, 80), '  "to": "0x742d35C...",', fill=code_color, font=font_code)
        draw.text((20, 100), '  "protocol": "x402" }', fill=code_color, font=font_code)
        
        # Response
        resp_progress = (frame - 20) / 10
        resp1 = '200 OK'
        resp2 = '{ "status": "confirmed",'
        resp3 = '  "txHash": "0x8f2a..." }'
        
        chars1 = int(resp_progress * len(resp1))
        chars2 = int(max(0, resp_progress - 0.4) * len(resp2) / 0.6)
        chars3 = int(max(0, resp_progress - 0.7) * len(resp3) / 0.3)
        
        draw.text((20, height - 80), resp1[:chars1], fill=code_color, font=font_code)
        if chars2 > 0:
            draw.text((20, height - 60), resp2[:chars2], fill=code_color, font=font_code)
        if chars3 > 0:
            draw.text((20, height - 40), resp3[:chars3], fill=code_color, font=font_code)
        
        # Logo
        fade_alpha = min(255, int((frame - 20) / 10 * 255))
        x_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        x_draw = ImageDraw.Draw(x_img)
        
        # Draw X and 402 with fade
        x_draw.text((width//2 - 60, height//2 - 60), 'X', fill=(*x_color, fade_alpha), font=font_x, anchor='mm')
        x_draw.text((width//2, height//2 + 30), '402', fill=(*number_color, fade_alpha), font=font_num, anchor='mm')
        
        img = Image.alpha_composite(img.convert('RGBA'), x_img).convert('RGB')
        
    else:
        # Shooting animation
        shoot_frame = frame - 30
        shoot_progress = shoot_frame / 30
        
        # Show all text
        draw.text((20, 40), 'POST /api/x402/payment', fill=code_color, font=font_code)
        draw.text((20, 60), '{ "amount": 0.001,', fill=code_color, font=font_code)
        draw.text((20, 80), '  "to": "0x742d35C...",', fill=code_color, font=font_code)
        draw.text((20, 100), '  "protocol": "x402" }', fill=code_color, font=font_code)
        draw.text((20, height - 80), '200 OK', fill=code_color, font=font_code)
        draw.text((20, height - 60), '{ "status": "confirmed",', fill=code_color, font=font_code)
        draw.text((20, height - 40), '  "txHash": "0x8f2a..." }', fill=code_color, font=font_code)
        
        # Calculate positions
        x_pos = width//2 - int(shoot_progress * width * 1.2)
        four_pos = width//2 - int(max(0, shoot_progress - 0.2) * width * 1.2)
        
        # Draw moving elements
        if x_pos > -150:
            # X trail
            for i in range(5):
                alpha = max(0, int(150 - i * 30))
                if alpha > 0:
                    trail_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                    trail_draw = ImageDraw.Draw(trail_img)
                    trail_draw.text((x_pos + i * 25, height//2 - 60), 'X', 
                                  fill=(*trail_color, alpha), font=font_x, anchor='mm')
                    img = Image.alpha_composite(img.convert('RGBA'), trail_img).convert('RGB')
            
            # Main X
            draw.text((x_pos, height//2 - 60), 'X', fill=x_color, font=font_x, anchor='mm')
        
        if four_pos > -150:
            # 402 trail
            for i in range(5):
                alpha = max(0, int(150 - i * 30))
                if alpha > 0:
                    trail_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                    trail_draw = ImageDraw.Draw(trail_img)
                    trail_draw.text((four_pos + i * 15, height//2 + 30), '402', 
                                  fill=(*trail_color, alpha), font=font_num, anchor='mm')
                    img = Image.alpha_composite(img.convert('RGBA'), trail_img).convert('RGB')
            
            # Main 402
            draw.text((four_pos, height//2 + 30), '402', fill=number_color, font=font_num, anchor='mm')
    
    return img

def generate_gif(tier_name, config):
    """Generate GIF for a tier"""
    print(f"🎬 Generating {tier_name}.gif...")
    
    frames = []
    
    # Generate 60 frames (2 seconds at 30fps)
    for frame in range(60):
        img = draw_frame(config, frame)
        frames.append(img)
        
        if frame % 10 == 0:
            print(f"  Frame {frame + 1}/60 ({int((frame + 1) / 60 * 100)}%)")
    
    # Save as GIF
    output_path = os.path.join(output_dir, f"{tier_name}.gif")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=33,  # 30fps
        loop=0
    )
    
    file_size = os.path.getsize(output_path) // 1024
    print(f"✅ Generated {tier_name}.gif ({file_size}KB)")
    return output_path

def main():
    """Generate all GIFs"""
    print("🚀 Starting x402 Protocol Pioneer GIF generation...\n")
    
    results = []
    
    for tier_name, config in tiers.items():
        try:
            output_path = generate_gif(tier_name, config)
            results.append((tier_name, output_path, True))
        except Exception as e:
            print(f"❌ Failed to generate {tier_name}: {e}")
            results.append((tier_name, str(e), False))
        
        print()  # Add spacing
    
    # Summary
    print("📊 Generation Summary:")
    print("=====================")
    
    successful = [r for r in results if r[2]]
    failed = [r for r in results if not r[2]]
    
    for tier_name, path, _ in successful:
        file_size = os.path.getsize(path) // 1024
        print(f"✅ {os.path.basename(path)} - {file_size}KB")
    
    if failed:
        print("\nFailed:")
        for tier_name, error, _ in failed:
            print(f"❌ {tier_name} - {error}")
    
    print(f"\n🎉 Generated {len(successful)}/{len(results)} GIFs successfully!")
    print(f"📁 Files saved to: {output_dir}")
    
    if len(successful) == 4:
        print("\n🌟 Your x402 Protocol Pioneer NFT collection is ready!")
        print("Each GIF tells the story of the x402 micropayment protocol in action.")

if __name__ == "__main__":
    main()
