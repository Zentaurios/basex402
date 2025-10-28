#!/usr/bin/env node

/**
 * x402 Protocol Pioneer NFT GIF Generator
 * Generates animated GIFs for all four tiers
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

// Ensure public/images directory exists
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Tier configurations
const tiers = {
    'protocol-user': {
        bg: '#ffffff',
        codeColor: '#333333',
        xColor: '#000000',
        numberColor: '#0052FF',
        trailColor: '#cccccc',
        particleCount: 8,
        filename: 'protocol-user.gif'
    },
    'early-adopter': {
        bg: '#000000',
        codeColor: '#0052FF',
        xColor: '#0052FF',
        numberColor: '#ffffff',
        trailColor: '#0052FF',
        particleCount: 12,
        filename: 'early-adopter.gif'
    },
    'pioneer': {
        bg: '#0052FF',
        codeColor: '#ffffff',
        xColor: '#000000',
        numberColor: '#ffffff',
        trailColor: '#ffffff',
        particleCount: 18,
        filename: 'pioneer.gif'
    },
    'genesis': {
        bg: '#0052FF',
        codeColor: '#FFD700',
        xColor: '#000000',
        numberColor: '#ffffff',
        trailColor: '#FFD700',
        particleCount: 25,
        goldBorder: true,
        filename: 'genesis.gif'
    }
};

function drawFrame(ctx, config, animState, canvasSize) {
    // Clear canvas
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Gold border for Genesis
    if (config.goldBorder) {
        const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFED4E');
        gradient.addColorStop(1, '#B8860B');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.floor(canvasSize * 0.024);
        ctx.strokeRect(6, 6, canvasSize - 12, canvasSize - 12);
    }
    
    // Scale factors
    const scale = canvasSize / 512;
    const fontSize = Math.floor(12 * scale);
    const xFontSize = Math.floor(60 * scale);
    const numFontSize = Math.floor(32 * scale);
    
    // Draw code text (top area)
    ctx.fillStyle = config.codeColor;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'left';
    
    const codeLines = [
        'POST /api/x402/payment',
        '{ "amount": 0.001,',
        '  "to": "0x742d35C6...",',
        '  "protocol": "x402" }'
    ];
    
    if (['code-in', 'logo-in', 'response', 'pause'].includes(animState.phase)) {
        codeLines.forEach((line, i) => {
            const visibleChars = Math.max(0, animState.codeText.length - (i * 25));
            const displayText = line.substring(0, visibleChars);
            ctx.fillText(displayText, 20 * scale, (40 + i * 16) * scale);
        });
    }
    
    // Draw x402logo (center)
    if (animState.logoOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = animState.logoOpacity;
        
        // X
        ctx.fillStyle = config.xColor;
        ctx.font = `bold ${xFontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('X', animState.xPos, canvasSize/2 - 10 * scale);
        
        // 402
        ctx.fillStyle = config.numberColor;
        ctx.font = `bold ${numFontSize}px monospace`;
        ctx.fillText('402', animState.fourPos, canvasSize/2 + 40 * scale);
        
        ctx.restore();
    }
    
    // Draw response text (bottom area)
    if (['response', 'pause'].includes(animState.phase)) {
        ctx.fillStyle = config.codeColor;
        ctx.font = `${fontSize}px monospace`;
        const responseLines = [
            '200 OK',
            '{ "status": "confirmed",',
            '  "txHash": "0x8f2a1b..." }'
        ];
        
        responseLines.forEach((line, i) => {
            const visibleChars = Math.max(0, animState.responseText.length - (i * 20));
            const displayText = line.substring(0, visibleChars);
            ctx.fillText(displayText, 20 * scale, (canvasSize - 80 + i * 16) * scale);
        });
    }
    
    // Draw particles
    animState.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x * scale, particle.y * scale, particle.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function updateAnimationFrame(animState, config) {
    animState.frame++;
    
    // Phase timing (30fps base)
    const timings = {
        'code-in': 30,      // 1 second
        'logo-in': 15,      // 0.5 seconds  
        'response': 24,     // 0.8 seconds
        'pause': 9,         // 0.3 seconds
        'shoot-x': 21,      // 0.7 seconds
        'shoot-402': 21,    // 0.7 seconds
        'fade-out': 15      // 0.5 seconds
    };
    
    switch(animState.phase) {
        case 'code-in':
            animState.codeText += 'x';
            if (animState.frame >= timings['code-in']) {
                animState.phase = 'logo-in';
                animState.frame = 0;
            }
            break;
            
        case 'logo-in':
            animState.logoOpacity = Math.min(1, animState.frame / timings['logo-in']);
            if (animState.frame >= timings['logo-in']) {
                animState.phase = 'response';
                animState.frame = 0;
            }
            break;
            
        case 'response':
            animState.responseText += 'x';
            if (animState.frame >= timings['response']) {
                animState.phase = 'pause';
                animState.frame = 0;
            }
            break;
            
        case 'pause':
            if (animState.frame >= timings['pause']) {
                animState.phase = 'shoot-x';
                animState.frame = 0;
            }
            break;
            
        case 'shoot-x':
            const xProgress = animState.frame / timings['shoot-x'];
            animState.xPos = 256 - (xProgress * 320);
            
            // Add X particles
            if (animState.frame % 2 === 0) {
                for (let i = 0; i < config.particleCount / 5; i++) {
                    animState.particles.push({
                        x: animState.xPos + 20,
                        y: 200 + Math.random() * 20 - 10,
                        size: Math.random() * 3 + 1,
                        opacity: 1,
                        color: config.trailColor,
                        vx: Math.random() * 3 + 2,
                        vy: Math.random() * 2 - 1
                    });
                }
            }
            
            if (animState.frame >= timings['shoot-x']) {
                animState.phase = 'shoot-402';
                animState.frame = 0;
            }
            break;
            
        case 'shoot-402':
            const fourProgress = animState.frame / timings['shoot-402'];
            animState.fourPos = 256 - (fourProgress * 320);
            
            // Add 402 particles
            if (animState.frame % 2 === 0) {
                for (let i = 0; i < config.particleCount / 4; i++) {
                    animState.particles.push({
                        x: animState.fourPos + 30,
                        y: 240 + Math.random() * 20 - 10,
                        size: Math.random() * 4 + 1,
                        opacity: 1,
                        color: config.trailColor,
                        vx: Math.random() * 4 + 2,
                        vy: Math.random() * 2 - 1
                    });
                }
            }
            
            if (animState.frame >= timings['shoot-402']) {
                animState.phase = 'fade-out';
                animState.frame = 0;
            }
            break;
            
        case 'fade-out':
            const fadeProgress = animState.frame / timings['fade-out'];
            animState.logoOpacity = 1 - fadeProgress;
            
            if (animState.frame >= timings['fade-out']) {
                // Reset for loop (but we'll only do one loop for GIF)
                return true; // Signal end
            }
            break;
    }
    
    // Update particles
    animState.particles = animState.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity -= 0.015;
        particle.size *= 0.985;
        return particle.opacity > 0 && particle.size > 0.1;
    });
    
    return false; // Continue animation
}

async function generateTierGIF(tierName, config) {
    console.log(`🎬 Generating ${tierName} GIF...`);
    
    const canvasSize = 512;
    const frameRate = 30;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');
    
    // Setup GIF encoder
    const encoder = new GIFEncoder(canvasSize, canvasSize);
    const outputPath = path.join(imagesDir, config.filename);
    const stream = fs.createWriteStream(outputPath);
    
    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0);   // Loop forever
    encoder.setDelay(1000 / frameRate);
    encoder.setQuality(20); // Good quality/size balance
    
    // Initialize animation state
    const animState = {
        frame: 0,
        phase: 'code-in',
        codeText: '',
        responseText: '',
        xPos: canvasSize / 2,
        fourPos: canvasSize / 2,
        logoOpacity: 0,
        particles: []
    };
    
    // Generate frames
    let frameCount = 0;
    let animationComplete = false;
    
    while (!animationComplete && frameCount < 150) { // Max 5 seconds at 30fps
        // Draw current frame
        drawFrame(ctx, config, animState, canvasSize);
        
        // Add frame to GIF
        encoder.addFrame(ctx);
        
        // Update animation
        animationComplete = updateAnimationFrame(animState, config);
        frameCount++;
        
        if (frameCount % 30 === 0) {
            console.log(`  Frame ${frameCount}/135 (${Math.round(frameCount/135*100)}%)`);
        }
    }
    
    encoder.finish();
    
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            console.log(`✅ Generated ${config.filename} (${frameCount} frames)`);
            resolve(outputPath);
        });
        
        stream.on('error', reject);
    });
}

async function generateAllGIFs() {
    console.log('🚀 Starting x402 Protocol Pioneer NFT GIF generation...\n');
    
    const results = [];
    
    for (const [tierName, config] of Object.entries(tiers)) {
        try {
            const outputPath = await generateTierGIF(tierName, config);
            results.push({ tier: tierName, path: outputPath, success: true });
        } catch (error) {
            console.error(`❌ Failed to generate ${tierName}: ${error.message}`);
            results.push({ tier: tierName, error: error.message, success: false });
        }
        
        console.log(); // Add spacing
    }
    
    // Summary
    console.log('📊 Generation Summary:');
    console.log('=====================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    successful.forEach(result => {
        const fileSize = fs.statSync(result.path).size;
        const sizeKB = Math.round(fileSize / 1024);
        console.log(`✅ ${result.tier}.gif - ${sizeKB}KB`);
    });
    
    if (failed.length > 0) {
        console.log('\nFailed:');
        failed.forEach(result => {
            console.log(`❌ ${result.tier} - ${result.error}`);
        });
    }
    
    console.log(`\n🎉 Generated ${successful.length}/${results.length} GIFs successfully!`);
    console.log(`📁 Files saved to: ${imagesDir}`);
    
    if (successful.length === 4) {
        console.log('\n🌟 Your x402 Protocol Pioneer NFT collection is ready!');
        console.log('Each GIF tells the story of micropayment protocol in action.');
    }
}

// Check if required packages are available
try {
    require('canvas');
    require('gifencoder');
} catch (error) {
    console.error('❌ Missing required packages. Please install:');
    console.error('npm install canvas gifencoder');
    console.error('\nNote: canvas requires some system dependencies:');
    console.error('macOS: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
    console.error('Ubuntu: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev');
    process.exit(1);
}

// Run the generator
if (require.main === module) {
    generateAllGIFs().catch(console.error);
}

module.exports = { generateAllGIFs, generateTierGIF };
