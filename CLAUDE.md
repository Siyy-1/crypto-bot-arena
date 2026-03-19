# CLAUDE.md — 크립토 봇 아레나 개발 컨텍스트

> Claude가 이 프로젝트에서 작업할 때 참고하는 핵심 문서.
> 매 세션 시작 시 이 파일을 먼저 읽고 작업할 것.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 크립토 봇 아레나 (Crypto Bot Arena) |
| **배포 URL** | https://siyy-1.github.io/crypto-bot-arena/ |
| **현재 버전** | Phase 2 진행 중 (Sprint A·B·C·D-D0 완료, 2026-03-19) |
| **PRD 버전** | v5.0 (Lion PM, 2026-03-18) |
| **스택** | Vanilla HTML/CSS/JS 단일 파일 + Node.js/Express 백엔드, Upbit WebSocket + REST API, GitHub Pages + Railway |
| **개발자** | Seeyou (1인 솔로 개발) |

**핵심 컨셉:** 코딩 없이 수인 캐릭터 봇을 만들어 업비트 실시간 시세로 모의투자 경쟁하는 캐주얼 소셜 트레이딩 게임. 금융 용어 대신 게임 언어를 쓰는 것이 핵심 UX 원칙.

---

## 2. 기술 스택 & 아키텍처

### 현재 (Phase 2 진행 중)
- **프론트엔드**: `index.html` (~4950줄) — CSS + HTML + JS 단일 파일
- **백엔드**: Node.js + Express, Railway 배포 (`https://bot-arena-server-production.up.railway.app`)
- **DB**: PostgreSQL (Railway) + Prisma 6.x ORM
- **Auth**: Kakao OAuth ✅ / Google OAuth ✅ / Apple OAuth ⬜ (Apple Developer 계정 필요)
- **JWT**: `jsonwebtoken`, 30일 만료, `localStorage('jwt')` 저장
- **실시간 시세**: Upbit WebSocket (`wss://api.upbit.com/websocket/v1`)
- **캔들 차트**: Railway 프록시 → Upbit REST API (`/api/candles?tf=...&count=...`)
- **데이터 저장**: `localStorage` (봇 설정, 진행 상태, 재화) + PostgreSQL (유저/포트폴리오)
- **배포**: GitHub Pages (`gh-pages` 브랜치) + Railway (백엔드 자동 배포)

### Phase 2 목표 스택 (달성 현황)
```
Frontend : Vanilla HTML/JS (단일 파일 유지 중)       ← Vite 모듈화는 추후
Backend  : Node.js + Express ✅ (Railway 배포 완료)
DB       : PostgreSQL + Prisma 6.x ORM ✅
Auth     : Kakao OAuth ✅ / Google OAuth ✅ / Apple ⬜
Candles  : Railway 프록시 ✅ (Upbit CORS 우회)
Hosting  : Frontend → GitHub Pages ✅ / Backend → Railway ✅
```

---

## 2.5 로컬 개발 & 배포

### 로컬 실행
- `index.html`을 브라우저에서 직접 열면 됨 (빌드 단계 없음)
- WebSocket 실시간 시세는 `file://` 프로토콜에서도 동작
- **캔들 차트**: Railway 프록시 경유 → HTTPS 필요 없음 (`_API` 상수로 고정)
- 전체 기능 테스트: GitHub Pages 배포 후 확인하거나 `npx serve .` 등 로컬 HTTPS 서버 사용

### 프론트엔드 배포 (자동화 완료)
```bash
git add index.html
git commit -m "feat: 변경 내용"
git push origin main
# → GitHub Actions가 gh-pages에 자동 배포 (약 1분)
```
- 워크플로우: `.github/workflows/deploy.yml` → `main` push → `gh-pages` 자동 배포
- 반영 시간: 30초~2분 / 라이브 URL: https://siyy-1.github.io/crypto-bot-arena/
- Actions 실행 현황: https://github.com/siyy-1/crypto-bot-arena/actions

### 백엔드 배포 (Railway 자동 배포)
```bash
cd c:\workspace\bot_arena_server
railway up
# → Railway가 자동 빌드 + 배포 (약 1분)
# 서버 URL: https://bot-arena-server-production.up.railway.app
```
- Railway 프로젝트: `gregarious-kindness`
- 서비스: `bot-arena-server` (Node.js) + `Postgres-GcSa` (PostgreSQL)
- 환경변수: Railway 대시보드 → bot-arena-server → Variables

### 백엔드 로컬 개발
```bash
cd c:\workspace\bot_arena_server
npm run dev   # nodemon으로 자동 재시작
# .env 파일에 DATABASE_PUBLIC_URL, JWT_SECRET 등 설정 필요
```
- **중요**: 로컬에서는 `DATABASE_PUBLIC_URL` 사용, Railway 내부는 `DATABASE_URL` 사용
- Prisma 버전: 6.x (7.x는 datasource url 방식 변경으로 다운그레이드)

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
selC           // 현재 선택된 캐릭터 키 ('rabbit'|'goat'|'bear'|'fox'|'cat'|'otter')
fStep          // 팩토리 현재 단계 (1|2|3)
curPage        // 현재 활성 페이지 ('arena'|'factory'|'map')
_candleCache   // tf별 캔들 데이터 캐시 { '240': {data, ts, yMin, yMax} }
_wsBuffer      // WebSocket 실시간 BTC 가격 누적 배열 (최대 120개)
_store         // localStorage 안전 헬퍼 (SecurityError 방어) — 실패 시 _store._mem 인메모리 폴백 (세션 범위)
_currency      // BOTCOIN/SHARDS 재화 상태
_botBlocks     // 현재 봇 블록 상태 { buy: [{id, key, label, params}], sell: [...] }
_portfolio     // 가상 포트폴리오 { cash, btc, avgCost, trades, lastTradeTs, seed, tzLastHour }
_chartFetching // 차트 REST fetch 진행 중 여부 (중복 호출 방지 플래그)
_chartRetry    // 차트 재시도 상태 { n: 횟수, tid: 타이머ID } — 지수 백오프 관리
_tradePending  // 서버 거래 실행 중 여부 (중복 요청 방지)
_pollPortfolioTid // 포트폴리오 폴링 타이머 ID (0 = 미실행)
```

### 핵심 함수
```js
goPage(pg)                    // 페이지 전환 ('arena'|'factory'|'map')
toast(msg)                    // 토스트 알림
_gToast(msg, type)            // IIFE 외부에서 호출 가능한 토스트 (전역)
buildPalette()                // 블록 팔레트 렌더링 (캐릭터 어피니티 적용)
addBlk(zone, dk)              // 블록 추가 ('buy'|'sell', blockDefKey)
drawChart()                   // 캔들 차트 렌더링 (REST API, stale 캐시 우선, 지수 백오프 재시도)
renderChartFromData()         // 캔들 데이터로 차트 그리기
openShareCard()               // 결과 공유 카드 열기
startRemyTut()                // REMY 튜토리얼 시작
startTut()                    // 슬라이드 튜토리얼 시작
_store.safeInt(k, fb)         // localStorage에서 NaN 안전 정수 읽기
getWeekKey()                  // ISO 8601 주차 키 반환 (예: '2026w11')
_evalIndicators()             // RSI-14, 볼린저밴드-20, MACD, 현재 시간 등 지표 계산 → {price, drop, rsi14, bb20, macd, hour}
_evalBlockCondition(blk, ind) // 블록 조건 평가 → true/false (8가지 블록 타입)
_execTrade(side, reason, px)  // 매수/매도 실행 — 로그인 시 POST /api/trade/execute 호출 (서버 검증+원자적 기록)
renderTradeLog()              // 최근 5개 거래 내역 #tradeLog에 렌더링
renderMapStats()              // 실전맵 통계(거래 횟수/승률/오늘 수익/순위) 실시간 업데이트
_esc(s)                       // HTML 특수문자 이스케이프 (XSS 방지) — innerHTML 삽입 전 필수
_loadServerPortfolio()        // 로그인 시 서버 상태 복원 — Promise.allSettled로 3개 요청 병렬화
_startPortfolioPoll()         // 60s 폴링 시작 — 탭 숨김/거래 중 스킵, 로그아웃 시 _stopPortfolioPoll()
_syncPortfolio()              // botcoin만 서버 동기화 (cash/btc/seed는 서버 전용 엔드포인트에서만 변경)
_resetPortfolioServer(seed)   // POST /api/portfolio/reset 호출 (봇출전/파산리바이벌/주간리셋)
```

---

## 7. 파일 구조

```
crypto-bot-arena/             (c:\workspace\bot_arena)
├── index.html          ← 메인 앱 (단일 파일, ~4500줄)
├── characters.html     ← 캐릭터 시트 (디자인 바이블)
├── gameover.html       ← 파산 화면 데모
├── hub.html            ← 데모 허브
├── 404.html            ← GitHub Pages 리다이렉트
├── _config.yml         ← GitHub Pages 설정
├── deploy.sh           ← 배포 스크립트
└── README.md

bot_arena_server/             (c:\workspace\bot_arena_server)
├── src/
│   ├── server.js       ← Express 진입점 (trust proxy, CORS, rate limit, 라우터)
│   ├── db.js           ← Prisma 싱글톤 (global.__prisma — 중복 인스턴스 방지)
│   ├── routes/
│   │   ├── auth.js     ← OAuth 3종 + /me — nickname(2~20자)/charKey 서버 검증
│   │   ├── portfolio.js ← botcoin PATCH / reset POST / state GET / trades GET·DELETE
│   │   ├── trade.js    ← POST /execute — Upbit검증+쿨다운+포트폴리오+기록 원자적 $transaction
│   │   ├── leaderboard.js ← 수익률 순위 (30s 캐시, take:500 쿼리 한도)
│   │   └── candles.js  ← Upbit 캔들 REST API 프록시 (/api/candles?tf=&count=)
│   └── middleware/
│       └── auth.js     ← JWT 검증 미들웨어 (requireAuth)
├── prisma/
│   └── schema.prisma   ← User(kakaoId/googleId/appleId), Portfolio, Trade + @@index
├── package.json
└── .env                ← 로컬 전용 (DATABASE_PUBLIC_URL, JWT_SECRET 등)
```

### 백엔드 API 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/api/auth/kakao` | 카카오 로그인 시작 |
| GET | `/api/auth/kakao/callback` | 카카오 OAuth 콜백 |
| GET | `/api/auth/google` | 구글 로그인 시작 |
| GET | `/api/auth/google/callback` | 구글 OAuth 콜백 |
| GET | `/api/auth/apple` | 애플 로그인 시작 |
| POST | `/api/auth/apple/callback` | 애플 OAuth 콜백 (POST 방식) |
| GET | `/api/auth/me` | 내 정보 조회 (JWT 필수) |
| PATCH | `/api/auth/me` | 닉네임·charKey 수정 (JWT 필수) |
| PATCH | `/api/portfolio` | botcoin만 동기화 (cash/btc/seed는 서버 전용, JWT 필수) |
| POST | `/api/portfolio/reset` | 포트폴리오 리셋 — seed 100k~10M 검증 (JWT 필수) |
| GET | `/api/portfolio/state` | 포트폴리오 상태 조회 — cash/btc/avgCost/seed/botcoin/weeklyReturn (JWT 필수) |
| GET | `/api/portfolio/trades` | 최근 거래 이력 조회 최대 20건 (JWT 필수) |
| DELETE | `/api/portfolio/trades` | 거래 이력 전체 삭제 — 파산 리바이벌 시 (JWT 필수) |
| GET | `/api/leaderboard` | 수익률 순위 조회 (30s 캐시) |
| GET | `/api/candles` | 캔들 데이터 (`?tf=minutes/240&count=150`) |
| POST | `/api/trade/execute` | **거래 실행** — Upbit 가격검증+쿨다운+포트폴리오+기록 원자적 $transaction (JWT 필수) |

### 프론트엔드 주요 상수 (index.html)
```js
const _API = 'https://bot-arena-server-production.up.railway.app';
// localStorage: 'jwt' (JWT 토큰), 'login_skipped' (로그인 건너뜀 여부)
// 함수: loginKakao(), loginGoogle(), skipLogin()
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
# 1. JS 문법 체크
node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/g);let js='';if(m)m.forEach(s=>{js+=s.replace(/<\/?script>/g,'')+'\n';});fs.writeFileSync('C:/Windows/Temp/check.js',js);" && node --check "C:/Windows/Temp/check.js"

# 2. 백엔드 문법 체크
node --check src/routes/trade.js && node --check src/routes/portfolio.js

# 3. 브라우저 하드 리로드
Ctrl+Shift+R

# 4. Chrome MCP QA 스크립트 실행
```

**6. XSS 방지 규칙**
- `innerHTML`에 서버/유저 데이터 삽입 시 반드시 `_esc()` 헬퍼 사용
- `_esc(s)` = `&amp;` `&lt;` `&gt;` `&quot;` 4종 이스케이프
- `textContent` 사용 시 이스케이프 불필요 (자동 처리)

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

### ⑥ time_zone 블록 중복 발동
**증상**: 9시에 설정한 블록이 9시 내내 1분마다 반복 발동
**원인**: `ind.hour === tgt` 조건이 해당 시간 동안 계속 true
**해결**: `_portfolio.tzLastHour` 필드 추가. 발동 시 `tzLastHour = tgt` 저장, 재발동 조건에 `tzLastHour !== tgt` 체크
**초기화**: `_portfolio` IIFE / `closeLaunch()` / `revive()` 3곳 모두 `tzLastHour: -1` 포함

### ⑦ OAuth 관련 오류 패턴

**카카오 KOE006**: Redirect URI 미등록
- **원인**: 카카오 개발자 콘솔 "고급" 탭(로그아웃)에 등록했거나 URI가 누락됨
- **해결**: 카카오 로그인 → **일반** 탭 → Redirect URI에 `{SERVER_URL}/api/auth/kakao/callback` 등록

**카카오 `TokenError: Bad client credentials`**:
- **원인**: `KAKAO_CLIENT_SECRET` 환경변수가 설정되어 있으나 카카오 앱에서 Client Secret 사용 안 함
- **해결**: 카카오 개발자 콘솔 → 보안 탭 → Client Secret 사용 안 함으로 설정 (또는 Railway Variables에서 올바른 값 설정)

**Railway DB 연결 P1001**:
- **원인**: 로컬에서 내부 DB URL(`DATABASE_URL`) 사용
- **해결**: 로컬은 `DATABASE_PUBLIC_URL` 사용 (`sslmode` 파라미터 없이 plain URL)

### ⑧ 차트 깜빡임 (시세 로드 실패 반복)
**증상**: 실전맵 차트가 "시세 로드 실패 — 재시도 중..." ↔ "시세 불러오는 중..." 를 3초마다 반복
**원인**: 실패 시 `setTimeout(drawChart, 3000)` 무한 중첩 + 매 재시도마다 캔버스를 로딩 화면으로 덮어씀
**해결**:
- `_chartFetching` 플래그로 동시 fetch 차단
- `_chartRetry.tid` 단일 타이머로 중첩 방지 (새 호출 시 기존 타이머 취소)
- stale 캐시 있으면 에러 화면 대신 기존 차트 유지 + 백그라운드 재시도
- 지수 백오프: 5s → 10s → 20s → 30s(max), 최대 8회 후 포기

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
| B7 | time_zone 블록 중복 발동 | `tzLastHour` 필드로 시간당 1회만 발동 | ✅ |
| B8 | 차트 깜빡임 안정화 | `_chartFetching` + 지수 백오프 + stale 캐시 우선 표시 | ✅ |
| U8 | 거래 쿨다운 단축 | 5분 → 1분 (세션 8분 목표 대응) | ✅ |
| U9 | 맵 통계 실제 데이터 연동 | 거래 횟수/승률/오늘 수익/순위 `_portfolio` 기반 실시간 반영 | ✅ |

---

## 11.5 세션별 추가 완료 (PRD 외)

### 세션 2 (2026-03-18)
| # | 항목 | 내용 | 상태 |
|---|------|------|------|
| X1 | 닉네임 상단 표시 | currency-bar에 `#userPill` — 캐릭터 이모지 + 닉네임, 탭 → 설정 모달 | ✅ |
| X2 | 거래이력 서버 복원 | `_loadServerPortfolio` → `GET /api/portfolio/trades` 호출 후 `_portfolio.trades` 복원 | ✅ |
| X3 | 온보딩 자동 튜토리얼 | `skipLogin()` / OAuth 첫 로그인 → `tut_done` 없으면 자동 `startTut()` | ✅ |
| X4 | 리더보드 LB 혼용 정리 | `switchLb` 친구 탭 `window.LB\|\|LB` 통합 | ✅ |
| X5 | 파산 서버 거래이력 초기화 | `revive()` 시 `DELETE /api/portfolio/trades` 호출 | ✅ |
| X6 | 주간 시즌 리셋 | 새 주 첫 접속 + 거래이력 있을 때 포트폴리오 리셋 + DATA SHARDS 보상 | ✅ |
| X7 | 공유카드 닉네임 | 결과 공유 카드에 `@닉네임` 표시 | ✅ |
| X8 | auth.js 트랜잭션 | User + Portfolio 신규 생성 `prisma.$transaction()` 원자성 보장 | ✅ |
| X9 | 백엔드 API 엔드포인트 추가 | `GET /api/portfolio/trades`, `DELETE /api/portfolio/trades`, `PATCH /api/auth/me` | ✅ |
| X10 | QA 스크립트 | `qa.js` — div 균형·JS 문법·스코프·onclick·필수심볼 자동 검증 | ✅ |

### 세션 4 (2026-03-19) — Sprint B·C·D-D0 (바이럴/리텐션 + OG)
| # | 항목 | 내용 | 상태 |
|---|------|------|------|
| B1 | 티어 배지 | Iron/Bronze/Silver/Gold/Diamond — weeklyReturn 기반 | ✅ |
| B2 | 경제 싱크 | 봇 이름 변경 50BC 차감 | ✅ |
| B3 | 첫 일일 거래 보상 | 첫 체결 업적(+200BC) 연계 | ✅ |
| B4 | 업적 5종 | first_trade/trade_10/profit_10/diamond_rank/season_clear | ✅ |
| C-V1 | 레퍼럴 시스템 | ?ref= 파싱 + POST /api/referral/claim + 양쪽 +500BC | ✅ |
| C-V2 | 공유 카드 퍼센타일 | 상위 X% 배지 + shareAction 텍스트 | ✅ |
| C-V3 | 로그인 스트릭 | 3/7/14/30일 마일스톤 보상 + 🔥 배지 | ✅ |
| C-V4 | 라이벌 리더보드 탭 | 내 순위 앞뒤 6명 + 동종 캐릭터 필터 | ✅ |
| D-D0 | OG 이미지 서버 | GET /api/og?userId= (@napi-rs/canvas) + head 메타 태그 동적 업데이트 | ✅ |

### 세션 3 (2026-03-19) — Sprint A + 보안 리뷰
| # | 항목 | 내용 | 상태 |
|---|------|------|------|
| V1 | Stored XSS 방지 | `_esc()` 헬퍼 추가, `buildLB()` 닉네임 이스케이프 | ✅ |
| V2 | 닉네임/charKey 서버 검증 | `PATCH /api/auth/me` — nickname 2~20자 trim, charKey 화이트리스트 | ✅ |
| V3 | trust proxy 설정 | `app.set('trust proxy', 1)` — Railway X-Forwarded-For rate limit 정확성 | ✅ |
| R1 | TOCTOU 레이스 조건 | `checkCooldown` → `$transaction` 내부로 이동, buy+sell 동시 우회 차단 | ✅ |
| R2 | 500 에러 내부 노출 | `trade.js`/`leaderboard.js` `e.message` → generic 메시지 교체 | ✅ |
| R3 | reason 길이 검증 | 200자 초과 시 400 반환 — DB 오염 방지 | ✅ |
| R4 | 폴링 조건 수정 | `_startPortfolioPoll()` 항상 시작 (초기 로드 실패 무관) | ✅ |
| R5 | validate 레거시 제거 | `POST /api/trade/validate` 엔드포인트 + `checkCooldown` 헬퍼 삭제 | ✅ |
| R6 | 리더보드 캐싱 | 30s 인메모리 캐시 + `take:500` 쿼리 한도 + 스테일 폴백 | ✅ |
| R7 | 탭 visibility 폴링 | `document.visibilityState !== 'hidden'` 체크 — 백그라운드 탭 API 호출 차단 | ✅ |
| R8 | 초기 로드 병렬화 | `_loadServerPortfolio` → `Promise.allSettled` 3개 동시 요청 (~400ms 단축) | ✅ |

---

## 12. Phase 2 남은 작업 (PRD v5 기준 — 소프트 런치 Apr 15 목표)

### Sprint A — 보안 (P0, Mar 19-25)
| # | 작업 | 상태 |
|---|------|------|
| A1 | 서버 거래 실행 API (`POST /api/trade/execute`) — validate+execute+record 원자적 $transaction | ✅ 완료 |
| A2 | `_execTrade()` → `/api/trade/execute` 연동, 오프라인 폴백 제거 (치팅 방지) | ✅ 완료 |
| A3 | `PATCH /api/portfolio` 재무 필드 제거 + `POST /api/portfolio/reset` 추가 | ✅ 완료 |
| A4 | Prisma 싱글톤(`src/db.js`) 도입 — 4개 중복 인스턴스 제거 | ✅ 완료 |
| A5 | 포트폴리오 상태 폴링 (`GET /api/portfolio/state`) | ✅ 완료 |
| A6 | localStorage → 서버 마이그레이션 완성 (서버 값 우선 로딩) | ✅ 완료 |

### Sprint B — 경제 (P1, Mar 26-Apr 1)
| # | 작업 | 상태 |
|---|------|------|
| B1 | 티어 시스템 (Iron/Bronze/Silver/Gold/Diamond) | ⬜ 미착수 |
| B2 | 경제 Sink 추가 (봇이름 50BC·스킨 200BC·프리미엄블록 10DS) | ⬜ 미착수 |
| B3 | 보상 곡선 튜닝 (일일 ~300 획득 / ~200 소비) | ⬜ 미착수 |
| B4 | 업적 시스템 5종 | ⬜ 미착수 |

### Sprint C — 바이럴/리텐션 (완료, 2026-03-19)
| # | 작업 | 상태 |
|---|------|------|
| C-V1 | 레퍼럴 시스템 (초대 링크 + `POST /api/referral/claim` + 양쪽 +500BC) | ✅ 완료 |
| C-V2 | 공유 카드 퍼센타일 (상위 X% 배지 + shareAction 텍스트) | ✅ 완료 |
| C-V3 | 로그인 스트릭 (3/7/14/30일 마일스톤 BC/DS 보상 + 🔥 배지) | ✅ 완료 |
| C-V4 | 라이벌 리더보드 탭 (내 순위 앞뒤 6명 + 동종 캐릭터 필터) | ✅ 완료 |

### Sprint D — 런치 (P0, Apr 9-15)
| # | 작업 | 상태 |
|---|------|------|
| D-D0 | OG 이미지 서버 렌더 (`GET /api/og?userId=` + @napi-rs/canvas + head 메타 태그) | ✅ 완료 |
| D-D1 | 딥링크 랜딩 배너 UI (?ref= → .ref-banner 표시 + 비로그인 시 로그인 모달 자동오픈) | ✅ 완료 |
| D-D2 | Web Push 알림 (sw.js + VAPID + /api/push/subscribe + 일일 크론 KST 9시) | ✅ 완료 |
| D-D3 | 메트릭 대시보드 (`GET /api/admin/metrics` + `/api/admin/dashboard` HTML) | ✅ 완료 |

### Phase 3로 연기
| 항목 | 이유 |
|------|------|
| Vite 번들링 + 완전 모듈화 | 2.1 |
| 서버사이드 tick 엔진 (완전 서버 권위) | 2.7 |
| Apple OAuth | Apple Developer 계정 $99/년 필요 |
| Toss Payments 인앱 결제 | 사업자 계정 필요 |
| AdMob/Unity Ads | - |

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
3. node -e로 JS 문법 체크 (python3 사용 불가 — Windows 환경)
4. 모바일 환경 시뮬레이션 (480px 뷰포트)
```

### 파일 배포 방법
```bash
# GitHub Pages 배포 — main 브랜치에 push하면 GitHub Actions가 gh-pages에 자동 배포
git add index.html
git commit -m "feat: [변경 내용]"
git push origin main
# → .github/workflows/deploy.yml 실행 → gh-pages 자동 배포 (약 1분)
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

*최종 업데이트: 2026-03-19 (세션 5회차) | 작업자: 시윤 + Claude*
