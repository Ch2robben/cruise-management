#!/usr/bin/env sh
# EdgeOne Makers 本地构建 + CLI 部署
# 详见 EDGEONE_DEPLOY_SKILL.md

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/.deploy/edgeone.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

PROJECT_NAME="${EDGEONE_PROJECT_NAME:-cruise-management}"

echo "[1/2] 构建（base=/）..."
npm run build:edgeone

if [ -z "${EDGEONE_PAGES_API_TOKEN:-}" ]; then
  echo ""
  echo "❌ 未配置 EDGEONE_PAGES_API_TOKEN，无法 CLI 上传。"
  echo "请任选其一："
  echo "  1) EdgeOne 控制台 → 项目 → 重新部署（推荐，Git 导入项目）"
  echo "  2) 配置 .deploy/edgeone.env 后重试本脚本"
  echo "  3) 运行: npx edgeone login && npx edgeone makers deploy dist -n ${PROJECT_NAME}"
  exit 1
fi

echo "[2/2] 上传到 EdgeOne Makers..."
npx --yes edgeone@latest makers deploy dist -n "$PROJECT_NAME" -t "$EDGEONE_PAGES_API_TOKEN"

echo ""
echo "=== EdgeOne 部署完成 ✅ ==="
echo "访问: https://cruise-management-dpmoj5pp6jvd.edgeone.dev/"
