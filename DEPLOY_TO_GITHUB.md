# 上传到 GitHub 指南

## 步骤 1: 在 GitHub 创建新仓库

1. 访问：https://github.com/new
2. 仓库名称：`cyberpunk-ai-landing`
3. 选择 Public（公开）或 Private（私有）
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

## 步骤 2: 连接并推送代码

创建仓库后，在终端运行：

```bash
git remote add origin https://github.com/你的用户名/cyberpunk-ai-landing.git
git push -u origin main
```

## 自动部署到 Vercel

推送完成后，你可以：

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. Vercel 会自动检测 Next.js 并部署
4. 几分钟后你的网站就会上线！

## 或者使用 GitHub CLI

如果你安装了 GitHub CLI：

```bash
gh repo create cyberpunk-ai-landing --public --source=. --remote=origin --push
```

---

**注意**：替换上面的 `你的用户名` 为你的实际 GitHub 用户名。

