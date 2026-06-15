# Skill: 游轮管理系统部署

> 本文档是一份 AI Agent Skill，供任何模型读取后执行完整的部署/更新流程。

## 环境信息（已配置完毕，勿修改）

| 项目 | 值 |
|------|-----|
| 服务器公网 IP | `47.86.235.52` |
| 服务器实例 ID | `i-j6cfs9mgfco0o1pkgm7g` |
| 阿里云地域 | `cn-hongkong` |
| 系统 | Ubuntu 22.04 |
| GitHub 仓库 | `https://github.com/Ch2robben/cruise-management.git` |
| 部署分支 | `feature/collaboration-baseline-20260608` |
| 网站根目录 | `/var/www/cruise-management/` |
| 源码目录 | `/var/www/cruise-src/` |
| 服务器部署脚本 | `/var/www/deploy-cruise.sh` |
| 访问地址 | `http://47.86.235.52` |
| 本地项目路径 | `/Users/huangchuhua/AI项目/cruise-management` |

## 前提条件

- 本地已安装并配置 `aliyun` CLI（`aliyun configure` 已完成，AccessKey 已绑定）
- 本地已安装 `node` / `npm`
- GitHub 仓库有推送权限

---

## 场景一：更新代码并重新部署（最常用）

### Step 1：本地推代码

```bash
cd /Users/huangchuhua/AI项目/cruise-management
git add -A
git commit -m "描述本次更新内容"
git push origin feature/collaboration-baseline-20260608
```

### Step 2：通过阿里云 CLI 触发服务器一键部署

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent 'bash /var/www/deploy-cruise.sh' \
  --Timeout 600
```

### Step 3：获取 InvokeId 并查询结果

上一步命令会返回 JSON，取其中的 `InvokeId` 字段，等待约 2~3 分钟后查询：

```bash
# 将 <InvokeId> 替换为实际值
sleep 120 && aliyun ecs DescribeInvocationResults \
  --RegionId cn-hongkong \
  --InvokeId <InvokeId> | python3 -c "
import sys, json, base64
d = json.load(sys.stdin)
r = d['Invocation']['InvocationResults']['InvocationResult'][0]
print('状态:', r['InvocationStatus'])
print('退出码:', r['ExitCode'])
print(base64.b64decode(r['Output']).decode('utf-8', errors='replace')[-2000:])
"
```

### Step 4：验证上线

```bash
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://47.86.235.52/
# 期望输出：HTTP状态码: 200
```

---

## 场景二：从零开始全新部署（服务器是全新机器）

### 2.1 安装 Node.js

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs && node -v' \
  --Timeout 120
```

### 2.2 克隆代码并构建

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent '
mkdir -p /var/www/cruise-management
git clone -b feature/collaboration-baseline-20260608 \
  https://github.com/Ch2robben/cruise-management.git /var/www/cruise-src
cd /var/www/cruise-src && npm install --legacy-peer-deps && npm run build
cp -r dist/* /var/www/cruise-management/
' \
  --Timeout 600
```

### 2.3 配置 Nginx

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent '
cat > /etc/nginx/sites-available/cruise-management << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/cruise-management;
    index index.html;
    server_name _;
    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF
ln -sf /etc/nginx/sites-available/cruise-management /etc/nginx/sites-enabled/cruise-management
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx && echo "Nginx 配置完成"
' \
  --Timeout 30
```

### 2.4 写入服务器部署脚本

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent '
cat > /var/www/deploy-cruise.sh << SCRIPT
#!/bin/bash
set -e
REPO_DIR="/var/www/cruise-src"
DEPLOY_DIR="/var/www/cruise-management"
BRANCH="feature/collaboration-baseline-20260608"
REPO_URL="https://github.com/Ch2robben/cruise-management.git"
echo "[$(date)] 开始部署..."
if [ -d "$REPO_DIR" ]; then
  cd "$REPO_DIR" && git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$REPO_DIR" && cd "$REPO_DIR"
fi
npm install --legacy-peer-deps --silent
npm run build
rm -rf "$DEPLOY_DIR"/* && cp -r "$REPO_DIR/dist/"* "$DEPLOY_DIR/"
systemctl reload nginx
echo "[$(date)] 部署完成 => http://47.86.235.52"
SCRIPT
chmod +x /var/www/deploy-cruise.sh && echo "脚本写入完成"
' \
  --Timeout 15
```

---

## 场景三：查看服务器状态

```bash
aliyun ecs RunCommand \
  --RegionId cn-hongkong \
  --InstanceId.1 i-j6cfs9mgfco0o1pkgm7g \
  --Type RunShellScript \
  --CommandContent '
echo "=== Nginx ===" && systemctl is-active nginx
echo "=== 磁盘 ===" && df -h /
echo "=== 内存 ===" && free -h
echo "=== 网站文件 ===" && ls -lh /var/www/cruise-management/
echo "=== 最新部署 ===" && stat /var/www/cruise-management/index.html | grep Modify
' \
  --Timeout 15
```

---

## 注意事项

- SSH 无法直连（服务器网络环境限制），**所有服务器操作必须通过 `aliyun ecs RunCommand` 执行**
- 每次 `RunCommand` 是异步的，需用 `DescribeInvocationResults` 查询结果
- `--Timeout` 单位是秒，构建步骤设 600 秒（10分钟）
- 服务器已有：Node.js v22、Nginx（80端口）、Docker（new-api 容器在 3000 端口）
- 验证方法：`curl -o /dev/null -w "%{http_code}" http://47.86.235.52/`（期望 200）
