# Project Arranger v0.22 Product Rules

本文档锁定 v0.22 开发前的产品规则默认值。后续 Main Integrator 和各功能 agent 应以本文档为准，除非产品负责人显式更新本文件。

## 1. MVP 目标

v0.22 的首要目标是跑通一个面向音乐小白的教学闭环，而不是实现完整 DAW。

- 用户完成一段 8 小节音乐片段。
- 教学覆盖打击乐律动、和弦模板、和弦色彩、经过和弦、张力释放和 Lead 即兴演奏。
- Web 端先完整跑通，硬件接入通过统一命令层预留。

## 2. Locked Defaults

- Chord 使用 8 个逻辑键设计，后续实体按键和触控按钮都映射到同一组逻辑键。
- Percussion 底层仍是 16-step matrix；教学文案和新手 UI 可以用 8 个八分位置表达。
- MVP 终点确定为 Lead 即兴演奏完成页。
- Bass 首版只自动生成根音，不进入独立教学流程。
- Export 首版作为占位能力；若现有 WAV export 继续稳定可保留入口，但不作为 v0.22 验收主路径。
- 首版固定 `1=C`、`Ionian`、`4/4`、`120 BPM`。
- 首版打击乐只使用 Kick、Snare、Hihat。

## 3. Tutorial Rules

- Tutorial 使用真实 UI 上的 overlay，不复制一套可操作 UI。
- Tutorial 面板固定在右侧，宽度不超过屏幕宽度的 1/4。
- 操作类步骤完成后不自动跳转，必须由用户点击“下一步”。
- 非目标区域默认允许点击，但需要提示用户回到当前任务。
- 重启教程只重置教学进度，不清空音乐内容。

## 4. Scope Boundaries

- Chord 拖拽可以暂时保留，但不是 v0.22 主交互。
- Chord 新流程以命令/按钮映射为主路径，后续实体按键复用同一命令。
- 一体机硬件输入通过 WebSocket 桥接进入浏览器，但 Phase 1 只定义前端命令契约。
- 高级和声、完整 Bass 教学、专业 DAW 编辑能力、撤销重做、正式导出流程都不进入首版验收。

## 5. Acceptance

功能 agent 可以在不再追问以下问题的情况下开工：

- Chord 逻辑键数量。
- Perc 教学显示 8 格还是 16 格。
- MVP 是否包含 Lead。
- Bass 是否独立教学。
- Export 是否为主线能力。
