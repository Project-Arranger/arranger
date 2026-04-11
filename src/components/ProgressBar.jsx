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
      <div className="progress-segments">
        {Array.from({ length: totalBars }, (_, barIdx) => {
          const isCurrent = barIdx === currentBar;
          const isPast = barIdx < currentBar;
          
          let fillPercent = 0;
          if (isCurrent && isPlaying) {
             fillPercent = ((currentStep + 1) / stepsPerBar) * 100;
          } else if (isPast) {
             fillPercent = 100;
          }

          return (
            <div
              key={barIdx}
              className={`progress-light-slot ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
            >
              <motion.div 
                 className="progress-light-fill"
                 initial={{ width: 0 }}
                 animate={{ width: `${fillPercent}%` }}
                 transition={{ ease: 'linear', duration: 0.15 }}
              />
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
