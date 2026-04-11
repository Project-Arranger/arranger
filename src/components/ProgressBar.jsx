import { motion } from 'framer-motion';
import useMusicStore from '../store/useMusicStore';
import './ProgressBar.css';

/**
 * ProgressBar — 全局进度条 (Playhead)
 * 渲染一条极细、发光的垂直线穿越 8 小节格子。
 */
export default function ProgressBar() {
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const totalBars = useMusicStore((s) => s.totalBars);
  const stepsPerBar = useMusicStore((s) => s.stepsPerBar);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  // 计算全局线性的播放百分比
  const totalSteps = totalBars * stepsPerBar;
  const currentTotalStep = currentBar * stepsPerBar + currentStep;
  const progressPercent = (currentTotalStep / totalSteps) * 100;

  return (
    <div className="progress-bar" id="progress-bar">
      <div className="progress-segments" style={{ position: 'relative' }}>
        
        {/* The Frame Motion Playhead Line */}
        {isPlaying && (
          <motion.div
            className="global-playhead-line"
            animate={{ left: `${progressPercent}%` }}
            transition={{ ease: 'linear', duration: 0.15 }}
          />
        )}

        {/* The Bar Segments grid */}
        {Array.from({ length: totalBars }, (_, barIdx) => {
          const isCurrent = barIdx === currentBar;
          
          return (
            <div
              key={barIdx}
              className={`progress-segment ${isCurrent ? 'current' : ''}`}
            >
              <span className="progress-segment-label">{barIdx + 1}</span>
            </div>
          );
        })}
      </div>
      <span className="progress-info">
        BAR {currentBar + 1}/{totalBars}
      </span>
    </div>
  );
}
