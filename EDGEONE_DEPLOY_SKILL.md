# Skill: 游轮管理系统 EdgeOne Makers 部署

> 国内访问友好的静态托管，访问形如 `https://<项目名>-<hash>.edgeone.dev/`

## 环境信息

| 项目 | 值 |
|------|-----|
| 当前访问地址 | `https://cruise-management-dpmoj5pp6jvd.edgeone.dev/` |
| 构建配置 | 项目根目录 `edgeone.json` |
| 输出目录 | `dist` |
| base 路径 | `/`（根路径，**不要用** `/cruise-management/`） |
| 登录 | `admin` / `123456` |

## 前提条件

- 已在 [EdgeOne Makers](https://console.cloud.tencent.com/edgeone/pages) 导入 Git 仓库
- 生产分支与 GitHub/Gitee 推送分支一致

---

## 场景一：更新并重新部署

### Step 1：推送代码

```bash
cd /Users/huangchuhua/AI项目/cruise-management
git add -A && git commit -m "描述更新" && git push origin feature/collaboration-baseline-20260608
```

### Step 2：触发 EdgeOne 重新部署

**Git 导入项目（当前方式）**——推送代码后需在控制台手动点「重新部署」，或确认已开启自动部署：

1. 打开 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 进入项目 `cruise-management`
3. **项目设置 → 构建部署配置**，确认：

| 配置项 | 正确值 |
|--------|--------|
| 生产分支 | `master` |
| 框架预设 | Vite |
| 构建命令 | `npm run build:edgeone` |
| 输出目录 | `dist` |
| 根目录 | `/` |

4. 点击 **「重新部署」**（或「部署」→ 生产环境）
5. 等待构建日志显示成功（约 2～5 分钟）

**CLI 直传（需 API Token）**：

```bash
# 控制台 → 账户设置 → API Token，写入 .deploy/edgeone.env
bash deploy-edgeone.sh
```

### Step 3：验证

```bash
# HTML 中资源路径应为 /assets/... 而非 /cruise-management/assets/...
curl -sL https://cruise-management-dpmoj5pp6jvd.edgeone.dev/ | grep -E 'src=|href=.*css'
curl -sI https://cruise-management-dpmoj5pp6jvd.edgeone.dev/assets/index-*.js | head -3
# JS 的 Content-Type 应为 application/javascript，不能是 text/html
```

---

## 常见问题：页面空白

**原因**：构建时 `base` 设成了 `/cruise-management/`（GitHub Pages 用法），但 EdgeOne 从域名根路径 `/` 提供静态文件，导致 JS/CSS 404，浏览器拿到的是 HTML 回退页。

**正确配置**（`edgeone.json` 已锁定）：

```json
{
  "buildCommand": "npm run build:edgeone",
  "outputDirectory": "dist"
}
```

`vite.config.ts` 保持 `base: '/'`。

**控制台检查**（项目设置 → 构建部署配置）：

| 项 | 正确值 | 错误值 |
|----|--------|--------|
| 框架预设 | Vite | — |
| 构建命令 | `npm run build:edgeone` | 含 `--base /cruise-management/` |
| 输出目录 | `dist` | `build` 或空 |
| 根目录 | `/` | — |

修改后点「重新部署」。

---

## 与其他部署对比

| | EdgeOne Makers | 阿里云 ECS |
|--|----------------|------------|
| 国内访问 | ✅ | ✅ |
| base 路径 | `/` | `/` |
| 配置文档 | 本文档 | `DEPLOY_SKILL.md` |
