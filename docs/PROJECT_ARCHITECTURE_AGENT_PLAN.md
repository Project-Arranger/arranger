# Project Arranger v0.22 架构与多 Agent 开发计划

## 1. 项目目标

Project Arranger v0.22 是一个面向音乐小白的 Web 音乐创作工具，最终运行在嵌入式一体机中。

首版目标不是做完整 DAW，而是做一个有明确教学路径、强正反馈、可触控、可接实体按键的音乐创作体验：

- 用户能通过教学流程完成一段 8 小节音乐片段。
- 用户能理解并体验打击乐律动、和弦进行、和弦色彩变化、Lead 即兴演奏。
- Web 端先跑通完整体验，后续通过硬件桥接接入一体机按键。
- 当前项目继续使用，不重新开项目。

## 2. 技术栈

### 前端

- Vite
- React
- Zustand
- Tone.js
- Framer Motion
- CSS Modules / 普通 CSS
- 后续新模块可逐步引入 TypeScript

### 音频

使用 Tone.js 管理：

- Transport
- BPM
- Loop
- 采样器
- 实时预览
- 离线导出能力预留

### 状态管理

继续使用 Zustand，但建议拆分为更清晰的领域：

- `musicStore`
- `tutorialStore`
- `inputStore`
- `projectStore`

### 硬件接入

首版 Web 端使用统一输入命令层。

未来一体机实体按键通过本地服务接入：

```ts
type HardwareInputEvent = {
  type: 'button';
  id: string;
  action: 'down' | 'up' | 'hold';
  ts: number;
};
```

前端只消费统一命令：

```ts
type AppCommand =
  | { type: 'transport.togglePlay' }
  | { type: 'transport.stop' }
  | { type: 'transport.seek'; bar: number; step: number }
  | { type: 'tutorial.next' }
  | { type: 'tutorial.completeTask' }
  | { type: 'perc.toggle'; bar: number; step: number; instrument: 'kick' | 'snare' | 'hihat' }
  | { type: 'chord.selectOption'; optionIndex: number }
  | { type: 'chord.confirm' }
  | { type: 'lead.noteOn'; note: string }
  | { type: 'lead.noteOff'; note: string };
```

## 3. 新架构

### 3.1 App Shell

负责整体界面结构：

- Top Bar
- 全局音轨区
- 左侧轨道栏
- 底部音轨编辑区
- 教学提示区
- 高亮与任务遮罩

概念 HTML 里的设计系统和布局可以作为 UI 参考，但不直接作为工程基底。

### 3.2 Tutorial Engine

负责教学流程：

- 当前步骤
- 当前任务文案
- 可交互目标
- 完成条件
- 自动播放/回放
- Step 跳转

推荐配置结构：

```ts
type TutorialStep = {
  id: string;
  track: 'intro' | 'perc' | 'chord' | 'lead';
  prompt: string;
  target?: {
    trackId: string;
    bar?: number;
    step?: number;
    instrument?: string;
  };
  completion: 'manual' | 'cell-count' | 'chord-choice' | 'lead-play';
  playback?: {
    bars: number[];
    autoStart: boolean;
  };
};
```

### 3.3 Music Store

保留当前矩阵模型：

- 8 小节
- 每小节 16 step
- 四轨：
  - Chord
  - Bass
  - Perc
  - Lead

但需要把 store 里的职责拆清楚：

- transport 状态
- matrix 数据
- track selection
- chord actions
- percussion actions
- lead actions
- project persistence

### 3.4 Input Adapter

所有输入统一进入 Input Adapter：

- 触摸
- 鼠标
- 键盘
- 未来实体按键
- WebSocket 硬件事件

组件不直接判断输入来源，只响应 `AppCommand`。

### 3.5 Chord Composer

Chord 部分从拖拽改成“实体按键一对一匹配”的交互。

保留：

- `CHORD_LIBRARY`
- 和弦 notes
- Tone.js 预览
- 矩阵写入
- 播放调度

替换：

- ChordPalette 拖拽
- ChordTrack drop target
- drag ghost
- 自定义 drag event 作为主路径

新的 Chord 流程：

1. 选择和弦模板。
2. 自动写入 Chord 轨。
3. 按键选择单体和弦变体。
4. 按键选择经过和弦。
5. 按键选择张力释放和弦。
6. 每次选择后立即试听，确认后写入。

### 3.6 Audio Engine

继续使用当前 `AudioEngine`，补充：

- 和弦琶音预览
- 教学任务完成后的指定小节回放
- Lead 即兴实时 note on/off
- 音频初始化状态提示
- 采样加载失败 fallback

### 3.7 Persistence

首版建议本地保存：

- matrix
- 当前 tutorial step
- BPM
- root key
- scale
- volume
- updatedAt

数据结构：

```ts
type SavedProject = {
  version: 1;
  matrix: unknown;
  tutorialStepId: string;
  bpm: 120;
  rootKey: 'C';
  scale: 'Ionian';
  volumes: Record<string, number>;
  updatedAt: string;
};
```

## 4. Agent 分工

### Main Integrator

负责总控和集成。

职责：

- 维护架构边界
- 定义共享接口
- 合并各 agent 输出
- 处理 store/API 冲突
- 保证最终流程跑通
- 维护开发文档

不建议把 Main Integrator 分出去，应该由主会话掌控。

### Agent 1: Design System + Shell UI

负责 UI 壳层。

范围：

- 设计 token
- Top Bar
- 左侧轨道栏
- 全局音轨区
- 底部编辑区容器
- 概念 HTML 视觉迁移

主要文件：

- `src/styles/*`
- `src/components/MainComposerView.*`
- `src/components/TransportBar.*`
- `src/components/TrackRow.*`
- `src/components/ContextArea.*`

### Agent 2: Tutorial Engine

负责教学系统。

范围：

- tutorial step config
- 当前任务状态
- 任务完成条件
- 高亮系统
- 任务提示 UI
- step transition

主要文件：

- `src/tutorial/*`
- `src/components/TutorialOverlay.*`
- tutorial store slice

### Agent 3: Percussion Workflow

负责打击乐流程。

范围：

- 16-step drum grid
- Kick/Snare/Hihat 三行
- 自动基础律动
- v0.22 四个打击乐任务
- 点击、拖动、任务校验
- 点击后声音反馈

主要文件：

- `src/components/PercMatrix.*`
- `src/data/percNotes.js`
- percussion store actions

### Agent 4: Chord Composer

负责新的 Chord 交互。

范围：

- 替换拖拽式 Chord 主流程
- 模板选择
- 和弦变体
- 经过和弦
- 张力释放
- 按键一对一匹配
- 触控等价按钮

主要文件：

- `src/components/ChordComposer.*`
- `src/components/ChordTrack.*`
- `src/data/chords.js`
- chord store actions

### Agent 5: Input + Hardware Adapter

负责输入抽象层。

范围：

- command dispatcher
- keyboard mapping
- touch command mapping
- hardware WebSocket client
- browser mock hardware panel
- 断线 fallback

主要文件：

- `src/input/*`
- `src/hardware/*`
- app root integration hook

### Agent 6: Audio + Persistence

负责音频能力和本地保存。

范围：

- Tone.js preview API
- chord arpeggio preview
- task playback
- lead noteOn/noteOff
- IndexedDB save/restore
- app reload recovery

主要文件：

- `src/audio/AudioEngine.js`
- `src/storage/*`
- project store actions

### Agent 7: QA / Verification

负责测试和验收。

范围：

- 完整教学路径测试
- input command 测试
- persistence 测试
- audio smoke test
- Kiosk checklist
- mock hardware test

主要文件：

- `tests/*`
- `docs/QA_CHECKLIST.md`
- Playwright config if needed

## 5. 开发阶段

### Phase 0: 产品规则锁定

预计：1-2 天

必须确认：

- Chord 实体按键数量
- Chord 每个任务阶段的按键映射
- 打击乐 UI 显示 8 格还是 16 格
- MVP 到 Step 3 还是 Step 4
- Bass 是否进入首版
- Export 是否只是占位

建议默认：

- Chord 先按 8 个逻辑键设计。
- 打击乐底层 16 step，教学文案可用 8 个八分位置表达。
- 首版做到 Lead 即兴演奏。
- Bass 先自动生成根音，不做完整教学。
- Export 暂时占位。

### Phase 1: 架构脚手架

预计：2-3 天

产出：

- 统一命令类型
- tutorial step 类型
- store slice 边界
- design token 文件
- Input Adapter 初版
- 目录结构稳定

### Phase 2: 并行功能开发

预计：8-14 天

并行 agent：

- Agent 1: UI Shell
- Agent 2: Tutorial Engine
- Agent 3: Percussion
- Agent 4: Chord Composer
- Agent 5: Input Adapter
- Agent 6: Audio + Persistence

主控每 1-2 天集成一次，避免分支漂移。

### Phase 3: 集成

预计：4-7 天

重点：

- Tutorial Engine 连接 Perc/Chord/Lead
- Chord 新流程替换旧拖拽主路径
- Input Adapter 接入真实 UI
- 任务完成后自动回放
- 本地保存恢复
- 修正交互冲突

### Phase 4: QA + Kiosk Ready

预计：4-7 天

重点：

- 完整流程测试
- 静态 build 测试
- Chromium Kiosk 测试
- 离线资源测试
- 音频初始化测试
- mock hardware 测试
- 性能和触控体验检查

## 6. 测试计划

### Unit Test

- tutorial step transition
- task completion condition
- input event to AppCommand
- chord option selection
- percussion valid/invalid cell
- persistence serialization

### Component Test

- Top Bar
- Track Row
- Perc Matrix
- Chord Composer
- Tutorial Overlay
- Lead performance panel

### E2E Test

完整路径：

1. 进入开场。
2. 点击开始创造。
3. 完成 UI 区域介绍。
4. 完成打击乐任务 1-4。
5. 进入 Chord 模板选择。
6. 选择 Doo-wop Progression。
7. 替换 4 个和弦色彩。
8. 添加经过和弦。
9. 添加张力释放和弦。
10. 进入 Lead 即兴演奏。
11. 刷新页面后恢复进度。

### Audio Smoke Test

- 采样能加载。
- 播放/暂停正常。
- Loop 正常。
- 点击格子能预览声音。
- Chord 预览正常。
- Lead 即时演奏正常。
- 自动回放不会卡死 UI。

### Kiosk Test

- 静态 build 可运行。
- 无 CDN 依赖。
- 横屏布局不溢出。
- 触控目标足够大。
- 刷新后恢复工程。
- 硬件 WebSocket 断线时不影响触控操作。

## 7. 关键假设

- 当前项目继续使用，不重开项目。
- Chord 拖拽不是新 MVP 的主交互。
- Chord 数据和音频逻辑可以复用。
- 一体机最终使用 Chromium Kiosk。
- 硬件输入通过 WebSocket 桥接进入浏览器。
- 首版固定 `1=C`、`Ionian`、`4/4`、`120 BPM`。
- 首版打击乐只使用 Kick/Snare/Hihat。
- 首版重点是完成教学闭环，不做完整专业 DAW。

## 8. 开发前仍需确认的问题

### P0

- Chord 实体按键数量。
- Chord 每个阶段的一对一按键映射。
- 打击乐教学中“第 2/4/6/8 格”与 16-step UI 的展示方式。
- MVP 终点是否确定为 Lead 即兴演奏。

### P1

- Bass 是否进入首版教学。
- Export 是否占位。
- 是否需要撤销/重做。
- 教学中用户是否允许自由编辑非目标区域。
- 自动回放时用户能否继续操作。

### P2

- 和弦模板代表曲目是否补齐。
- Axis Progression 最终级数。
- `Amaj7` 是否应改为 `Am7`。
- 高级和声是否进入后续课程。
