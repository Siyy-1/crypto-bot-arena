# 🤖 크립토 봇 아레나

> 코딩 없이 수인 캐릭터 봇을 만들어 업비트 실시간 시세로 모의투자 경쟁하는 캐주얼 소셜 트레이딩 게임

🎮 **[지금 플레이하기](https://siyy-1.github.io/crypto-bot-arena/)**

---

## 주요 기능

- **No-Code 블록 조립** — 블록을 탭해서 매매 전략을 만들어요
- **6종 개성 캐릭터** — 스캘퍼 🐰, 존버러 🐐, 방어형 🐻, 추세형 🦊, 퀀트 🐱, 차익형 🦦
- **업비트 실시간 시세** — WebSocket으로 실제 BTC/ETH/XRP 등 시세 연동
- **4주 시즌 시스템** — W1 셋업 → W2 본경쟁 → W3 이벤트 → W4 파이널 스프린트
- **레벨 언락** — 체결 횟수·순위에 따라 고급 블록 해금
- **파산 시스템** — 파산하면 명예의 전당 등재 후 부활

## 기술 스택

- Vanilla HTML/CSS/JS (단일 파일, 프레임워크 없음)
- 업비트 WebSocket API (실시간 시세)
- 업비트 REST API (캔들 차트, HTTPS 환경에서 자동 활성화)
- GitHub Pages (정적 배포)

## 로컬 실행

```bash
# 그냥 index.html을 브라우저로 열면 됨
# 단, 실제 캔들 차트는 HTTPS 환경(GitHub Pages)에서만 동작
# WebSocket 실시간 시세는 로컬에서도 동작
open index.html
```

## 로드맵

- **Phase 1** ✅ — 프론트엔드 MVP (현재)
- **Phase 2** — 업비트 API 가상 체결 엔진 (Node.js + PostgreSQL)
- **Phase 3** — Firebase 멀티플레이 + 듀얼 AI 모델 프리미엄 봇

## 라이선스

MIT
