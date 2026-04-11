import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import useMusicStore from '../store/useMusicStore';
import audioEngine from '../audio/AudioEngine';
import './ProgressBar.css';

/**
 * ProgressBar — 全局进度条 (Playhead)
 * 重新设计使其与 track-overview 严格对齐 (60px label + grid)
 */
export default function ProgressBar() {
  const currentBar = useMusicStore((s) => s.currentBar);
  const currentStep = useMusicStore((s) => s.currentStep);
  const totalBars = useMusicStore((s) => s.totalBars);
  const stepsPerBar = useMusicStore((s) => s.stepsPerBar);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  
  const dragProgress = useMusicStore((s) => s.dragProgress);
  const setDragProgress = useMusicStore((s) => s.setDragProgress);

  const segmentsRef = useRef(null);

  const handleSeekUpdate = useCallback((e, isRelease = false) => {
    if (!segmentsRef.current) return;
    
    // We want the scrub mapping relative to the grid
    const rect = segmentsRef.current.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX))) - rect.left;
    const width = rect.width;
    
    // allow clicking on the needle, no clamping till step calc
    let progress = Math.max(0, Math.min(1, x / width));

    if (isRelease) {
      // Use latest dragProgress if available, otherwise just use calculated progress
      const finalProgress = useMusicStore.getState().dragProgress ?? progress;
      const totalStepsVal = totalBars * stepsPerBar;
      const targetGlobalStep = Math.floor(finalProgress * totalStepsVal);
      
      const bar = Math.floor(targetGlobalStep / stepsPerBar);
      const step = targetGlobalStep % stepsPerBar;
      
      setDragProgress(null);
      audioEngine.seekToStep(bar, step);
      // Auto-play on scrub release
      audioEngine.play();
    } else {
      setDragProgress(progress);
    }
  }, [totalBars, stepsPerBar, setDragProgress]);

  const onMouseDown = (e) => {
    handleSeekUpdate(e, false);
    const onMouseMove = (me) => handleSeekUpdate(me, false);
    const onMouseUp = (me) => {
        handleSeekUpdate(me, true);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onTouchStart = (e) => {
     handleSeekUpdate(e, false);
     const onTouchMove = (te) => handleSeekUpdate(te, false);
     const onTouchEnd = (te) => {
         handleSeekUpdate(te, true);
         window.removeEventListener('touchmove', onTouchMove);
         window.removeEventListener('touchend', onTouchEnd);
     };
     window.addEventListener('touchmove', onTouchMove);
     window.addEventListener('touchend', onTouchEnd);
  };

  const totalSteps = totalBars * stepsPerBar;
  const currentTotalStep = currentBar * stepsPerBar + currentStep;
  
  // Calculate exact duration of one 16th note step for perfect smoothness
  const bpm = useMusicStore((s) => s.bpm);
  const stepDuration = 60 / bpm / 4;

  // Use drag virtual progress or real engine progress
  const displayProgressPercent = dragProgress !== null 
    ? dragProgress * 100 
    : (currentTotalStep / totalSteps) * 100;

  return (
    <div className="progress-bar" id="progress-bar">
      {/* 占位对齐（左侧的 Track Label 区域）：60px 宽度 */}
      <div className="progress-label-spacer">
         <span className="progress-info">
             {dragProgress !== null ? 'SCRUB' : `BAR ${currentBar + 1}/${totalBars}`}
         </span>
      </div>
      
      {/* 右侧的 Bar Grid 与 Track 对应 */}
      <div 
        className="progress-segments-container" 
        ref={segmentsRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="progress-segments">
          <motion.div 
              className="global-needle"
              animate={{ left: `${displayProgressPercent}%` }}
              transition={{ ease: 'linear', duration: dragProgress !== null ? 0 : stepDuration }}
          >
            <div className="global-needle-head" />
            <div className="global-needle-line" />
          </motion.div>
          
          {Array.from({ length: totalBars }, (_, barIdx) => {
            const isCurrent = barIdx === currentBar;
            const isPast = barIdx < currentBar;
            
            let fillPercent = 0;
            if (dragProgress !== null) {
                // Determine visual fill during dragging
                const dragBarProgress = dragProgress * totalBars;
                if (dragBarProgress > barIdx + 1) fillPercent = 100;
                else if (dragBarProgress > barIdx) fillPercent = (dragBarProgress - barIdx) * 100;
            } else {
                if (isCurrent && isPlaying) {
                   // Needle at the start of step, fill follows
                   fillPercent = (currentStep / stepsPerBar) * 100;
                } else if (isPast) {
                   fillPercent = 100;
                }
            }

            return (
              <div
                key={barIdx}
                className={`progress-light-slot ${isCurrent && dragProgress === null ? 'current' : ''}`}
              >
                <motion.div 
                   className="progress-light-fill"
                   initial={{ width: 0 }}
                   animate={{ width: `${fillPercent}%` }}
                   transition={{ ease: 'linear', duration: dragProgress !== null ? 0 : stepDuration }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
