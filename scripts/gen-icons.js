/**
 * gen-icons.js — 앱 아이콘 PNG 일괄 생성 스크립트
 *
 * 실행: node scripts/gen-icons.js
 * 요구사항: npm install sharp
 *
 * 생성 파일:
 *   icons/icon-192.png         (PWA 기본)
 *   icons/icon-512.png         (PWA 스플래시)
 *   icons/icon-maskable-192.png (Android Adaptive Icon)
 *   icons/icon-maskable-512.png (Play Store Adaptive)
 *   icons/icon-1024.png        (Play Store Hi-res)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

const SVG_PATH = path.join(__dirname, '..', 'icon.svg');
const svgBuffer = fs.readFileSync(SVG_PATH);

// maskable 버전: 아이콘을 76%로 축소 후 배경 채움 (safe zone = 중앙 80% 반경)
async function toMaskable(size) {
  const innerSize = Math.round(size * 0.76);
  const padding = Math.round((size - innerSize) / 2);

  const inner = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 26, g: 22, b: 18, alpha: 1 }, // #1a1612 (앱 배경)
    },
  })
    .composite([{ input: inner, top: padding, left: padding }])
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [
    { name: 'icon-192.png',         size: 192, maskable: false },
    { name: 'icon-512.png',         size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true  },
    { name: 'icon-maskable-512.png', size: 512, maskable: true  },
    { name: 'icon-1024.png',        size: 1024, maskable: false },
  ];

  for (const { name, size, maskable } of sizes) {
    const outPath = path.join(ICONS_DIR, name);
    if (maskable) {
      const buf = await toMaskable(size);
      fs.writeFileSync(outPath, buf);
    } else {
      await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
    }
    console.log(`✅ ${name} (${size}×${size})`);
  }

  console.log('\n🎉 아이콘 생성 완료! icons/ 디렉토리를 확인하세요.');
  console.log('💡 maskable 미리보기: https://maskable.app');
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  console.error('\n힌트: npm install sharp 을 실행하셨나요?');
  process.exit(1);
});
