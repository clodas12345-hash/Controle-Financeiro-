import fs from 'fs';
import path from 'path';

function findLogoSource() {
  const candidates = [
    path.resolve('public', 'logo.png'),
    path.resolve('public', 'converted_image (1).png'),
    path.resolve('public', 'logo.jpg'),
    path.resolve('public', 'icon.png'),
    path.resolve('public', 'app_icon.png'),
    path.resolve('public', 'icon2.png')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve('public', 'logo.png');
}

async function generateIcons() {
  const iconSrc = findLogoSource();
  const resDir = path.resolve('android', 'app', 'src', 'main', 'res');

  console.log('🎨 Generating Android icons using source:', iconSrc);

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

  // 1. Launcher Mipmaps
  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      await sharp(iconSrc)
        .resize(item.fgSize, item.fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
    }
  }

  // 2. Notification Drawables (Silhouette smallIcon + Full Color largeIcon)
  const statIconSizes = [
    { dir: 'drawable', size: 48, largeSize: 192 },
    { dir: 'drawable-mdpi', size: 24, largeSize: 48 },
    { dir: 'drawable-hdpi', size: 36, largeSize: 72 },
    { dir: 'drawable-xhdpi', size: 48, largeSize: 96 },
    { dir: 'drawable-xxhdpi', size: 72, largeSize: 144 },
    { dir: 'drawable-xxxhdpi', size: 96, largeSize: 192 }
  ];

  for (const item of statIconSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      // Full color large icon for notification body
      await sharp(iconSrc)
        .resize(item.largeSize, item.largeSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_large_icon.png'));

      await sharp(iconSrc)
        .resize(item.largeSize, item.largeSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      // Pure white monochrome silhouette for status bar / smallIcon
      const resized = await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha()
        .toBuffer();

      const { data, info } = await sharp(resized)
        .raw()
        .toBuffer({ resolveWithObject: true });

      let hasTransparent = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 200) {
          hasTransparent = true;
          break;
        }
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (hasTransparent) {
          if (a > 25) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
          }
        } else {
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance > 60) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
          }
        }
      }

      await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_stat_icon.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_large_icon.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
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

  console.log('✅ Android icons, status smallIcon, and largeIcon generated successfully!');
}

generateIcons().catch(console.error);
