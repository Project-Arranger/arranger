# Arranger Pro - 现代化的 Web 编曲编辑器

Arranger Pro 是一个基于 Web 的创新编曲工具，旨在为用户提供流畅、直观且具有专业质感的音乐创作体验。通过拖拽式和弦编辑、步进式音序记录以及内置的合成引擎，用户可以快速构建出高质量的音乐片段。

![Arranger App Preview](/preview.png) *(占位图)*

## ✨ 核心特性

- **可视化和弦音轨 (Chord Track)**：
  - 独创的“积木式”拖拽编辑，支持 C、Am、F、G 等基础和弦。
  - **变体抽屉 (Variation Drawer)**：点击积木即可呼出高级变体选择，如 `maj7`、`maj9`、`add9` 等。
  - **切分组织 (Organize Mode)**：一键对小节执行智能切分，生成节奏感十足的过渡效果。

- **多轨道步进音序器 (Step Sequencers)**：
  - **BASS**：专为低音设计的单音合成音序器，支持 8 个小节的独立编程。
  - **PERC**：内置经典 808 鼓机采样，支持 Kick、Snare、Hi-hat 等多音色叠加。
  - **LEAD**：高表现力的旋律音序器，完美配合和弦进行。

- **高精度音频引擎 (Audio Engine)**：
  - 基于 **Tone.js** 驱动，实现毫秒级的音频调度。
  - **平滑播放头 (Smooth Playhead)**：与 BPM 完美同步的线性移动指针，支持流畅的实时 Scrubbing（拖拽定位）。
  - 内置多种合成器：FM 合成（和弦）、MonoSynth（低音）以及采样器（打击乐）。

- **专业级 UI/UX 设计**：
  - **录音室深色系 (Dark Studio)**：精心调配的冷色系视觉系统，长久创作不累眼。
  - 极致响应：支持鼠标与触摸设备的流畅操作，优化的 Zustand 状态流极大降低了交互延迟。

## 🛠️ 技术栈

- **Frontend**: React 19, Framer Motion (动画)
- **Audio**: Tone.js (时钟、合成器、效果器)
- **State**: Zustand (全局状态同步)
- **Build**: Vite 8

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 操作指引
1. **放置和弦**：从底部的和弦调色板中拖拽和弦到顶部的 CHORD 轨道。
2. **切换变体**：点击已放置的和弦积木，在弹出的窗口中选择不同的变体或使用 Organize 进行切分。
3. **编写节奏**：点击 BASS 或 PERC 轨道进入矩阵编辑模式（在下方显示），点击方块即可记录音符。
4. **Scrubbing**：在上方进度条或音轨区域左右拖拽，可实时定位播放头。

## 📁 项目结构

```text
src/
├── audio/          # Tone.js 音频引擎逻辑
├── components/     # UI 组件 (和弦、矩阵、进度条等)
├── data/           # 和弦库、音阶定义等静态数据
├── store/          # Zustand 状态管理 (MusicStore)
└── App.jsx         # 应用入口与全局布局
```

---

由 **Google Deepmind Advanced Agentic Coding Team** 成员（Antigravity）辅助设计开发。