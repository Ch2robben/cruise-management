# Skill: 游轮管理系统腾讯云静态托管部署（国内访问）

> Gitee Pages 已下线，国内演示/备用部署请用 **腾讯云 CloudBase 静态网站托管**。
> 也可在 Gitee 仓库 → **服务 → 腾讯云托管** 一键绑定（控制台向导，首次需人工开通）。
> 主站仍可用阿里云 ECS，见 `DEPLOY_SKILL.md`。

## 环境信息

| 项目 | 值 |
|------|-----|
| 托管产品 | 腾讯云 CloudBase 静态网站托管 |
| Gitee 源码仓库 | `git@gitee.com:huang-chuhua123/cruise-project.git` |
| GitHub 源码仓库 | `https://github.com/Ch2robben/cruise-management.git` |
| 部署分支 | `feature/collaboration-baseline-20260608` |
| 本地项目路径 | `/Users/huangchuhua/AI项目/cruise-management` |
| 部署脚本 | `./deploy-tencent.sh` |
| 密钥配置 | `.deploy/tencent.env`（勿提交 Git） |

访问地址在开通后由腾讯云分配，形如：`https://<环境ID>-<随机串>.tcloudbaseapp.com/`

---

## 前提条件（首次一次性配置）

### 方式 A：Gitee 菜单「腾讯云托管」（推荐新手）

1. 打开 Gitee 仓库 → **服务** → **腾讯云托管**
2. 按向导授权腾讯云、选择/创建 CloudBase 环境
3. 构建命令：`npm run build`，输出目录：`dist`
4. 开启「代码推送自动部署」

完成后每次 `git push` 到 Gitee 即可自动构建发布。

### 方式 B：本地 CLI 部署（AI 可执行）

1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建环境，开通 **静态网站托管**
3. [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 创建 SecretId / SecretKey
4. 本地创建密钥文件：

```bash
mkdir -p /Users/huangchuhua/AI项目/cruise-management/.deploy
cat > /Users/huangchuhua/AI项目/cruise-management/.deploy/tencent.env << 'EOF'
TCB_ENV_ID=你的环境ID
TCB_SECRET_ID=你的SecretId
TCB_SECRET_KEY=你的SecretKey
EOF
chmod 600 /Users/huangchuhua/AI项目/cruise-management/.deploy/tencent.env
```

5. 在 CloudBase 控制台 → 静态网站托管 → **路由配置**，添加 SPA 回退：
   - 规则：所有路径 `/*` → `/index.html`（或按控制台「单页应用」模板）

---

## 场景一：CLI 更新并部署（最常用）

### Step 1：推送源码（推荐）

```bash
cd /Users/huangchuhua/AI项目/cruise-management
git add -A && git commit -m "描述本次更新" && git push origin feature/collaboration-baseline-20260608
```

### Step 2：构建并部署到腾讯云

```bash
cd /Users/huangchuhua/AI项目/cruise-management
bash deploy-tencent.sh
```

### Step 3：验证

在 CloudBase 控制台 → 静态网站托管 → 默认域名，浏览器打开并登录 `admin` / `123456`。

---

## 场景二：仅本地构建不上传（检查构建是否通过）

```bash
cd /Users/huangchuhua/AI项目/cruise-management
npm run build
```

---

## 三套部署对比

| | 阿里云 ECS | 腾讯云静态托管 | Gitee Pages |
|--|-----------|---------------|-------------|
| 国内访问 | ✅ | ✅ | ❌ 已下线 |
| AI 部署 | `DEPLOY_SKILL.md` | `TENCENT_DEPLOY_SKILL.md` | 不可用 |
| 访问地址 | http://47.86.235.52 | CloudBase 默认域名 | — |

---

## 注意事项

- `.deploy/tencent.env` 含密钥，**禁止**提交到 Git
- 腾讯云构建使用 `base: /`（根路径），与已废弃的 Gitee Pages 子路径 `/cruise-project/` 不同
- 若用户说「国内部署」「腾讯云」，执行本 Skill；若说「阿里云」，执行 `DEPLOY_SKILL.md`
- Gitee 服务里的「腾讯云 Serverless」「阿里云 SAE」面向 Serverless 应用，本项目纯静态站优先用 **腾讯云托管 / 静态网站托管**
