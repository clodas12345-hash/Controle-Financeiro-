import fs from 'fs';
import path from 'path';

function findLogoSource() {
  const candidates = [
    path.resolve('public', 'logo.png'),
    path.resolve('public', 'converted_image (1).png'),
    path.resolve('public', 'logo.jpg'),
    path.resolve('public', 'icon.png'),
    path.resolve('public', 'app_icon.png')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve('public', 'logo.png');
}

async function generateIcons() {
  const iconSrc = findLogoSource();
  const resDir = path.resolve('android', 'app', 'src', 'main', 'res');

  console.log('🎨 Generating Android icons with safe padding from source:', iconSrc);

  if (!fs.existsSync(iconSrc)) {
    console.error('Source icon not found:', iconSrc);
    return;
  }

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping icon generation until android platform is added.');
    return;
  }

  const sizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use fallback copying.');
  }

  // 1. Launcher Mipmaps with safe zone padding (anti-zoom / anti-crop)
  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      const innerSize = Math.round(item.size * 0.78);
      const innerLogo = await sharp(iconSrc)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();

      // Standard square icon on white background
      await sharp({
        create: {
          width: item.size,
          height: item.size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{ input: innerLogo, gravity: 'center' }])
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      // Round icon with circular white background
      const circleSvg = Buffer.from(
        `<svg width="${item.size}" height="${item.size}"><circle cx="${item.size / 2}" cy="${item.size / 2}" r="${item.size / 2}" fill="#ffffff"/></svg>`
      );
      await sharp({
        create: {
          width: item.size,
          height: item.size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{ input: innerLogo, gravity: 'center' }])
        .composite([{ input: circleSvg, blend: 'dest-in' }])
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      // Adaptive icon foreground
      const innerFgSize = Math.round(item.fgSize * 0.64);
      const innerFgLogo = await sharp(iconSrc)
        .resize(innerFgSize, innerFgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: item.fgSize,
          height: item.fgSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite([{ input: innerFgLogo, gravity: 'center' }])
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
    }
  }

  // 2. Pure Transparent Monochrome Notification Icon (Anti-White-Square)
  const statIconSizes = [
    { dir: 'drawable', size: 48 },
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 }
  ];

  for (const item of statIconSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      const statSvg = `<svg width="${item.size}" height="${item.size}" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
        <circle cx="48" cy="48" r="38" fill="none" stroke="#FFFFFF" stroke-width="10"/>
        <path d="M 64 36 A 20 20 0 1 0 64 60 L 64 48" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
        <rect x="42" y="18" width="12" height="60" rx="6" fill="#FFFFFF"/>
      </svg>`;
      const finalBuf = await sharp(Buffer.from(statSvg)).resize(item.size, item.size).png().toBuffer();

      fs.writeFileSync(path.join(targetFolder, 'ic_stat_icon.png'), finalBuf);
      fs.writeFileSync(path.join(targetFolder, 'ic_stat_icon_config_sample.png'), finalBuf);
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon_config_sample.png'));
    }
  }

  // 3. Splash Screens
  const drawableDirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'];
  for (const d of drawableDirs) {
    const dPath = path.join(resDir, d);
    if (fs.existsSync(dPath)) {
      fs.copyFileSync(iconSrc, path.join(dPath, 'splash.png'));
    }
  }

  console.log('✅ Android icons and clean transparent notification icon generated successfully!');
}

generateIcons().catch(console.error);
