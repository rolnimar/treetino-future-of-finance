const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG = '/Users/jakub/Projects/resys/node_modules/ffmpeg-static/ffmpeg';
const mainVideo =
  '/Users/jakub/Downloads/VID_20261011_173611-color-corrected.mp4';
const droneImage =
  '/Users/jakub/.gemini/antigravity/brain/7c5fbc20-3ba0-4dd8-ad6d-17affbe51dc5/windfarm_higher_drone_flat_ground_1791741928238.jpg';
const logoPng =
  '/Users/jakub/Projects/treetino-hack/frontend/public/branding/logo_horizontal.png';
const fontFile = '/System/Library/Fonts/HelveticaNeue.ttc';
const outputFinal =
  '/Users/jakub/Downloads/treetino-drone-commercial-complete.mp4';
const tempDir = '/Users/jakub/Downloads/video_frames_temp';

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const brandOverlay = path.join(tempDir, 'brand_overlay_clean.png');

console.log('🚀 Step 1: Rendering 5s Cinematic Drone Outro...');

const outroClip = path.join(tempDir, 'drone_outro_clip.mp4');

// Create 5s (150 frames @ 30fps) drone shot:
// - Camera smoothly ascends and pulls back (zoom from 1.10 to 1.0)
// - Brand overlay (Logo + Claim with clean drop shadow) fades in at 1.8s
// - Smooth fade to black in the final 0.6s
const filterOutro = [
  // 1. Drone background with smooth camera ascend/pull-back
  `[0:v]scale=2160:1215,zoompan=z='max(1.0, 1.10-0.10*on/150)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2+20*on/150':d=150:s=1920x1080:fps=30[bg]`,
  // 2. Brand overlay with smooth fade in
  `[1:v]format=rgba,fade=t=in:st=1.6:d=0.8:alpha=1[brand]`,
  // 3. Composite brand overlay onto background
  `[bg][brand]overlay=0:0:enable='gte(t,1.6)'[v_brand]`,
  // 4. Final subtle fade out to black at the very end (4.4s - 5.0s)
  `[v_brand]fade=t=out:st=4.4:d=0.6[v_out]`,
].join(';');

const cmdOutro = `"${FFMPEG}" -loop 1 -i "${droneImage}" -loop 1 -i "${brandOverlay}" -filter_complex "${filterOutro}" -map "[v_out]" -t 5 -c:v libx264 -pix_fmt yuv420p -r 30 -y "${outroClip}"`;
console.log('Rendering outro with command...');
execSync(cmdOutro, { stdio: 'inherit' });

console.log(
  '🎬 Step 2: Combining Main Video with Drone Outro using Smooth Crossfade...',
);

// Main video is ~14.68s.
// We crossfade the last 0.6s of the main video with the first 0.6s of the outro clip!
// Total duration = 14.68 + 5.0 - 0.6 = ~19.08s
const filterTransition = [
  // Normalize both video streams (timebase, framerate, SAR) for rock-solid crossfade
  `[0:v]settb=AVTB,fps=30,scale=1920:1080,setsar=1[v0]`,
  `[1:v]settb=AVTB,fps=30,scale=1920:1080,setsar=1[v1]`,
  `[v0][v1]xfade=transition=fade:duration=0.6:offset=14.0[v]`,
  // Audio: keep original audio and fade out gently during the outro
  `[0:a]afade=t=out:st=14.0:d=1.5[a]`,
].join(';');

const cmdFinal = `"${FFMPEG}" -i "${mainVideo}" -i "${outroClip}" -filter_complex "${filterTransition}" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -y "${outputFinal}"`;

console.log('Rendering complete video...');
execSync(cmdFinal, { stdio: 'inherit' });

console.log('✅ COMPLETE! Final video rendered to:', outputFinal);
