import './TutorialOverlay.css';

function getPrimaryLabel(step, isLastStep) {
  if (!step) return '开始';
  if (isLastStep) return '完成';
  return step.completion?.type === 'manual' ? '下一步' : '完成当前步骤后继续';
}

export default function TutorialOverlay({
  step,
  targetRect,
  onNext,
  onSkip,
  onRestart,
  isLastStep = false,
}) {
  if (!step) return null;

  const primaryLabel = getPrimaryLabel(step, isLastStep);
  const hasTarget = Boolean(targetRect);

  return (
    <div className="tutorial-overlay" aria-live="polite">
      <div className="tutorial-mask" />

      {hasTarget && (
        <div
          className="tutorial-target-ring"
          style={{
            '--target-x': `${targetRect.left}px`,
            '--target-y': `${targetRect.top}px`,
            '--target-w': `${targetRect.width}px`,
            '--target-h': `${targetRect.height}px`,
          }}
        />
      )}

      <aside className="tutorial-panel" data-tutorial-panel>
        <div className="tutorial-panel-kicker">Project Arranger v0.22</div>
        <h2 className="tutorial-panel-title">{step.title}</h2>
        <p className="tutorial-panel-prompt">{step.prompt}</p>

        {step.hint && (
          <p className="tutorial-panel-hint">
            {hasTarget ? step.hint : '目标暂时不可见，请先切换到对应轨道或区域。'}
          </p>
        )}

        {step.successMessage && (
          <p className="tutorial-panel-success">{step.successMessage}</p>
        )}

        <div className="tutorial-panel-actions">
          <button className="tutorial-button tutorial-button-primary" type="button" onClick={onNext}>
            {primaryLabel}
          </button>
          <button className="tutorial-button tutorial-button-secondary" type="button" onClick={onSkip}>
            跳过教程
          </button>
          <button className="tutorial-button tutorial-button-ghost" type="button" onClick={onRestart}>
            重新开始
          </button>
        </div>
      </aside>
    </div>
  );
}
