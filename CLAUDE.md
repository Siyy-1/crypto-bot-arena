# CLAUDE.md — 크립토 봇 아레나 개발 컨텍스트

> Claude가 이 프로젝트에서 작업할 때 참고하는 핵심 문서.
> 매 세션 시작 시 이 파일을 먼저 읽고 작업할 것.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 크립토 봇 아레나 (Crypto Bot Arena) |
| **배포 URL** | https://siyy-1.github.io/crypto-bot-arena/ |
| **현재 버전** | Phase 1.5 (핫픽스 완료) → Phase 2 준비 진행 중 |
| **PRD 버전** | v4.0 (Lion PM, 2026-03-15) |
| **스택** | Vanilla HTML/CSS/JS 단일 파일, Upbit WebSocket + REST API, GitHub Pages |
| **개발자** | 시윤 (1인 솔로 개발) |

**핵심 컨셉:** 코딩 없이 수인 캐릭터 봇을 만들어 업비트 실시간 시세로 모의투자 경쟁하는 캐주얼 소셜 트레이딩 게임. 금융 용어 대신 게임 언어를 쓰는 것이 핵심 UX 원칙.

---

## 2. 기술 스택 & 아키텍처

### 현재 (Phase 1.5)
- **단일 파일**: `index.html` (~4100줄) — CSS + HTML + JS 모두 포함
- **실시간 시세**: Upbit WebSocket (`wss://api.upbit.com/websocket/v1`)
- **캔들 차트**: Upbit REST API (`https://api.upbit.com/v1/candles/...`) — HTTPS 환경에서만 동작
- **데이터 저장**: `localStorage` (봇 설정, 진행 상태, 재화)
- **배포**: GitHub Pages (`gh-pages` 브랜치)

### Phase 2 목표 스택
```
Frontend : Vanilla HTML/JS → Vite + 모듈 분리
Backend  : Node.js + Express
DB       : PostgreSQL + Prisma ORM
Auth     : Kakao OAuth
Realtime : Upbit WebSocket 프록시 서버
Hosting  : Frontend → Vercel/GitHub Pages, Backend → Railway/Render
```

---

## 2.5 로컬 개발 & 배포

### 로컬 실행
- `index.html`을 브라우저에서 직접 열면 됨 (빌드 단계 없음)
- WebSocket 실시간 시세는 `file://` 프로토콜에서도 동작
- **캔들 차트(REST API)는 HTTPS 환경에서만 동작** — `file://`에서는 자동 비활성화되고 WebSocket 버퍼로 폴백
- 전체 기능 테스트: GitHub Pages 배포 후 확인하거나 `npx serve .` 등 로컬 HTTPS 서버 사용

### 배포 (자동화 완료)
```bash
git add index.html
git commit -m "feat: 변경 내용"
git push origin main
# → GitHub Actions가 gh-pages에 자동 배포 (약 1분)
```
- 워크플로우: `.github/workflows/deploy.yml` → `main` push → `gh-pages` 자동 배포
- 반영 시간: 30초~2분 / 라이브 URL: https://siyy-1.github.io/crypto-bot-arena/
- Actions 실행 현황: https://github.com/siyy-1/crypto-bot-arena/actions

---

## 3. 디자인 시스템

### 컬러 토큰
```css
--mint:    #3ecf8e   /* 매수(BUY), 수익, 민트 계열 */
--coral:   #ff6b6b   /* 매도(SELL), 손실, 경고 */
--gold:    #ffb830   /* 보상, 골드, 강조 */
--sky:     #60a5fa   /* 정보, 중립 */
--purple:  #a78bfa   /* DATA SHARDS 재화 */
--pink:    #f472b6   /* 시즌2 신규 캐릭터 */
--teal:    #2dd4bf   /* 수달(RIPPLE) 캐릭터 */
--ink:     #2d2a24   /* 기본 텍스트 */
```

### 디자인 원칙
- **뉴모피즘 "토이박스" 미학**: `--neu-out`, `--neu-in`, `--neu-sm` 그림자 변수 활용
- **모바일 퍼스트**: `max-width: 480px`, `min-height: 44px` 탭 타겟
- **금융 용어 → 게임 용어**: RSI 과매도 → "너무 많이 떨어진 상태", 볼린저밴드 → "가격 범위 지표"

---

## 4. 캐릭터 시스템

| 캐릭터 | 이모지 | 이름 | 스타일 | 시즌 |
|--------|--------|------|--------|------|
| 토끼 | 🐰 | FLASH | 스캘핑 마스터 (초단타) | S1 |
| 염소 | 🐐 | THE GOAT | 장기 투자 거장 | S1 |
| 곰 | 🐻 | GRIZZLY | 관망·방어 전문가 | S1 |
| 여우 | 🦊 | SLY | 추세추종 분석가 | S1 |
| 고양이 | 🐱 | NYAN | 퀀트 분석가 | S2 |
| 수달 | 🦦 | RIPPLE | 차익거래 전문 | S2 |

**캐릭터 어피니티 시스템**: 각 캐릭터마다 전용(exclusive) / 강화(boost) / 사용 불가(locked) 블록이 다름.

---

## 5. 재화 시스템

| 재화 | 아이콘 | 유형 | 획득 | 사용처 |
|------|--------|------|------|--------|
| BOTCOIN | 🪙 | 소프트 (자유 획득) | 일일 미션, 체결 보상, 첫 접속 | 봇 업그레이드, 아레나 입장 |
| DATA SHARDS | 💎 | 하드 (희귀) | 주간 랭킹 보상, 시즌 완주 | 고급 블록 해금, 희귀 스킨 |

---

## 6. 주요 전역 변수 & 함수 (JS)

### 핵심 전역
```js
selC          // 현재 선택된 캐릭터 키 ('rabbit'|'goat'|'bear'|'fox'|'cat'|'otter')
fStep         // 팩토리 현재 단계 (1|2|3)
curPage       // 현재 활성 페이지 ('arena'|'factory'|'map')
_candleCache  // tf별 캔들 데이터 캐시 { '240': {data, ts, yMin, yMax} }
_wsBuffer     // WebSocket 실시간 BTC 가격 누적 배열 (최대 120개)
_store        // localStorage 안전 헬퍼 (SecurityError 방어) — 실패 시 _store._mem 인메모리 폴백 (세션 범위)
_currency     // BOTCOIN/SHARDS 재화 상태
```

### 핵심 함수
```js
goPage(pg)              // 페이지 전환 ('arena'|'factory'|'map')
toast(msg)              // 토스트 알림
_gToast(msg, type)      // IIFE 외부에서 호출 가능한 토스트 (전역)
buildPalette()          // 블록 팔레트 렌더링 (캐릭터 어피니티 적용)
addBlk(zone, dk)        // 블록 추가 ('buy'|'sell', blockDefKey)
drawChart()             // 캔들 차트 렌더링 (REST API 호출)
renderChartFromData()   // 캔들 데이터로 차트 그리기
openShareCard()         // 결과 공유 카드 열기
startRemyTut()          // REMY 튜토리얼 시작
startTut()              // 슬라이드 튜토리얼 시작
_store.safeInt(k, fb)   // localStorage에서 NaN 안전 정수 읽기
getWeekKey()            // ISO 8601 주차 키 반환 (예: '2026w11')
```

---

## 7. 파일 구조

```
crypto-bot-arena/
├── index.html          ← 메인 앱 (단일 파일, ~4100줄)
├── characters.html     ← 캐릭터 시트 (디자인 바이블)
├── gameover.html       ← 파산 화면 데모
├── hub.html            ← 데모 허브
├── 404.html            ← GitHub Pages 리다이렉트
├── _config.yml         ← GitHub Pages 설정
├── deploy.sh           ← 배포 스크립트
└── README.md
```

---

## 8. 작업 원칙 & 패턴

### 코드 작성 원칙

**1. IIFE 스코프 규칙**
- WebSocket, 파산 시스템 등 기능별 IIFE로 격리
- IIFE 외부에서 호출해야 하는 함수는 반드시 `window.xxx`로 노출하거나 `_gToast()` 패턴 사용
- IIFE 안에서 `var _ab = window.addBlk` 방식으로 래핑할 때, 래핑 시점의 `window.addBlk`를 캡처함 — 순서 주의

**2. localStorage 안전 접근**
```js
// ❌ 절대 금지
parseInt(localStorage.getItem('key') || '0')

// ✅ 올바른 방법
_store.safeInt('key', 0)  // NaN/null/corrupted 모두 fallback 처리
```

**3. div 중첩 카운팅**
- HTML 수정 시 `<div>` 열기/닫기 수 반드시 일치 확인
- 잘못된 `</div>` 위치는 레이아웃 탈출 버그 유발
- 검증: `html.count('<div') == html.count('</div>')`

**4. 배포 전 검증 순서**
```bash
# 1. JS 문법 체크 (index.html의 <script> 블록 내용을 temp.js로 복사 후 실행)
node --check temp.js

# 2. div 밸런스 체크
python3 -c "html=open('index.html').read(); print(html.count('<div') - html.count('</div>'))"

# 3. 브라우저 하드 리로드
Ctrl+Shift+R

# 4. Chrome MCP QA 스크립트 실행
```

**5. 차트 렌더링 규칙**
- WebSocket tick 마다 직접 렌더 금지 → rAF + 250ms 게이팅 필수
- `_candleCache`는 tf별로 독립 관리 — wsBuffer와 혼용 금지
- 슬라이딩 윈도우: tf별 최대 캔들 수 `_CANDLE_MAX` 초과 시 오래된 것 제거

---

## 9. 알려진 버그 패턴 & 해결책

### ① REMY 튜토리얼 `!tut_done` 조건 버그
**증상**: 슬라이드 튜토리얼 완료 후 REMY에서 캐릭터 선택(S[4])·블록 추가(S[5]) 후 "다음 →" 버튼 미출현  
**원인**: `skipTut()`이 `tut_done='1'` 저장 → REMY watcher의 `!tut_done` 조건이 false  
**해결**: `startRemyPoll()` — 300ms polling으로 hint 텍스트 기반 자동 unlock
```js
// hint에 '카드 탭해서' → charGrid .sel 존재 시 다음 버튼 활성화
// hint에 '블록 탭' → #buyBlks .pl-block 존재 시 다음 버튼 활성화
```

### ② HTML 문자열 내 JS 구문 충돌
**증상**: innerHTML에 `</script>` 포함 시 파싱 오류  
**해결**: `<\/script>` 이스케이프 또는 별도 변수로 분리

### ③ `showToastLocal` 스코프 문제
**증상**: IIFE 외부에서 toast 함수 호출 불가  
**해결**: `_gToast()` 함수를 IIFE 외부에 전역으로 선언 (확립된 패턴)

### ④ 조기 `</div>` 클로저
**증상**: 리더보드나 섹션이 페이지 컨테이너를 벗어나 이상한 위치에 렌더  
**진단**: `el.parentElement`로 실제 부모 탐색, div 카운트 검증

### ⑤ canvas Retina 흐림
**증상**: HiDPI 디스플레이에서 공유 카드가 흐리게 렌더  
**해결**: `devicePixelRatio` 스케일링 적용, `ctx.scale(dpr, dpr)`

---

## 10. Phase 1.5 핫픽스 완료 목록

| # | 항목 | 내용 | 상태 |
|---|------|------|------|
| B1 | Canvas Retina fix | `devicePixelRatio` 스케일링 | ✅ |
| B2 | overscroll-behavior: contain | `.pal-scroll` x축, 모달/시트 y축 | ✅ |
| B5 | localStorage NaN fallback | `_store.safeInt(k, fallback)` 헬퍼 | ✅ |
| U1 | Tutorial tap-on-dim | `#tut` 배경 탭 → `nextTut()` 호출 | ✅ |
| U2 | Locked blocks 하단 이동 | 캐릭터 사용 불가 블록 팔레트 맨 아래 + lore 툴팁 | ✅ |
| U3 | Currency bar sticky | `position: sticky; top: 39px; z-index: 199` | ✅ |
| U7 | Touch target 44px | `.del` 36px, `.ib` 44px, `.tf` 40px, `.lb-tab` 44px | ✅ |
| 🆕 | REMY 5번·6번 버그 | `startRemyPoll()` polling 픽스 | ✅ |

---

## 11. Phase 2 준비 완료 항목

| # | 항목 | 내용 | 상태 |
|---|------|------|------|
| B3 | ISO week date fix | `getWeekKey()` ISO 8601 표준 (Dec-Jan 경계 버그 수정) | ✅ |
| B4 | WebSocket exponential backoff | 1s→2s→4s→8s→15s→30s + offline 배너 | ✅ |
| B6 | Chart data cap | tf별 슬라이딩 윈도우 (4H: 150개, 1D: 120개 등) | ✅ |
| P1 | Chart render throttle | rAF + 250ms 최소 간격 게이팅 | ✅ |

---

## 12. Phase 2 남은 작업 (PRD v4 기준)

### Sprint 1-2: Foundation
| # | 작업 | 상태 |
|---|------|------|
| 2.1 | Code modularization (Vite + 모듈 분리) | ⬜ 미착수 |
| 2.6 | Backend skeleton (Express + PostgreSQL + Prisma) | ⬜ 미착수 |

### Sprint 3-4: Virtual Trading Engine
| # | 작업 | 상태 |
|---|------|------|
| 2.7 | Virtual execution engine (서버사이드 봇 로직) | ⬜ 미착수 |
| 2.8 | Trade reason logging (U5) | ⬜ 미착수 |
| 2.9 | Portfolio tracking (PostgreSQL) | ⬜ 미착수 |
| 2.10 | Kakao OAuth | ⬜ 미착수 |

### Sprint 5-6: Game Loop + Multiplayer
| # | 작업 | 상태 |
|---|------|------|
| 2.11 | Real leaderboard (서버 집계) | ⬜ 미착수 |
| 2.12 | BOTCOIN/SHARDS 실제 경제 | ⬜ 미착수 |
| 2.13 | Game loop: Action-Result-Reward | ⬜ 미착수 (최우선 P0) |
| 2.14 | Enhanced chart (U6) | ⬜ 미착수 |
| 2.15 | Onboarding flow (U4) | ⬜ 미착수 |

### Sprint 7-8: Monetization + Polish
| # | 작업 | 상태 |
|---|------|------|
| 2.16 | In-app purchase (Toss Payments) | ⬜ 미착수 |
| 2.17 | Ad integration (AdMob/Unity Ads) | ⬜ 미착수 |
| 2.18 | DOM optimization (P2) | ⬜ 미착수 |
| 2.19 | Share card v2 (서버 렌더 OG) | ⬜ 미착수 |
| 2.20 | QA + soft launch | ⬜ 미착수 |

---

## 13. Phase 2 성공 지표

| 지표 | 목표 | 스트레치 |
|------|------|----------|
| MAU | 100명 | 300명 |
| D1 Retention | 40% | 55% |
| D7 Retention | 20% | 30% |
| 평균 세션 길이 | 8분 | 15분 |
| 봇 생성 완료율 | 80% | 90% |
| ARPPU | 500원 | 1500원 |
| 결제 전환율 | 3% | 8% |
| NPS | 40+ | 60+ |

---

## 14. 작업 시 주의사항

### QA 워크플로우
```
1. 수정 후 항상 Ctrl+Shift+R (하드 리로드)
2. Chrome MCP javascript_exec로 DOM/함수/스타일 검증
3. div 카운트 python 스크립트로 확인
4. 모바일 환경 시뮬레이션 (480px 뷰포트)
```

### 파일 배포 방법
```bash
# GitHub Pages 배포 — gh-pages 브랜치에 index.html 푸시
git add index.html
git commit -m "feat: [변경 내용]"
git push origin gh-pages
# 약 30초~2분 후 라이브 반영
```

### Chrome MCP 활용 패턴
```js
// 패치 라이브 검증 시
javascript_exec → 패치 코드 주입 → screenshot → 검증 스크립트

// DOM 부모 탐색 (레이아웃 버그 진단)
el.parentElement로 실제 컨테이너 확인

// 함수 래핑 체인 확인
window.addBlk.toString() → 래핑 순서 파악
```

---

## 15. 리스크 레지스터

| 리스크 | 심각도 | 완화 전략 |
|--------|--------|----------|
| 솔로 개발 번아웃 | ❗ High | 2주 스프린트, 스코프 ruthlessly cut, MVP 먼저 |
| Upbit API rate limit | ⚠️ Med | 서버사이드 WebSocket 프록시, 로컬 캔들 캐시 |
| 유저 유입 정체 | ⚠️ Med | 커뮤니티 시딩, 추천 보너스(BOTCOIN), 공유 카드 바이럴 |
| 경제 인플레이션 | Low | Phase 2 mock 경제 검증 후 실제 연동, sink/faucet 튜닝 |
| 규제 리스크 | Low | 100% 가상/모의 거래, 실제 자금 없음, 명확한 면책 고지 |

---

*최종 업데이트: 2026-03-15 | 작업자: 시윤 + Claude*
