/**
 * gen-feature-graphic.js — Play Store Feature Graphic PNG 생성
 *
 * 실행: node scripts/gen-feature-graphic.js
 * 요구사항: npm install sharp (이미 설치됨)
 *
 * 생성 파일:
 *   screenshots/feature-graphic.png  (1024×500, Play Store 필수)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const SVG_PATH = path.join(__dirname, '..', 'feature-graphic.svg');
const OUT_PATH = path.join(SCREENSHOTS_DIR, 'feature-graphic.png');

sharp(fs.readFileSync(SVG_PATH))
  .resize(1024, 500)
  .png()
  .toFile(OUT_PATH)
  .then(() => {
    const size = (fs.statSync(OUT_PATH).size / 1024).toFixed(0);
    console.log(`✅ feature-graphic.png 생성 완료 (1024×500, ${size}KB)`);
    console.log(`📁 경로: ${OUT_PATH}`);
    console.log('\n💡 Play Store 업로드: Console → 스토어 등록정보 → 그래픽 → Feature Graphic');
  })
  .catch(err => {
    console.error('❌ 오류:', err.message);
    process.exit(1);
  });
