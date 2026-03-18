#!/usr/bin/env node
/**
 * 크립토 봇 아레나 — 배포 전 QA 체크 스크립트
 * 실행: node qa.js
 */

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let errors = 0, warnings = 0;

function ok(msg)   { console.log('  ✅', msg); }
function warn(msg) { console.log('  ⚠️ ', msg); warnings++; }
function fail(msg) { console.log('  ❌', msg); errors++; }
function section(t){ console.log('\n[' + t + ']'); }

// 독립 함수 호출만 추출 (메서드 호출 제외: .foo() 형태 제거)
const JS_KEYWORDS = new Set([
  'if','else','for','while','do','switch','return','typeof','instanceof','new',
  'delete','void','throw','try','catch','finally','in','of','let','const','var',
  'function','class','extends','super','this','async','await','yield',
  'break','continue','case','debugger','import','export','default','with',
  // 내장 전역
  'parseInt','parseFloat','isNaN','isFinite','encodeURI','decodeURI',
  'encodeURIComponent','decodeURIComponent','eval','setTimeout','clearTimeout',
  'setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame',
  'fetch','alert','confirm','prompt','atob','btoa',
]);

function extractCallNames(code) {
  const names = new Set();
  // 앞에 . 이 없는 단독 함수 호출만: word( — 단, 앞이 . 또는 영숫자_가 아닐 때
  for (const m of code.matchAll(/(?<![.\w])([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g)) {
    const name = m[1];
    if (!JS_KEYWORDS.has(name)) names.add(name);
  }
  return names;
}

// ──────────────────────────────────────────────
// 1. div 균형
// ──────────────────────────────────────────────
section('1. HTML div 균형');
const opens  = (html.match(/<div/g)  || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
if (opens === closes) ok(`<div> ${opens}개 균형`);
else fail(`<div> ${opens}개 vs </div> ${closes}개 — 차이: ${opens - closes}`);

// ──────────────────────────────────────────────
// 2. JS 문법 체크 (각 script 블록)
// ──────────────────────────────────────────────
section('2. JS 문법');
const scriptBlocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
console.log(`  script 블록 ${scriptBlocks.length}개 발견`);
scriptBlocks.forEach((m, i) => {
  try {
    new Function(m[1]);
    ok(`Script[${i}] 문법 OK (${m[1].length.toLocaleString()}자)`);
  } catch (e) {
    fail(`Script[${i}] 문법 오류: ${e.message}`);
  }
});

// ──────────────────────────────────────────────
// 3. 스코프 분석 — 전역 함수/상수 목록 수집
// ──────────────────────────────────────────────
section('3. 함수 스코프 분석');

const globalNames = new Set();

// Script[0]: IIFE 없으므로 최상위 function 선언은 모두 전역 (호이스팅)
if (scriptBlocks[0]) {
  const js0 = scriptBlocks[0][1];
  for (const m of js0.matchAll(/(?:^|[\n;])\s*(?:async\s+)?function\s+(\w+)/g)) {
    globalNames.add(m[1]);
  }
  // const/let/var 최상위 선언 (들여쓰기 없는 것만)
  for (const m of js0.matchAll(/^(?:var|let|const)\s+(\w+)/gm)) {
    globalNames.add(m[1]);
  }
  // window.xxx = ... 패턴 (IIFE 내부에서 전역 노출)
  for (const m of js0.matchAll(/window\.(\w+)\s*=/g)) {
    globalNames.add(m[1]);
  }
}

// Script[1]: IIFE 구조 분석
if (scriptBlocks[1]) {
  const js1 = scriptBlocks[1][1];
  const iifeEnd = js1.indexOf('})()');

  if (iifeEnd >= 0) {
    // IIFE 안
    const inside = js1.slice(0, iifeEnd);
    const iifeFns = [...inside.matchAll(/(?:^|[\n;])\s*(?:async\s+)?function\s+(\w+)/g)].map(m => m[1]);
    ok(`IIFE 내부 함수 ${iifeFns.length}개 (비공개): ${iifeFns.slice(0, 6).join(', ')}${iifeFns.length > 6 ? ' ...' : ''}`);

    // IIFE 밖 (전역)
    const outside = js1.slice(iifeEnd + 4);
    for (const m of outside.matchAll(/(?:^|[\n;])\s*(?:async\s+)?function\s+(\w+)/g)) {
      globalNames.add(m[1]);
    }
    for (const m of outside.matchAll(/^(?:var|let|const)\s+(\w+)/gm)) {
      globalNames.add(m[1]);
    }
  } else {
    // IIFE 없으면 전체 전역
    for (const m of js1.matchAll(/(?:async\s+)?function\s+(\w+)/g)) {
      globalNames.add(m[1]);
    }
  }
}

ok(`전역 함수/상수 ${globalNames.size}개 감지`);

// ──────────────────────────────────────────────
// 4. onclick 호출 함수 → 전역 여부 확인
// ──────────────────────────────────────────────
section('4. onclick 함수 전역 접근');
const onclickFns = new Set();
for (const m of html.matchAll(/onclick="([^"]+)"/g)) {
  for (const fn of extractCallNames(m[1])) {
    onclickFns.add(fn);
  }
}

const onclickFail = [...onclickFns].filter(fn => !globalNames.has(fn));
if (onclickFail.length === 0) ok(`onclick 함수 ${onclickFns.size}개 전역 접근 OK`);
else fail(`onclick에서 호출하지만 전역 미등록: ${onclickFail.join(', ')}`);

// ──────────────────────────────────────────────
// 5. window.load 핸들러 직접 호출 함수 확인
// ──────────────────────────────────────────────
section('5. window.load 직접 호출 함수');
// "buildTicker();buildLB(LB);..." 같은 패턴만 체크 (중첩 콜백 제외)
const loadMatch = html.match(/buildTicker\(\);([^\n]+)/);
if (loadMatch) {
  const loadLine = 'buildTicker();' + loadMatch[1];
  const loadFns = extractCallNames(loadLine);
  const loadFail = [...loadFns].filter(fn => !globalNames.has(fn));
  if (loadFail.length === 0) ok(`load 핸들러 직접 호출 ${loadFns.size}개 전역 OK`);
  else fail(`load 핸들러에서 호출하지만 전역 미등록: ${loadFail.join(', ')}`);
} else {
  warn('load 핸들러 패턴을 찾지 못했음');
}

// ──────────────────────────────────────────────
// 6. 필수 전역 함수/상수 존재 확인
// ──────────────────────────────────────────────
section('6. 필수 전역 심볼 존재');
const required = [
  // API & 인증
  '_API', 'fetchLeaderboard', '_jwtPayload', '_CHAR_EM',
  'loginKakao', 'loginGoogle', 'skipLogin',
  'openSettings', 'closeSettings', 'saveNickname', 'logoutUser',
  // 포트폴리오
  '_syncPortfolio', '_recordTrade', '_savePortfolio', '_loadServerPortfolio',
  // UI 빌더
  'buildCharGrid', 'buildLB', 'buildTicker', 'buildPalette',
  // 게임 로직
  'selChar', 'goPage', 'toast', '_execTrade',
  // 차트
  'drawChart', 'renderChartFromData',
];
const missing = required.filter(fn => !globalNames.has(fn));
if (missing.length === 0) ok(`필수 심볼 ${required.length}개 모두 전역 확인`);
else fail(`전역 미등록 필수 심볼: ${missing.join(', ')}`);

// ──────────────────────────────────────────────
// 결과
// ──────────────────────────────────────────────
console.log('\n' + '─'.repeat(44));
if (errors === 0 && warnings === 0) {
  console.log('✅ 모든 QA 통과 — 배포 가능');
} else {
  if (errors > 0)   console.log(`❌ 오류 ${errors}개 — 배포 전 수정 필요`);
  if (warnings > 0) console.log(`⚠️  경고 ${warnings}개 — 확인 권장`);
}
console.log('─'.repeat(44));
process.exit(errors > 0 ? 1 : 0);
