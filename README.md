# 抽奖系统

基于 Electron 的桌面抽奖程序——导入名单文件，随机抽取获奖者，以逐字揭晓动画展示结果。

## 功能

- 支持 TXT、CSV、Excel（.xlsx）三种格式的名单导入
- CSV/Excel 智能列检测——无需表头也能自动识别姓名列
- 点击导入或直接拖拽文件到窗口
- 可配置每次抽取人数，支持允许/禁止重复抽取
- 逐字揭晓动画（战术 HUD 风格视觉主题）
- 多名单管理——可同时加载多份名单，自由切换
- localStorage 持久化——关闭程序后数据不丢失
- 打包为单个便携 .exe 文件，无需安装即可运行

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式运行（Windows 下必须用 cmd.exe，不能用 Git Bash）
cmd.exe /c "start /d . node_modules\electron\dist\electron.exe ."
```

## 打包

```bash
# 国内需设置镜像源
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# 打包为便携 .exe
npx electron-builder --win portable
```

输出：`build/抽奖系统 1.0.0.exe`（约 72MB，自包含，免安装）

## 项目结构

```
main.js              # Electron 主进程——窗口创建、IPC 通信、文件读写
preload.js           # contextBridge 安全桥接——向渲染进程暴露 API
renderer/
  index.html         # 入口页面，含 CSP 安全策略
  app.js             # 主控制器——UI 构建、事件绑定、状态管理、持久化
  animation.js       # AnimationEngine 类——逐字揭晓动画（搜索→闪烁→揭晓）
  lottery.js         # 纯随机抽取函数，基于 Fisher-Yates 思想
  file-import.js     # 智能名单解析器——表头匹配 + 列打分算法
  audio.js           # MP3 音效播放 + Web Audio API 合成降级方案
  style.css          # 战术 HUD 暗色主题 + CSS 动画关键帧
assets/
  icon.png           # 应用图标
  click.mp3          # 揭晓音效
```

## 使用说明

1. 启动程序
2. 导入名单——点击虚线区域选择文件，或直接拖拽文件到窗口
3. 设置每次抽取人数
4. 可选勾选"允许重复抽取"
5. 点击"开始抽取"
6. 观看逐字揭晓动画
7. 左侧面板查看中奖记录
8. 右侧面板管理多份名单

## 开发说明

本项目使用 Claude Code（Anthropic）辅助开发，是软件工程课程"AI辅助下的轻量级软件原型开发实践"的实验项目。详见 `CLAUDE.md`。
