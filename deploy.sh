#!/bin/bash
# ═══════════════════════════════════════════════
#  크립토 봇 아레나 — GitHub Pages 배포 스크립트
#  실행 전: git, gh CLI 설치 필요
#  실행 방법: chmod +x deploy.sh && ./deploy.sh
# ═══════════════════════════════════════════════

set -e

REPO_NAME="crypto-bot-arena"
BRANCH="gh-pages"

echo ""
echo "🏟️  크립토 봇 아레나 — GitHub Pages 배포"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Git 초기화
echo "📁 [1/5] Git 초기화..."
git init
git checkout -b $BRANCH 2>/dev/null || git checkout $BRANCH

# 2. 모든 파일 추가
echo "📄 [2/5] 파일 추가..."
git add .
git status --short

# 3. 커밋
echo "💾 [3/5] 커밋..."
git commit -m "🚀 Phase 1 배포: 3화면 앱 + 캐릭터 시트 + 파산 화면"

# 4. GitHub 레포 생성 (gh CLI 사용)
echo "🐙 [4/5] GitHub 레포 생성..."
if command -v gh &> /dev/null; then
  gh repo create $REPO_NAME --public --source=. --remote=origin --push 2>/dev/null || \
  git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git" 2>/dev/null || true
  git push -u origin $BRANCH --force
else
  echo "⚠️  gh CLI 없음. 아래 명령어로 수동 푸시하세요:"
  echo ""
  echo "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
  echo "   git push -u origin gh-pages --force"
  echo ""
fi

# 5. Pages 설정
echo "⚙️  [5/5] GitHub Pages 활성화..."
if command -v gh &> /dev/null; then
  OWNER=$(gh api user -q .login)
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    /repos/$OWNER/$REPO_NAME/pages \
    -f source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || \
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    /repos/$OWNER/$REPO_NAME/pages \
    -f source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || true

  URL="https://$OWNER.github.io/$REPO_NAME/"
  echo ""
  echo "✅  배포 완료!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔗  메인 앱:      $URL"
  echo "🔗  데모 허브:    ${URL}hub.html"
  echo "🔗  캐릭터 시트:  ${URL}characters.html"
  echo "🔗  파산 화면:    ${URL}gameover.html"
  echo ""
  echo "⏳  GitHub Pages 빌드는 약 30초~2분 소요됩니다."
fi
