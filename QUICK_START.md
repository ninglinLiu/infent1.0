# 🚀 Cyberpunk AI Landing Page - Quick Start

## ✅ 项目已就绪！

你的赛博朋克风格官网已经成功搭建，可以直接运行和部署。

## 🎯 当前状态

✅ **所有文件已创建**
✅ **依赖已安装** (532 packages)
✅ **开发服务器运行中** (http://localhost:3000)

## 🎨 特性概览

### 设计风格
- 🌙 深色霓虹主题（青绿/品红/紫色）
- ✨ 故障特效（Glitch）
- 🎭 全息卡片（HoloCard）3D 倾斜
- 🌈 Three.js 3D 背景动画
- 📺 CRT 扫描线效果

### 核心功能
- 🌍 双语切换（中文/英文）
- 📊 实时 KPI 仪表板
- 🎯 风险雷达可视化
- 🗺️ 产品路线图
- ❓ FAQ 折叠面板
- 📧 联系表单
- 📱 完美移动端适配

### 技术栈
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Three.js**
- **shadcn/ui** 组件

## 🖥️ 本地运行

```bash
# 安装依赖（如果未安装）
npm install

# 启动开发服务器
npm run dev
```

访问：**http://localhost:3000**

## 📝 内容管理

所有文案内容都在 JSON 文件中，支持双语：

**编辑内容：**
```bash
# 项目描述、模块、用例等
content/project.json

# KPI 数据、图表数据
content/kpis.json
```

修改后刷新页面即可看到更新。

## 🚀 部署到 Vercel

### 方法 1：一键部署
1. 推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 自动部署！

### 方法 2：CLI 部署
```bash
npm i -g vercel
vercel
```

## 📦 项目结构

```
/
├── app/
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx           # 主页
│   ├── globals.css        # 全局样式
│   └── api/feedback/      # 表单 API
├── components/
│   ├── ui/                # 基础 UI 组件
│   ├── NeonHeader.tsx     # 导航栏
│   ├── Hero.tsx           # 英雄区块
│   ├── HoloCard.tsx       # 全息卡片
│   ├── MetricsPanel.tsx   # KPI 仪表
│   ├── RiskRadar.tsx      # 风险雷达
│   ├── ArchitectureScene.tsx # 3D 架构
│   ├── TimelineRoadmap.tsx # 路线图
│   ├── FAQ.tsx            # 常见问题
│   └── ContactForm.tsx     # 联系表单
├── content/
│   ├── project.json       # 项目内容
│   └── kpis.json          # KPI 数据
└── lib/
    ├── language-context.tsx # 语言切换
    └── utils.ts           # 工具函数
```

## 🎨 自定义样式

编辑 `app/globals.css` 修改霓虹颜色：

```css
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-purple: #a855f7;
```

## 📊 组件说明

### Hero Section
- 故障标题动画
- 双语切换
- CTA 按钮

### Problem & Solution
- 左右对比卡片
- 交互式悬停效果

### Key Modules
- 6 个核心模块展示
- 全息卡片效果

### Architecture Scene
- Three.js 3D 场景
- 动态节点连线
- 呼吸动画

### Metrics Panel
- 6 个 KPI 指标
- 数值跳动动画
- 霓虹发光边框

### Risk Radar
- 5 维风险评分
- 进度条动画

### Timeline
- 产品路线图
- 交替布局
- 时间轴动画

### FAQ
- 可折叠问答
- 平滑展开动画

### Contact Form
- 表单验证
- 伪 API 提交
- Toast 通知

## 🐛 故障排除

### 页面空白
- 检查浏览器控制台
- 确认 Three.js WebGL 支持

### 3D 场景不渲染
- 浏览器需要 WebGL 支持
- 尝试禁用硬件加速

### 样式错乱
- 清除浏览器缓存
- 重启开发服务器

### 端口占用
```bash
# 修改端口
npm run dev -- -p 3001
```

## 📈 性能优化

- ✅ Three.js 场景按需加载
- ✅ 图片优化（Next.js Image）
- ✅ 代码分割
- ✅ 懒加载动画

## 🎉 下一步

1. **自定义内容** - 编辑 `content/*.json`
2. **调整样式** - 修改 `globals.css`
3. **添加内容** - 在 `page.tsx` 添加新区块
4. **连接真 API** - 替换伪 API 接口
5. **SEO 优化** - 更新 `metadata` in `layout.tsx`

## 📚 文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Three.js](https://threejs.org/)

## 🎨 创意建议

- 添加更多交互动画
- 集成真实数据 API
- 添加暗黑/明亮主题切换
- 集成 Google Analytics
- 添加 A/B 测试

---

**现在就访问 http://localhost:3000 查看效果！** 🚀
