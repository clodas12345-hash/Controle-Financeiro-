const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function findLogoSource() {
  const dirs = [path.join(__dirname, 'public'), __dirname];
  const priorityPatterns = [
    /converted_image/i,
    /foto/i,
    /imagem/i,
    /logo\.(png|jpg|jpeg|webp)/i,
    /icon\.(png|jpg|jpeg|webp)/i,
    /app_icon\.(png|jpg|jpeg|webp)/i,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const pattern of priorityPatterns) {
      const match = files.find(f => pattern.test(f) && !f.endsWith('.cjs') && !f.endsWith('.js') && !f.endsWith('.ts'));
      if (match) {
        return path.join(dir, match);
      }
    }
  }

  const fallback = path.join(__dirname, 'public', 'logo.png');
  return fallback;
}

let LOGO_SRC = findLogoSource();
const RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function generateAssets() {
  if (!fs.existsSync(LOGO_SRC)) {
    console.error('Source logo not found. Please upload logo.png into the public folder!');
    process.exit(1);
  }

  // Ensure public/logo.png exists for the web/pwa build
  const publicPng = path.join(__dirname, 'public', 'logo.png');
  if (LOGO_SRC !== publicPng) {
    fs.copyFileSync(LOGO_SRC, publicPng);
  }

  if (!fs.existsSync(RES_DIR)) {
    console.log('Android res directory does not exist yet. Run cap add android first.');
    return;
  }

  console.log('Generating Android icons and splash screens from:', LOGO_SRC);

  // 1. Remove generic vector drawables that override mipmaps on API 24+
  const genericVectors = [
    path.join(RES_DIR, 'drawable-v24', 'ic_launcher_foreground.xml'),
    path.join(RES_DIR, 'drawable', 'ic_launcher_background.xml'),
    path.join(RES_DIR, 'drawable-v24')
  ];

  for (const item of genericVectors) {
    if (fs.existsSync(item)) {
      try {
        const stat = fs.statSync(item);
        if (stat.isDirectory()) {
          fs.rmSync(item, { recursive: true, force: true });
        } else {
          fs.unlinkSync(item);
        }
        console.log('Removed generic vector:', item);
      } catch (e) {
        console.warn('Could not remove:', item, e.message);
      }
    }
  }

  // 2. Set background color to midnight navy #07152b
  const valuesDir = path.join(RES_DIR, 'values');
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
  const bgXmlPath = path.join(valuesDir, 'ic_launcher_background.xml');
  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#07152b</color>
</resources>
`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf8');
  console.log('Updated ic_launcher_background.xml with #07152b');

  // 2b. Set App Name to "Controle Financeiro" (removing GKD)
  const stringsXmlPath = path.join(valuesDir, 'strings.xml');
  const stringsXmlContent = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Controle Financeiro</string>
    <string name="title_activity_main">Controle Financeiro</string>
    <string name="package_name">com.gkd.mobility</string>
    <string name="custom_url_scheme">com.gkd.mobility</string>
</resources>
`;
  fs.writeFileSync(stringsXmlPath, stringsXmlContent, 'utf8');
  console.log('Updated strings.xml with app_name: "Controle Financeiro"');

  // 3. Launcher mipmaps configurations
  // Adaptive foreground needs ~15% inset so it does not get cropped by circular masks
  const mipmapSizes = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 }
  ];

  for (const { dir, iconSize, fgSize } of mipmapSizes) {
    const targetDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Full icon (square / standard)
    const iconBuf = await sharp(LOGO_SRC)
      .resize(iconSize, iconSize, { fit: 'cover' })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconBuf);

    // Round icon (with circular crop)
    const circleSvg = Buffer.from(
      `<svg width="${iconSize}" height="${iconSize}"><circle cx="${iconSize / 2}" cy="${iconSize / 2}" r="${iconSize / 2}" fill="#fff"/></svg>`
    );
    const roundBuf = await sharp(iconBuf)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundBuf);

    // Foreground icon for adaptive icon (centered with safe zone padding)
    const innerSize = Math.round(fgSize * 0.72);
    const innerBuf = await sharp(LOGO_SRC)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 7, g: 21, b: 43, alpha: 0 } })
      .png()
      .toBuffer();

    const fgBuf = await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 7, g: 21, b: 43, alpha: 0 }
      }
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgBuf);
    console.log(`Generated icons in ${dir}`);
  }

  // 4. Splash screens
  const splashSizes = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 }
  ];

  for (const { dir, w, h } of splashSizes) {
    const targetDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const logoMax = Math.round(Math.min(w, h) * 0.45);
    const logoResized = await sharp(LOGO_SRC)
      .resize(logoMax, logoMax, { fit: 'contain', background: { r: 7, g: 21, b: 43, alpha: 0 } })
      .png()
      .toBuffer();

    const splashBuf = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 7, g: 21, b: 43, alpha: 1 }
      }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuf);
  }
  console.log('Splash screens generated successfully.');

  console.log('All Android assets customized with GKD logo!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
