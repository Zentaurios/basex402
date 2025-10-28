#!/usr/bin/env python3
"""
x402 Protocol Pioneer NFT GIF Generator - FAST AI PAYMENT SPEED
Faster sliding animation that resonates with AI stablecoin payment speed
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

# Tier configurations - UPDATED WITH OFFICIAL BASE BRAND COLORS
tiers = {
    'protocol-user': {
        'bg': '#ffffff',        # Base Gray 0 (White)
        'x_color': '#0a0b0d',   # Base Gray 100 (Black)
        'number_color': '#0000ff',  # Official Base Blue
        'code_color': '#5b616e',    # Base Gray 60
        'trail_color': '#b1b7c3'    # Base Gray 30
    },
    'early-adopter': {
        'bg': '#0a0b0d',        # Base Gray 100 (Black)
        'x_color': '#0000ff',   # Official Base Blue
        'number_color': '#ffffff',  # Base Gray 0 (White)
        'code_color': '#0000ff',    # Official Base Blue
        'trail_color': '#3c8aff'    # Base Cerulean
    },
    'pioneer': {
        'bg': '#0000ff',        # Official Base Blue
        'x_color': '#0a0b0d',   # Base Gray 100 (Black)
        'number_color': '#ffffff',  # Base Gray 0 (White)
        'code_color': '#ffffff',    # Base Gray 0 (White)
        'trail_color': '#ffffff'    # Base Gray 0 (White)
    },
    'genesis': {
        'bg': '#0000ff',        # Official Base Blue
        'x_color': '#0a0b0d',   # Base Gray 100 (Black)
        'number_color': '#ffffff',  # Base Gray 0 (White)
        'code_color': '#ffd12f',    # Official Base Yellow
        'trail_color': '#ffd12f',   # Official Base Yellow
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
            fonts['code'] = ImageFont.truetype(font_path, 24)      # Larger code font
            fonts['x'] = ImageFont.truetype(font_path, 200)        # Much larger X
            fonts['num'] = ImageFont.truetype(font_path, 100)      # Much larger 402
        else:
            # Fallback to default
            fonts['code'] = ImageFont.load_default()
            fonts['x'] = ImageFont.load_default()
            fonts['num'] = ImageFont.load_default()
            
    except Exception as e:
        print(f"Font loading warning: {e}")
        fonts['code'] = ImageFont.load_default()
        fonts['x'] = ImageFont.load_default()
        fonts['num'] = ImageFont.load_default()
    
    return fonts

def draw_speed_lines(draw, x_pos, y_pos, width, height, color, alpha=100):
    """Draw speed lines to emphasize fast movement"""
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    # Multiple speed lines at different lengths and angles
    line_color = (*color, alpha)
    
    for i in range(8):
        line_length = 40 + (i * 15)
        line_y = y_pos + (i * 8) - 32
        start_x = x_pos + 150 + (i * 20)
        end_x = start_x + line_length
        
        if start_x < width and line_y > 0 and line_y < height:
            overlay_draw.line([(start_x, line_y), (end_x, line_y)], 
                            fill=line_color, width=3)
    
    return overlay

def draw_frame(config, frame_num, width=512, height=512):
    """Draw a single animation frame - FAST AI PAYMENT SPEED"""
    
    # Create image
    img = Image.new('RGB', (width, height), hex_to_rgb(config['bg']))
    draw = ImageDraw.Draw(img)
    
    # Get fonts
    fonts = get_fonts()
    
    # Gold border for Genesis - Using official Base Yellow
    if config.get('gold_border'):
        # Much thicker, more visible gold border using official Base Yellow
        border_color = '#ffd12f'  # Official Base Yellow
        for i in range(15):  # Thicker border
            accent_color = '#ffd12f' if i < 8 else '#b6f569'  # Base Yellow to Lime Green accent
            draw.rectangle([i, i, width-i-1, height-i-1], outline=accent_color, width=1)
        
        # Inner accent - also thicker
        for i in range(3):
            draw.rectangle([25+i, 25+i, width-25-i-1, height-25-i-1], outline='#ffd12f', width=1)
    
    # FAST AI PAYMENT animation sequence (100 frames = 5 seconds at 20fps)
    frame = frame_num % 100
    
    code_color = hex_to_rgb(config['code_color'])
    x_color = hex_to_rgb(config['x_color'])
    number_color = hex_to_rgb(config['number_color'])
    trail_color = hex_to_rgb(config['trail_color'])
    
    if frame < 30:
        # Code typing phase - FASTER (1.5 seconds)
        progress = frame / 30
        line1 = 'POST /api/x402/payment'
        line2 = '{ "amount": 0.001,'
        line3 = '  "to": "0x742d35C...",'
        line4 = '  "protocol": "x402" }'
        
        chars1 = int(progress * len(line1))
        chars2 = int(max(0, progress - 0.25) * len(line2) / 0.75)
        chars3 = int(max(0, progress - 0.5) * len(line3) / 0.5)
        chars4 = int(max(0, progress - 0.75) * len(line4) / 0.25)
        
        draw.text((30, 50), line1[:chars1], fill=code_color, font=fonts['code'])
        if chars2 > 0:
            draw.text((30, 80), line2[:chars2], fill=code_color, font=fonts['code'])
        if chars3 > 0:
            draw.text((30, 110), line3[:chars3], fill=code_color, font=fonts['code'])
        if chars4 > 0:
            draw.text((30, 140), line4[:chars4], fill=code_color, font=fonts['code'])
            
    elif frame < 45:
        # Logo fade in - FASTER (0.75 seconds)
        draw.text((30, 50), 'POST /api/x402/payment', fill=code_color, font=fonts['code'])
        draw.text((30, 80), '{ "amount": 0.001,', fill=code_color, font=fonts['code'])
        draw.text((30, 110), '  "to": "0x742d35C...",', fill=code_color, font=fonts['code'])
        draw.text((30, 140), '  "protocol": "x402" }', fill=code_color, font=fonts['code'])
        
        # MUCH MORE VISIBLE logo with fade
        fade_alpha = min(255, int((frame - 30) / 15 * 255))
        
        # Create logo layer
        logo_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        logo_draw = ImageDraw.Draw(logo_img)
        
        # MUCH LARGER and CENTERED text
        # Get text dimensions for perfect centering
        x_bbox = logo_draw.textbbox((0, 0), 'X', font=fonts['x'])
        x_width = x_bbox[2] - x_bbox[0]
        x_height = x_bbox[3] - x_bbox[1]
        
        num_bbox = logo_draw.textbbox((0, 0), '402', font=fonts['num'])
        num_width = num_bbox[2] - num_bbox[0]
        num_height = num_bbox[3] - num_bbox[1]
        
        # Center the X
        x_x = (width - x_width) // 2
        x_y = (height - x_height) // 2 - 50
        
        # Center the 402 below X
        num_x = (width - num_width) // 2
        num_y = x_y + x_height + 20
        
        # Draw with fade effect
        logo_draw.text((x_x, x_y), 'X', fill=(*x_color, fade_alpha), font=fonts['x'])
        logo_draw.text((num_x, num_y), '402', fill=(*number_color, fade_alpha), font=fonts['num'])
        
        # Composite with main image
        img = Image.alpha_composite(img.convert('RGBA'), logo_img).convert('RGB')
        
    elif frame < 65:
        # Response phase - FASTER (1 second)
        draw.text((30, 50), 'POST /api/x402/payment', fill=code_color, font=fonts['code'])
        draw.text((30, 80), '{ "amount": 0.001,', fill=code_color, font=fonts['code'])
        draw.text((30, 110), '  "to": "0x742d35C...",', fill=code_color, font=fonts['code'])
        draw.text((30, 140), '  "protocol": "x402" }', fill=code_color, font=fonts['code'])
        
        # Response typing
        resp_progress = (frame - 45) / 20
        resp1 = '200 OK'
        resp2 = '{ "status": "confirmed",'
        resp3 = '  "txHash": "0x8f2a..." }'
        
        resp_chars1 = int(resp_progress * len(resp1))
        resp_chars2 = int(max(0, resp_progress - 0.4) * len(resp2) / 0.6)
        resp_chars3 = int(max(0, resp_progress - 0.7) * len(resp3) / 0.3)
        
        draw.text((30, height - 120), resp1[:resp_chars1], fill=code_color, font=fonts['code'])
        if resp_chars2 > 0:
            draw.text((30, height - 90), resp2[:resp_chars2], fill=code_color, font=fonts['code'])
        if resp_chars3 > 0:
            draw.text((30, height - 60), resp3[:resp_chars3], fill=code_color, font=fonts['code'])
        
        # STATIC, VISIBLE logo
        x_bbox = draw.textbbox((0, 0), 'X', font=fonts['x'])
        x_width = x_bbox[2] - x_bbox[0]
        x_height = x_bbox[3] - x_bbox[1]
        
        num_bbox = draw.textbbox((0, 0), '402', font=fonts['num'])
        num_width = num_bbox[2] - num_bbox[0]
        num_height = num_bbox[3] - num_bbox[1]
        
        x_x = (width - x_width) // 2
        x_y = (height - x_height) // 2 - 50
        num_x = (width - num_width) // 2
        num_y = x_y + x_height + 20
        
        draw.text((x_x, x_y), 'X', fill=x_color, font=fonts['x'])
        draw.text((num_x, num_y), '402', fill=number_color, font=fonts['num'])
        
    elif frame < 75:
        # Brief pause - SHORTER (0.5 seconds)
        draw.text((30, 50), 'POST /api/x402/payment', fill=code_color, font=fonts['code'])
        draw.text((30, 80), '{ "amount": 0.001,', fill=code_color, font=fonts['code'])
        draw.text((30, 110), '  "to": "0x742d35C...",', fill=code_color, font=fonts['code'])
        draw.text((30, 140), '  "protocol": "x402" }', fill=code_color, font=fonts['code'])
        draw.text((30, height - 120), '200 OK', fill=code_color, font=fonts['code'])
        draw.text((30, height - 90), '{ "status": "confirmed",', fill=code_color, font=fonts['code'])
        draw.text((30, height - 60), '  "txHash": "0x8f2a..." }', fill=code_color, font=fonts['code'])
        
        # Static visible logo
        x_bbox = draw.textbbox((0, 0), 'X', font=fonts['x'])
        x_width = x_bbox[2] - x_bbox[0]
        x_height = x_bbox[3] - x_bbox[1]
        
        num_bbox = draw.textbbox((0, 0), '402', font=fonts['num'])
        num_width = num_bbox[2] - num_bbox[0]
        
        x_x = (width - x_width) // 2
        x_y = (height - x_height) // 2 - 50
        num_x = (width - num_width) // 2
        num_y = x_y + x_height + 20
        
        draw.text((x_x, x_y), 'X', fill=x_color, font=fonts['x'])
        draw.text((num_x, num_y), '402', fill=number_color, font=fonts['num'])
        
    else:
        # LIGHTNING FAST AI PAYMENT SHOOTING ANIMATION (1.25 seconds)
        shoot_frame = frame - 75
        shoot_progress = shoot_frame / 25
        
        # Show all text
        draw.text((30, 50), 'POST /api/x402/payment', fill=code_color, font=fonts['code'])
        draw.text((30, 80), '{ "amount": 0.001,', fill=code_color, font=fonts['code'])
        draw.text((30, 110), '  "to": "0x742d35C...",', fill=code_color, font=fonts['code'])
        draw.text((30, 140), '  "protocol": "x402" }', fill=code_color, font=fonts['code'])
        draw.text((30, height - 120), '200 OK', fill=code_color, font=fonts['code'])
        draw.text((30, height - 90), '{ "status": "confirmed",', fill=code_color, font=fonts['code'])
        draw.text((30, height - 60), '  "txHash": "0x8f2a..." }', fill=code_color, font=fonts['code'])
        
        # Calculate FAST AI payment positions - MUCH FASTER movement
        center_x = width // 2
        center_y = height // 2
        
        # EXPONENTIAL speed curve for AI-like acceleration
        speed_factor = shoot_progress ** 1.5  # Accelerating curve
        
        # MUCH FASTER movement - cross screen in ~1 second
        x_pos = center_x - int(speed_factor * width * 1.8)  # Faster movement
        four_pos = center_x - int(max(0, speed_factor - 0.15) * width * 1.8)  # Slight delay, but still fast
        
        # Draw moving elements with INTENSE speed effects
        if x_pos > -250:
            # INTENSE speed lines for X
            speed_overlay = draw_speed_lines(draw, x_pos, center_y - 100, width, height, trail_color, 120)
            img = Image.alpha_composite(img.convert('RGBA'), speed_overlay).convert('RGB')
            
            # Dynamic trail effect - MORE AGGRESSIVE
            center_x_start = center_x
            trail_distance = int(speed_factor * 200)  # Longer trails at high speed
            
            for trail_offset in range(0, trail_distance, 15):
                trail_x = x_pos + trail_offset
                if trail_x <= center_x_start and trail_x > x_pos:
                    # Calculate alpha based on distance and speed
                    distance_alpha = max(0, 255 - (trail_offset * 8))
                    speed_alpha = int(distance_alpha * (1 + speed_factor))  # Brighter at higher speeds
                    alpha = min(255, speed_alpha)
                    
                    if alpha > 20:
                        trail_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                        trail_draw = ImageDraw.Draw(trail_img)
                        
                        # Add motion blur effect
                        for blur_offset in range(-2, 3):
                            blur_alpha = alpha // (abs(blur_offset) + 1)
                            if blur_alpha > 10:
                                trail_draw.text((trail_x, center_y - 100 + blur_offset), 'X', 
                                              fill=(*trail_color, blur_alpha), font=fonts['x'])
                        
                        img = Image.alpha_composite(img.convert('RGBA'), trail_img).convert('RGB')
            
            # Main X with glow effect for high speed
            if speed_factor > 0.7:  # Add glow at high speeds
                glow_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                glow_draw = ImageDraw.Draw(glow_img)
                glow_alpha = int(100 * speed_factor)
                
                # Glow effect
                for glow_offset in range(-4, 5):
                    for glow_y in range(-4, 5):
                        if abs(glow_offset) + abs(glow_y) <= 4:
                            glow_draw.text((x_pos + glow_offset, center_y - 100 + glow_y), 'X', 
                                         fill=(*trail_color, glow_alpha // 3), font=fonts['x'])
                
                img = Image.alpha_composite(img.convert('RGBA'), glow_img).convert('RGB')
            
            # Main X - Keep original tier color
            draw.text((x_pos, center_y - 100), 'X', fill=x_color, font=fonts['x'])
        
        if four_pos > -250:
            # Speed lines for 402
            speed_overlay = draw_speed_lines(draw, four_pos, center_y + 20, width, height, trail_color, 100)
            img = Image.alpha_composite(img.convert('RGBA'), speed_overlay).convert('RGB')
            
            # 402 trail effect - AGGRESSIVE
            four_center_start = center_x
            four_trail_distance = int(max(0, speed_factor - 0.15) * 180)
            
            for trail_offset in range(0, four_trail_distance, 12):
                trail_four = four_pos + trail_offset
                if trail_four <= four_center_start and trail_four > four_pos:
                    distance_alpha = max(0, 255 - (trail_offset * 10))
                    speed_alpha = int(distance_alpha * (1 + speed_factor))
                    alpha = min(255, speed_alpha)
                    
                    if alpha > 20:
                        trail_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                        trail_draw = ImageDraw.Draw(trail_img)
                        
                        # Motion blur for 402
                        for blur_offset in range(-1, 2):
                            blur_alpha = alpha // (abs(blur_offset) + 1)
                            if blur_alpha > 10:
                                trail_draw.text((trail_four, center_y + 20 + blur_offset), '402', 
                                              fill=(*trail_color, blur_alpha), font=fonts['num'])
                        
                        img = Image.alpha_composite(img.convert('RGBA'), trail_img).convert('RGB')
            
            # Main 402 with glow at high speed
            if speed_factor > 0.7:
                glow_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                glow_draw = ImageDraw.Draw(glow_img)
                glow_alpha = int(80 * speed_factor)
                
                for glow_offset in range(-3, 4):
                    for glow_y in range(-3, 4):
                        if abs(glow_offset) + abs(glow_y) <= 3:
                            glow_draw.text((four_pos + glow_offset, center_y + 20 + glow_y), '402', 
                                         fill=(*trail_color, glow_alpha // 3), font=fonts['num'])
                
                img = Image.alpha_composite(img.convert('RGBA'), glow_img).convert('RGB')
            
            # Main 402 - Keep original tier color
            draw.text((four_pos, center_y + 20), '402', fill=number_color, font=fonts['num'])
    
    return img

def generate_gif(tier_name, config):
    """Generate GIF for a tier - FAST AI PAYMENT SPEED"""
    print(f"🚀 Generating {tier_name}.gif with FAST AI payment speed...")
    
    frames = []
    
    # Generate 100 frames (5 seconds at 20fps) - FASTER overall
    for frame in range(100):
        img = draw_frame(config, frame)
        frames.append(img)
        
        if frame % 20 == 0:
            print(f"  Frame {frame + 1}/100 ({int((frame + 1) / 100 * 100)}%)")
    
    # Save as GIF with same frame rate but faster action
    output_path = os.path.join(output_dir, f"{tier_name}.gif")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=50,  # 20fps (1000ms/20fps = 50ms per frame)
        loop=0
    )
    
    file_size = os.path.getsize(output_path) // 1024
    print(f"✅ Generated {tier_name}.gif ({file_size}KB)")
    return output_path

def main():
    """Generate all GIFs with FAST AI payment speed"""
    print("🚀 Starting x402 Protocol Pioneer GIF generation...")
    print("⚡ FAST AI PAYMENT SPEED: Lightning-fast sliding animation for AI stablecoin payments\n")
    
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
        print("\n⚡ FAST x402 Protocol Pioneer NFT collection is ready!")
        print("🎨 Features: Official Base brand colors (#0000FF, #ffd12f, etc.)")
        print("⚡ LIGHTNING FAST: AI payment speed sliding animation")
        print("✨ Technical: 5-second duration, 20fps, exponential acceleration")
        print("🚀 Speed lines, motion blur, and glow effects at high velocity")
        print("💨 Perfect for AI stablecoin payment representation!")
        print("🔥 Now fully aligned with Base's official brand guidelines!")

if __name__ == "__main__":
    main()
