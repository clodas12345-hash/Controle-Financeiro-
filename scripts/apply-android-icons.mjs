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
      const innerSize = Math.round(item.size * 0.86);
      const { data, info } = await sharp(iconSrc)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const out = Buffer.alloc(data.length);
      const w = info.width;
      const h = info.height;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          const isWhiteBg = (r > 230 && g > 230 && b > 230) || a < 30;
          const isMedallionZone = y < h * 0.70;
          const isDarkCore = isMedallionZone && lum < 75 && r < 90;

          if (isWhiteBg || isDarkCore) {
            out[i] = 0;
            out[i + 1] = 0;
            out[i + 2] = 0;
            out[i + 3] = 0;
          } else {
            out[i] = 255;
            out[i + 1] = 255;
            out[i + 2] = 255;
            out[i + 3] = 255;
          }
        }
      }

      const statBuffer = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: item.size,
          height: item.size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{ input: statBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_icon.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
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
