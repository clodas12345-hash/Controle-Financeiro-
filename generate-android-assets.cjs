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

  // 2. Set background color to pure white #ffffff to match the new GKD Finance Mobility logo
  const valuesDir = path.join(RES_DIR, 'values');
  if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
  const bgXmlPath = path.join(valuesDir, 'ic_launcher_background.xml');
  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#ffffff</color>
</resources>
`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf8');
  console.log('Updated ic_launcher_background.xml with #ffffff');

  // 2b. Set App Name to "Controle Financeiro"
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

  // 2c. Ensure AndroidManifest.xml has all required permissions
  const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const requiredPermissions = [
      'android.permission.INTERNET',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.GET_ACCOUNTS',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_CALL_LOG',
      'android.permission.WRITE_CALL_LOG',
      'android.permission.CALL_PHONE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.BODY_SENSORS',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'android.permission.WAKE_LOCK',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM'
    ];
    let added = false;
    for (const perm of requiredPermissions) {
      if (!manifestContent.includes(perm)) {
        manifestContent = manifestContent.replace(
          '</manifest>',
          `    <uses-permission android:name="${perm}" />\n</manifest>`
        );
        added = true;
      }
    }
    if (added) {
      fs.writeFileSync(manifestPath, manifestContent, 'utf8');
      console.log('Added all requested permissions to AndroidManifest.xml');
    }
  }

  // 3. Launcher mipmaps configurations
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

    // Inner logo scaled with safe margin (78% size)
    const innerSize = Math.round(iconSize * 0.78);
    const innerLogo = await sharp(LOGO_SRC)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    // Standard square icon on white background
    const iconBuf = await sharp({
      create: {
        width: iconSize,
        height: iconSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: innerLogo, gravity: 'center' }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconBuf);

    // Round icon (with circular white crop)
    const circleSvg = Buffer.from(
      `<svg width="${iconSize}" height="${iconSize}"><circle cx="${iconSize / 2}" cy="${iconSize / 2}" r="${iconSize / 2}" fill="#ffffff"/></svg>`
    );
    const roundBuf = await sharp(iconBuf)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundBuf);

    // Foreground icon for adaptive icon (centered with safe zone padding)
    const innerFgSize = Math.round(fgSize * 0.64);
    const innerFgBuf = await sharp(LOGO_SRC)
      .resize(innerFgSize, innerFgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const fgBuf = await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: innerFgBuf, gravity: 'center' }])
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

    const logoMax = Math.round(Math.min(w, h) * 0.50);
    const logoResized = await sharp(LOGO_SRC)
      .resize(logoMax, logoMax, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const splashBuf = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuf);
  }

  // 5. Notification drawables (Pure transparent monochrome silhouette smallIcon)
  const notificationDrawableSizes = [
    { dir: 'drawable', size: 48 },
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 }
  ];

  for (const { dir, size } of notificationDrawableSizes) {
    const targetDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const statSvg = `<svg width="${size}" height="${size}" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <path d="M 48 8 C 25.9 8 8 25.9 8 48 C 8 70.1 25.9 88 48 88 C 62.1 88 74.4 80.5 81.3 69 L 66.8 59.5 C 62.6 66.4 55.7 71 48 71 C 35.3 71 25 60.7 25 48 C 25 35.3 35.3 25 48 25 C 55.7 25 62.6 29.6 66.8 36.5 L 81.3 27 C 74.4 15.5 62.1 8 48 8 Z" fill="#FFFFFF"/>
      <rect x="42" y="16" width="12" height="64" rx="6" fill="#FFFFFF"/>
    </svg>`;
    const finalBuf = await sharp(Buffer.from(statSvg)).resize(size, size).png().toBuffer();

    fs.writeFileSync(path.join(targetDir, 'ic_stat_icon.png'), finalBuf);
    fs.writeFileSync(path.join(targetDir, 'ic_stat_icon_config_sample.png'), finalBuf);
  }

  console.log('All Android assets and notification icons customized with GKD logo!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
