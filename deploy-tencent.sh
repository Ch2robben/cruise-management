#!/usr/bin/env sh
# 腾讯云 CloudBase 静态网站托管一键部署
# 详见 TENCENT_DEPLOY_SKILL.md

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/.deploy/tencent.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

if [ -z "${TCB_ENV_ID:-}" ] || [ -z "${TCB_SECRET_ID:-}" ] || [ -z "${TCB_SECRET_KEY:-}" ]; then
  echo "❌ 未找到腾讯云密钥。"
  echo "请按 TENCENT_DEPLOY_SKILL.md 创建 .deploy/tencent.env"
  echo "或在 Gitee → 服务 → 腾讯云托管 中完成首次绑定。"
  exit 1
fi

echo "[1/3] 构建..."
npm run build

echo "[2/3] 登录 CloudBase CLI..."
npx --yes @cloudbase/cli@latest login --apiKeyId "$TCB_SECRET_ID" --apiKey "$TCB_SECRET_KEY"

echo "[3/3] 上传到静态网站托管..."
npx --yes @cloudbase/cli@latest hosting deploy ./dist / -e "$TCB_ENV_ID"

echo ""
echo "=== 腾讯云静态托管部署完成 ✅ ==="
echo "请在 CloudBase 控制台查看默认访问域名。"
