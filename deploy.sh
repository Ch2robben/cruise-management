#!/usr/bin/env sh

# 发生错误时终止
set -e

# 构建项目
npm run build

# 进入构建输出文件夹
cd dist

# 创建 .nojekyll 以绕过 Jekyll 处理（Gitee Pages 有时需要）
echo > .nojekyll

# 初始化 git 仓库并提交
rm -rf .git
git init
git add -A
git commit -m 'deploy'

# 推送到 Gitee 仓库的 gh-pages 分支
git push -f git@gitee.com:huang-chuhua123/cruise-project.git master:gh-pages

cd -
