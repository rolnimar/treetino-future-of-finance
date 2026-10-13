const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG = '/Users/jakub/Projects/resys/node_modules/ffmpeg-static/ffmpeg';
const workDir = '/Users/jakub/Downloads/video_frames_temp';
const mainVideo =
  '/Users/jakub/Downloads/VID_20261011_173611-color-corrected.mp4';
const droneImage =
  '/Users/jakub/.gemini/antigravity/brain/7c5fbc20-3ba0-4dd8-ad6d-17affbe51dc5/windfarm_higher_drone_flat_ground_1791741928238.jpg';
const logoPng =
  '/Users/jakub/Projects/treetino-hack/frontend/public/branding/logo_horizontal.png';
const fontFile = '/System/Library/Fonts/HelveticaNeue.ttc';

console.log('Rendering 5s drone outro...');

// 1. Prepare drone outro 5s clip with zoom/crane motion and logo fade-in
const outroMp4 = path.join(workDir, 'drone_outro.mp4');

// Scale image to 1920x1080, apply subtle drone ascending zoom-out (scale from 1.08 down to 1.0 over 150 frames at 30fps)
// Overlay Treetino logo with fade-in starting at 2.0s (frame 60)
// Draw text "Future of energy rooted in sustainability"
const filterComplex = [
  // Input 0: drone image looped for 5s (150 frames) with subtle drone ascending motion
  `[0:v]scale=2100:1180,zoompan=z='max(1.0, 1.08-0.08*on/150)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2+15*on/150':d=150:s=1920x1080:fps=30[bg]`,
  // Input 1: Logo scaled to 500px with smooth fade-in
  `[1:v]scale=520:-1,format=rgba,fade=t=in:st=1.8:d=1.0:alpha=1[logo]`,
  // Overlay logo onto bg at center upper-middle
  `[bg][logo]overlay=(W-w)/2:320:enable='gte(t,1.8)'[with_logo]`,
  // Overlay claim text under logo
  `[with_logo]drawtext=fontfile='${fontFile}':text='Future of energy rooted in sustainability':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=480:alpha='if(lt(t,2.2), 0, if(lt(t,3.2), (t-2.2), 1))':shadowcolor=black@0.7:shadowx=2:shadowy=2[outv]`,
].join(';');

const outroCmd = `"${FFMPEG}" -loop 1 -t 5 -i "${droneImage}" -i "${logoPng}" -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -y "${outroMp4}"`;

console.log('Running ffmpeg for outro...');
execSync(outroCmd, { stdio: 'inherit' });
console.log('Outro generated successfully:', outroMp4);
