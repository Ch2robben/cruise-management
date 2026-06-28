#!/usr/bin/env sh
# Gitee Pages 一键部署（国内访问友好）
# 详见 GITEE_DEPLOY_SKILL.md

set -e

GITEE_REPO="git@gitee.com:huang-chuhua123/cruise-project.git"
GITEE_BASE="/cruise-project/"
PAGES_URL="https://huang-chuhua123.gitee.io/cruise-project/"

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "[1/4] 类型检查..."
npx tsc -b

echo "[2/4] 构建（base=${GITEE_BASE}）..."
npx vite build --base "$GITEE_BASE"

echo "[3/4] 准备 Pages 产物..."
cd dist
cp index.html 404.html
echo > .nojekyll

rm -rf .git
git init -q
git add -A
git commit -q -m "deploy $(date '+%Y-%m-%d %H:%M:%S')"

echo "[4/4] 推送到 Gitee gh-pages..."
git push -f "$GITEE_REPO" HEAD:gh-pages

cd "$ROOT"
echo ""
echo "=== Gitee Pages 部署完成 ✅ ==="
echo "访问地址: ${PAGES_URL}"
echo "若页面未更新，请到 Gitee 仓库 → 服务 → Gitee Pages → 点击「更新」"
