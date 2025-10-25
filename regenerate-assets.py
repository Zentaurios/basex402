#!/usr/bin/env python3
"""
x402 Protocol Pioneer Asset Regenerator - OFFICIAL BASE BRAND COLORS
Regenerates all collection assets with the new official Base brand colors
"""

import os
import subprocess
import sys
from datetime import datetime

def run_command(command, description):
    """Run a command and report results"""
    print(f"\n🔄 {description}...")
    print(f"Running: {command}")
    
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully!")
            if result.stdout.strip():
                print("Output:", result.stdout.strip())
        else:
            print(f"❌ {description} failed!")
            if result.stderr.strip():
                print("Error:", result.stderr.strip())
            return False
            
    except Exception as e:
        print(f"❌ {description} failed with exception: {e}")
        return False
    
    return True

def backup_existing_assets():
    """Backup existing assets before regenerating"""
    print("\n📦 Creating backup of existing assets...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_assets_{timestamp}"
    
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)
    
    # Backup directories
    for source_dir in ["public/images", "public/animations"]:
        if os.path.exists(source_dir):
            backup_path = os.path.join(backup_dir, source_dir.replace("/", "_"))
            run_command(f"cp -r {source_dir} {backup_path}", f"Backup {source_dir}")
    
    print(f"✅ Backup created in: {backup_dir}")
    return backup_dir

def verify_scripts_exist():
    """Verify all required scripts exist"""
    print("\n🔍 Verifying required scripts exist...")
    
    required_scripts = [
        "generate-collection-banner.py",
        "generate-gifs-improved.py", 
        "generate-png-improved.py"
    ]
    
    missing_scripts = []
    for script in required_scripts:
        if not os.path.exists(script):
            missing_scripts.append(script)
        else:
            print(f"✅ Found: {script}")
    
    if missing_scripts:
        print(f"❌ Missing scripts: {missing_scripts}")
        return False
    
    print("✅ All required scripts found!")
    return True

def install_dependencies():
    """Install required Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    
    dependencies = ["pillow"]
    
    for dep in dependencies:
        success = run_command(
            f"{sys.executable} -m pip install {dep}", 
            f"Installing {dep}"
        )
        if not success:
            print(f"⚠️  Warning: Failed to install {dep}")

def regenerate_collection_banner():
    """Regenerate the collection banner with official Base colors"""
    return run_command(
        f"{sys.executable} generate-collection-banner.py",
        "Generating collection banner with official Base colors"
    )

def regenerate_gifs():
    """Regenerate all GIF animations with official Base colors"""
    return run_command(
        f"{sys.executable} generate-gifs-improved.py",
        "Generating GIF animations with official Base colors"
    )

def regenerate_pngs():
    """Regenerate all PNG static images with official Base colors"""
    return run_command(
        f"{sys.executable} generate-png-improved.py",
        "Generating PNG static images with official Base colors"
    )

def verify_generated_assets():
    """Verify all assets were generated successfully"""
    print("\n🔍 Verifying generated assets...")
    
    expected_files = {
        "public/images/collection-banner.png": "Collection banner",
        "public/images/protocol-user.png": "Protocol User PNG",
        "public/images/protocol-user.svg": "Protocol User SVG", 
        "public/images/early-adopter.png": "Early Adopter PNG",
        "public/images/early-adopter.svg": "Early Adopter SVG",
        "public/images/pioneer.png": "Pioneer PNG",
        "public/images/pioneer.svg": "Pioneer SVG",
        "public/images/genesis.png": "Genesis PNG",
        "public/images/genesis.svg": "Genesis SVG",
        "public/animations/protocol-user.gif": "Protocol User GIF",
        "public/animations/early-adopter.gif": "Early Adopter GIF",
        "public/animations/pioneer.gif": "Pioneer GIF",
        "public/animations/genesis.gif": "Genesis GIF"
    }
    
    missing_files = []
    total_size = 0
    
    for file_path, description in expected_files.items():
        if os.path.exists(file_path):
            size = os.path.getsize(file_path) // 1024
            total_size += size
            print(f"✅ {description}: {size}KB")
        else:
            missing_files.append(f"{description} ({file_path})")
            print(f"❌ Missing: {description}")
    
    if missing_files:
        print(f"\n❌ Missing files: {len(missing_files)}")
        for missing in missing_files:
            print(f"  • {missing}")
        return False
    
    print(f"\n✅ All assets generated successfully!")
    print(f"📊 Total size: {total_size}KB")
    return True

def update_brand_colors_summary():
    """Display summary of brand color changes"""
    print("\n" + "="*60)
    print("🎨 OFFICIAL BASE BRAND COLORS UPDATE SUMMARY")
    print("="*60)
    
    color_changes = [
        ("Primary Blue", "#0052FF → #0000FF", "✅ Official Base Blue"),
        ("Green/Positive", "#098551 → #66c800", "✅ Official Base Green"),  
        ("Red/Negative", "#cf202f → #fc401f", "✅ Official Base Red"),
        ("Yellow/Warning", "#ed702f → #ffd12f", "✅ Official Base Yellow"),
        ("Cerulean Accent", "NEW → #3c8aff", "✅ Base Cerulean for hovers"),
        ("Gray Scale", "Updated → Official Base Grays", "✅ Complete gray palette")
    ]
    
    print("\n🎯 Key Color Updates:")
    for name, change, status in color_changes:
        print(f"  • {name}: {change} - {status}")
    
    print(f"\n📁 Updated Files:")
    updated_files = [
        "src/app/globals.css - CSS custom properties",
        "src/lib/cdp-theme.ts - CDP wallet theme",
        "tailwind.config.ts - Tailwind color classes",
        "generate-collection-banner.py - Collection banner generator",
        "generate-gifs-improved.py - GIF animation generator", 
        "generate-png-improved.py - PNG static image generator",
        "png-generator.html - HTML PNG generator tool"
    ]
    
    for file in updated_files:
        print(f"  • {file}")
    
    print(f"\n🌟 Benefits:")
    benefits = [
        "Fully aligned with Base's official brand guidelines",
        "More vibrant and recognizable Base blue (#0000FF)",
        "Consistent colors across all marketing materials",
        "Better brand recognition and platform compliance",
        "Professional appearance on NFT marketplaces"
    ]
    
    for benefit in benefits:
        print(f"  • {benefit}")

def main():
    """Main regeneration process"""
    print("🚀 x402 PROTOCOL PIONEER ASSET REGENERATOR")
    print("🎨 UPDATING TO OFFICIAL BASE BRAND COLORS")
    print("="*60)
    
    # Step 1: Verify environment
    if not verify_scripts_exist():
        print("\n❌ Cannot proceed - missing required scripts")
        return False
    
    # Step 2: Install dependencies
    install_dependencies()
    
    # Step 3: Create backup
    backup_dir = backup_existing_assets()
    
    # Step 4: Regenerate all assets
    print("\n🎨 Regenerating all assets with official Base brand colors...")
    
    success_count = 0
    total_tasks = 3
    
    if regenerate_collection_banner():
        success_count += 1
    
    if regenerate_gifs():
        success_count += 1
    
    if regenerate_pngs():
        success_count += 1
    
    # Step 5: Verify results
    print(f"\n📊 Regeneration completed: {success_count}/{total_tasks} tasks successful")
    
    if success_count == total_tasks:
        if verify_generated_assets():
            print("\n🎉 SUCCESS: All assets regenerated with official Base brand colors!")
            update_brand_colors_summary()
            
            print(f"\n📋 Next Steps:")
            print(f"1. Review the updated assets in public/images/ and public/animations/")
            print(f"2. Test the updated colors in your application")
            print(f"3. Deploy the updated assets to your platform")
            print(f"4. Update any documentation referencing the old colors")
            print(f"5. Backup available in: {backup_dir}")
            
            return True
        else:
            print("\n⚠️  Assets generated but some files are missing")
            return False
    else:
        print(f"\n❌ Some regeneration tasks failed. Check the logs above.")
        print(f"💾 Your original assets are backed up in: {backup_dir}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
