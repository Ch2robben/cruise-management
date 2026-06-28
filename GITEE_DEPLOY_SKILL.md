# ⚠️ Gitee Pages 已下线

Gitee 已于 2024 年起停止 **Gitee Pages** 服务，仓库「服务」菜单中不再出现 Pages 选项。  
此前 `deploy.sh` 推送到 `gh-pages` 分支**无法**再提供可访问的网站。

## 请改用以下国内部署方案

| 方案 | 文档 | 说明 |
|------|------|------|
| **阿里云 ECS**（当前主站） | `DEPLOY_SKILL.md` | http://47.86.235.52，已可用 |
| **腾讯云静态托管**（国内备用） | `TENCENT_DEPLOY_SKILL.md` | Gitee → 服务 → **腾讯云托管**，或 CLI 部署 |

## 历史脚本

- `deploy.sh` / `npm run deploy:gitee`：仅推送 gh-pages，**不再产生可访问站点**，保留供迁移参考，请勿再作为生产部署方式。
