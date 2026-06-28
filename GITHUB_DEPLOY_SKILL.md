# Skill: 游轮管理系统 GitHub Pages 部署

> 海外/备用访问地址，国内访问可能较慢。

## 环境信息

| 项目 | 值 |
|------|-----|
| GitHub 仓库 | `https://github.com/Ch2robben/cruise-management` |
| Pages 地址 | `https://ch2robben.github.io/cruise-management/` |
| 部署方式 | GitHub Actions（`.github/workflows/deploy.yml`） |
| 触发分支 | `master` |
| 构建 base | `/cruise-management/` |
| 登录 | `admin` / `123456` |

---

## 场景一：更新并部署（最常用）

### Step 1：合并到 master 并推送

GitHub Pages 工作流仅在 **push 到 master** 时触发：

```bash
cd /Users/huangchuhua/AI项目/cruise-management
git checkout feature/collaboration-baseline-20260608
# 确保功能分支已提交
git checkout master
git merge feature/collaboration-baseline-20260608
git push origin master
```

### Step 2：等待 GitHub Actions 完成

```bash
gh run list --workflow=deploy.yml --limit 3
gh run watch   # 等待最新一次 run 完成
```

或在浏览器打开：  
`https://github.com/Ch2robben/cruise-management/actions`

### Step 3：验证

```bash
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" https://ch2robben.github.io/cruise-management/
```

---

## 注意事项

- GitHub Pages 必须使用 `base: /cruise-management/`，与 EdgeOne（`base: /`）、阿里云（`base: /`）不同
- 工作流会自动 `cp dist/index.html dist/404.html` 以支持 SPA 路由
- 国内主站仍推荐阿里云 ECS 或 EdgeOne Makers
