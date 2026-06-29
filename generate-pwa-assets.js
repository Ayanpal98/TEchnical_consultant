import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
fs.mkdirSync(publicDir, { recursive: true });

console.log('Generating PWA assets...');

// Helper to draw anti-aliased shapes on a 1024x1024 high-res canvas
const canvasSize = 1024;
const mid = canvasSize / 2;

// Colors in RGBA format
const COLOR_BLUE_GRADIENT_START = { r: 13, g: 71, b: 161, a: 255 }; // #0D47A1
const COLOR_BLUE_GRADIENT_END = { r: 21, g: 101, b: 192, a: 255 };  // #1565C0
const COLOR_TEAL = { r: 0, g: 191, b: 166, a: 255 };                // #00BFA6
const COLOR_WHITE = { r: 255, g: 255, b: 255, a: 255 };
const COLOR_LIGHT_BLUE = { r: 227, g: 242, b: 253, a: 255 };        // #E3F2FD
const COLOR_BG_DARK = { r: 30, g: 41, b: 59, a: 255 };              // #1E293B

// Helper to interpolate colors (for gradients)
function lerp(start, end, t) {
  return {
    r: Math.round(start.r + (end.r - start.r) * t),
    g: Math.round(start.g + (end.g - start.g) * t),
    b: Math.round(start.b + (end.b - start.b) * t),
    a: Math.round(start.a + (end.a - start.a) * t),
  };
}

// Convert RGBA object to 32-bit color number for Jimp
function rgbaToNum(c) {
  return ((c.r << 24) | (c.g << 16) | (c.b << 8) | c.a) >>> 0;
}

// SDF (Signed Distance Field) helper functions for smooth anti-aliased rendering
function sdCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

function sdRoundedRect(px, py, x, y, w, h, r) {
  const dx = Math.max(x - px, px - (x + w));
  const dy = Math.max(y - py, py - (y + h));
  
  // Inside/outside distance computation simplified for rendering
  const qx = Math.max(Math.abs(px - (x + w / 2)) - (w / 2 - r), 0);
  const qy = Math.max(Math.abs(py - (y + h / 2)) - (h / 2 - r), 0);
  return Math.sqrt(qx * qx + qy * qy) - r;
}

function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.min(Math.max((pax * bax + pay * bay) / (bax * bax + bay * bay), 0), 1);
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy);
}

function sdHeart(px, py, cx, cy, w) {
  // Translate coordinate space relative to center of heart
  let x = (px - cx) / (w * 0.5);
  let y = -(py - cy + w * 0.1) / (w * 0.5); // flip y for standard Cartesian
  
  // Heart equation approximation
  const term1 = x * x + y * y - 0.7;
  const f = term1 * term1 * term1 - x * x * y * y * y;
  return f * 100.0;
}

async function buildIcons() {
  // We will build a high-resolution 1024x1024 icon
  console.log('Rendering 1024x1024 master icon...');
  const master = new Jimp({ width: 1024, height: 1024, color: 0x00000000 });

  // Generate pixels for the beautiful logo
  for (let y = 0; y < canvasSize; y++) {
    const tY = y / canvasSize;
    for (let x = 0; x < canvasSize; x++) {
      const tX = x / canvasSize;
      
      // 1. Draw solid rounded app-icon background (or full square for maskable)
      // Background gradient
      const bgCol = lerp(COLOR_BLUE_GRADIENT_START, COLOR_BLUE_GRADIENT_END, (tX + tY) / 2);
      
      // We will make the icon look like a native application launcher icon with a smooth dark blue gradient base
      let finalColor = bgCol;

      // 2. Smartphone Frame
      // Centered at 512, 512 with width 320, height 540, radius 80, stroke 24
      const dPhoneOuter = sdRoundedRect(x, y, 352, 242, 320, 540, 80);
      const dPhoneInner = sdRoundedRect(x, y, 376, 266, 272, 492, 56);
      
      // Phone frame border (stroke 24)
      const dPhoneBorder = Math.max(dPhoneOuter, -dPhoneInner);
      
      // 3. Stethoscope Ear Tubes (Left wrapper)
      // Left ear tube is centered at 352, 512
      const dTubeLeft = sdCircle(x, y, 352, 560, 110);
      const dTubeLeftClip = x - 352; // only left side of center
      const dTubeLeftStroke = Math.abs(dTubeLeft) - 12; // thickness 24
      
      let isTubeLeft = dTubeLeftStroke < 0 && dTubeLeftClip < 0 && y > 380 && y < 700;
      
      // Ear tip circle
      const dEarTip = sdCircle(x, y, 242, 380, 16);
      const isEarTip = dEarTip < 0;

      // 4. Stethoscope Diaphragm (Right wrapper)
      // Curve from bottom-right of phone (550, 750) to chestpiece (720, 560)
      const dDiaphragmConnector = sdCircle(x, y, 540, 560, 180);
      const dDiaphragmClip = x - 540; // right side
      const dDiaphragmStroke = Math.abs(dDiaphragmConnector) - 12;
      const isDiaphragmConnector = dDiaphragmStroke < 0 && dDiaphragmClip > 0 && y > 560 && y < 740;

      // Diaphragm Outer Circle (Chestpiece) at 720, 512
      const dChestpieceOuter = sdCircle(x, y, 720, 512, 48);
      const dChestpieceInner = sdCircle(x, y, 720, 512, 36);
      const isChestpieceBorder = dChestpieceOuter < 0 && dChestpieceInner > 0;
      const isChestpieceInner = sdCircle(x, y, 720, 512, 24) < 0;

      // 5. Phone screen inner content
      // Heart centered at 512, 440 with width 220
      const dHeartShape = sdHeart(x, y, 512, 440, 220);
      const isHeart = dHeartShape < 0 && dPhoneInner < 0;

      // Medical cross inside heart (horizontal/vertical bars)
      const isCrossHoriz = Math.abs(x - 512) < 26 && Math.abs(y - 410) < 10;
      const isCrossVert = Math.abs(x - 512) < 10 && Math.abs(y - 410) < 26;
      const isCross = (isCrossHoriz || isCrossVert) && isHeart;

      // ECG Line inside heart
      // We check distance to ECG segment list
      const ecgPoints = [
        [390, 460], [425, 460], [440, 485], [455, 415], [472, 505], [485, 460],
        [539, 460], [552, 488], [568, 420], [585, 502], [598, 460], [634, 460]
      ];
      let isEcg = false;
      if (isHeart && !isCross) {
        for (let i = 0; i < ecgPoints.length - 1; i++) {
          const dSeg = sdSegment(x, y, ecgPoints[i][0], ecgPoints[i][1], ecgPoints[i+1][0], ecgPoints[i+1][1]);
          if (dSeg < 7) {
            isEcg = true;
            break;
          }
        }
      }

      // Avatars inside phone bottom screen (Patient and Clinician)
      // Clinician (Left): Head centered at 460, 600 radius 28. Body curve.
      const dClinicianHead = sdCircle(x, y, 468, 610, 32);
      const dClinicianBody = sdCircle(x, y, 468, 760, 110);
      const isClinician = (dClinicianHead < 0 || (dClinicianBody < 0 && y > 660)) && dPhoneInner < 0 && !isHeart;

      // Patient (Right): Head centered at 556, 644 radius 22. Body curve.
      const dPatientHead = sdCircle(x, y, 556, 644, 24);
      const dPatientBody = sdCircle(x, y, 556, 760, 80);
      const isPatient = (dPatientHead < 0 || (dPatientBody < 0 && y > 684)) && dPhoneInner < 0 && !isHeart && !isClinician;

      // Assemble layers
      // Phone Frame Background Screen
      if (dPhoneInner < 0) {
        finalColor = COLOR_BG_DARK; // screen background color
      }

      // Render items
      if (isClinician) {
        finalColor = COLOR_BLUE_GRADIENT_START;
      } else if (isPatient) {
        finalColor = COLOR_TEAL;
      } else if (isCross) {
        finalColor = COLOR_WHITE;
      } else if (isEcg) {
        finalColor = COLOR_WHITE;
      } else if (isHeart) {
        finalColor = COLOR_TEAL;
      }

      // Phone Frame Border
      if (dPhoneBorder < 0) {
        finalColor = COLOR_WHITE;
      }

      // Smartphone Speaker Pill
      const dSpeaker = sdRoundedRect(x, y, 472, 212, 80, 12, 6);
      if (dSpeaker < 0) {
        finalColor = COLOR_WHITE;
      }

      // Left tube and Ear Tip
      if (isTubeLeft || isEarTip) {
        finalColor = COLOR_WHITE;
      }

      // Right Diaphragm connector
      if (isDiaphragmConnector) {
        finalColor = COLOR_WHITE;
      }

      // Right Chestpiece
      if (isChestpieceBorder) {
        finalColor = COLOR_WHITE;
      } else if (isChestpieceInner) {
        finalColor = COLOR_TEAL;
      }

      // Set the calculated color to the master image
      master.setPixelColor(rgbaToNum(finalColor), x, y);
    }
  }

  // Save raw high-res master icon
  const rawMasterPath = path.join(publicDir, 'icon-master.png');
  await master.write(rawMasterPath);
  console.log('Master icon generated.');

  // Generate all required PWA icon sizes
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    console.log(`Resizing to ${size}x${size}...`);
    const resized = master.clone().resize({ w: size, h: size });
    await resized.write(path.join(publicDir, `icon-${size}x${size}.png`));
  }

  // Generate Apple Touch Icon (180x180 is typical, but we can also use 152x152 or 192x192, let's write apple-touch-icon.png at 180x180)
  console.log('Generating apple-touch-icon.png (180x180)...');
  const appleTouchIcon = master.clone().resize({ w: 180, h: 180 });
  await appleTouchIcon.write(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Maskable Icon (512x512)
  console.log('Generating maskable-icon.png...');
  const maskableIcon = master.clone().resize({ w: 512, h: 512 });
  await maskableIcon.write(path.join(publicDir, 'maskable-icon.png'));

  // Generate Favicon.png (64x64) and Shortcut-Icon (192x192 clone)
  console.log('Generating favicon.png...');
  const favicon = master.clone().resize({ w: 64, h: 64 });
  await favicon.write(path.join(publicDir, 'favicon.png'));

  console.log('All PNG assets generated successfully!');
}

// Generate the beautiful matching SVG Icon (crisp vector)
function buildSvgIcon() {
  const svgContent = `<svg width="512" height="512" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Main Blue Gradient -->
    <linearGradient id="blueGradient" x1="150" y1="100" x2="300" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D47A1" />
      <stop offset="100%" stop-color="#1565C0" />
    </linearGradient>

    <!-- Teal / Green Gradient -->
    <linearGradient id="tealGradient" x1="160" y1="90" x2="290" y2="225" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00E5D4" />
      <stop offset="100%" stop-color="#00BFA6" />
    </linearGradient>

    <!-- Blue Avatar Gradient -->
    <linearGradient id="avatarBlue" x1="175" y1="260" x2="235" y2="330" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D47A1" />
      <stop offset="100%" stop-color="#1A237E" />
    </linearGradient>

    <!-- Clip path for cutting off avatars inside the rounded phone bottom -->
    <clipPath id="phoneInnerClip">
      <rect x="156" y="106" width="138" height="238" rx="30" />
    </clipPath>
  </defs>

  <!-- Background for app icons -->
  <rect width="450" height="450" rx="90" fill="url(#blueGradient)" />

  <!-- 1. Stethoscope ear tubes (binaural loop) on the left -->
  <path
    d="M 150 160 C 110 160 100 210 100 240 C 100 280 120 310 150 310"
    stroke="#FFFFFF"
    stroke-width="11"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Ear tip dot on left binaural -->
  <circle cx="150" cy="160" r="7" fill="#FFFFFF" />

  <!-- 2. Stethoscope chestpiece (diaphragm) on the right -->
  <!-- Diaphragm connection curve from phone bottom right -->
  <path
    d="M 265 340 C 315 340 335 300 335 247"
    stroke="#FFFFFF"
    stroke-width="11"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Diaphragm Outer Circle -->
  <circle
    cx="335"
    cy="225"
    r="22"
    stroke="#FFFFFF"
    stroke-width="10"
    fill="#1E293B"
  />
  <!-- Diaphragm Inner Circle -->
  <circle
    cx="335"
    cy="225"
    r="12"
    fill="url(#tealGradient)"
  />

  <!-- 3. Smartphone Frame -->
  <rect
    x="150"
    y="100"
    width="150"
    height="250"
    rx="36"
    fill="#1E293B"
    stroke="#FFFFFF"
    stroke-width="12"
  />

  <!-- Smartphone Speaker Pill at the top -->
  <rect
    x="205"
    y="114"
    width="40"
    height="6"
    rx="3"
    fill="#FFFFFF"
  />

  <!-- 4. Clustered content inside the phone, utilizing the inner clip path -->
  <g clip-path="url(#phoneInnerClip)">
    <!-- Teal Heart -->
    <path
      d="M 225 225 C 185 185 160 155 160 130 C 160 108 178 90 200 90 C 213 90 221 97 225 103 C 229 97 237 90 250 90 C 272 90 290 108 290 130 C 290 155 265 185 225 225 Z"
      fill="url(#tealGradient)"
    />

    <!-- White Medical Cross inside Heart -->
    <rect x="213" y="140" width="24" height="10" rx="3.5" fill="white" />
    <rect x="220" y="133" width="10" height="24" rx="3.5" fill="white" />

    <!-- White ECG Zig-zag Line crossing Heart -->
    <path
      d="M 165 145 L 182 145 L 189 157 L 197 122 L 205 168 L 211 145 L 239 145 L 245 159 L 253 125 L 261 166 L 267 145 L 285 145"
      stroke="white"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />

    <!-- Avatar 1: Clinician (Deep Blue, Left) -->
    <!-- Head -->
    <circle cx="205" cy="255" r="14" fill="url(#avatarBlue)" />
    <!-- Body -->
    <path
      d="M 175 325 C 175 292 190 280 205 280 C 220 280 235 292 235 325 Z"
      fill="url(#avatarBlue)"
    />

    <!-- Avatar 2: Patient (Teal, Right) -->
    <!-- Head -->
    <circle cx="245" cy="270" r="10.5" fill="url(#tealGradient)" />
    <!-- Body -->
    <path
      d="M 222 325 C 222 299 232 291 245 291 C 258 291 268 299 268 325 Z"
      fill="url(#tealGradient)"
    />
  </g>
</svg>`;

  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Vector SVG asset generated at public/icon.svg');
}

async function run() {
  try {
    buildSvgIcon();
    await buildIcons();
    console.log('PWA assets generated successfully!');
  } catch (error) {
    console.error('Failed to generate PWA assets:', error);
    process.exit(1);
  }
}

run();
