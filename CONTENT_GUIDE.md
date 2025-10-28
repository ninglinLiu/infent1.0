# 📝 内容管理指南

## 概述

本项目使用 JSON 文件存储所有文案内容，支持中英双语。修改 JSON 后刷新页面即可看到更新。

## 📂 文件位置

### 1. `/content/project.json`

包含所有项目相关文案：

```json
{
  "projectTitle": { "zh": "...", "en": "..." },
  "problem": { "zh": "...", "en": "..." },
  "solution": { "zh": "...", "en": "..." },
  "modules": {
    "zh": [...],  // 6个核心模块
    "en": [...]
  },
  "useCases": {
    "zh": [...],  // 4个应用场景
    "en": [...]
  },
  "roadmap": {
    "zh": [...],  // 4个阶段
    "en": [...]
  },
  "faq": {
    "zh": [...],  // FAQ列表
    "en": [...]
  }
}
```

### 2. `/content/kpis.json`

包含指标数据和图表数据：

```json
{
  "metrics": {
    "VaR": { "value": 2.3, "unit": "%", ... },
    "Sharpe": { "value": 1.87, ... },
    ...
  },
  "chartData": {
    "returns": [...],
    "drawdown": [...],
    "riskRadar": { ... }
  }
}
```

## 🎯 如何修改内容

### 修改标题
编辑 `project.json`:
```json
"projectTitle": {
  "zh": "你的中文标题",
  "en": "Your English Title"
}
```

### 添加模块
在 `modules` 数组中添加：
```json
{
  "title": "模块名称",
  "description": "模块描述"
}
```

### 修改 KPI
编辑 `kpis.json`:
```json
"metrics": {
  "YourMetric": {
    "value": 99.9,
    "unit": "%",
    "label": { "zh": "指标名", "en": "Metric Name" },
    "trend": "+1.2",
    "color": "cyan"
  }
}
```

### 更新路线图
修改 `roadmap` 数组：
```json
{
  "phase": "阶段名",
  "date": "2024 Q1",
  "milestones": ["里程碑1", "里程碑2"]
}
```

## 🌈 颜色选项

KPI 指标支持三种颜色：
- `"cyan"` - 青色
- `"magenta"` - 品红
- `"purple"` - 紫色

## 📊 图表数据格式

### 收益曲线数据
```json
"returns": [
  { "date": "2024-01", "value": 2.1 },
  { "date": "2024-02", "value": 3.8 }
]
```

### 回撤数据
```json
"drawdown": [
  { "date": "2024-01", "value": -1.2 },
  { "date": "2024-02", "value": -0.8 }
]
```

### 风险雷达
```json
"riskRadar": {
  "credit": 3.2,
  "market": 4.1,
  "liquidity": 2.8,
  "fraud": 1.9,
  "operational": 3.5
}
```

## 🔄 实时更新

开发模式：
- 修改 JSON 文件
- 保存
- 刷新浏览器
- 立即生效

生产模式：
- 修改 JSON
- 重新构建：`npm run build`
- 重新部署

## 💡 提示

1. **保持双语同步** - 修改时同时更新 zh 和 en
2. **JSON 格式验证** - 使用在线工具验证 JSON 格式
3. **字符转义** - 特殊字符需要转义（\n, \", \\）
4. **数据一致性** - 确保数据结构保持一致
5. **增量更新** - 修改后测试完整流程

## 🛠️ 批量替换

使用搜索替换工具快速修改：

**VS Code:**
1. Cmd/Ctrl + Shift + H
2. 搜索目标文本
3. 替换为新内容
4. 选择 "在文件中替换"

## 📐 内容长度建议

- **标题**: 10-40 字符
- **描述**: 50-200 字符
- **段落**: 100-500 字符
- **CTA**: 5-15 字符

## 🎨 表情符号

在 JSON 中使用 Unicode 编码：
```json
"icon": "\uD83D\uDCBC"  // 💼
```

或直接在 JSON 字符串中使用：
```json
"icon": "💼"
```

## ⚠️ 常见错误

### JSON 语法错误
```json
// ❌ 错误
{
  "key": "value"
  "key2": "value2"  // 缺少逗号
}

// ✅ 正确
{
  "key": "value",
  "key2": "value2"
}
```

### 缺少引号
```json
// ❌ 错误
{
  key: "value"
}

// ✅ 正确
{
  "key": "value"
}
```

## 🔍 验证方法

### 使用在线工具
- [JSONLint](https://jsonlint.com/)
- [JSON Formatter](https://jsonformatter.curiousconcept.com/)

### 命令行验证
```bash
node -e "JSON.parse(require('fs').readFileSync('content/project.json'))"
```

## 📱 响应式文本

移动端会自动换行，建议：
- 标题不超过 3 行
- 段落使用短句
- 重要信息前置

## 🎯 最佳实践

1. **版本控制** - 使用 Git 追踪 JSON 变更
2. **备份数据** - 修改前复制原文件
3. **测试预览** - 修改后立即预览效果
4. **团队协作** - 使用清晰的命名规范
5. **文档记录** - 记录每次重大修改

---

需要帮助？查看 README.md 获取更多信息。
