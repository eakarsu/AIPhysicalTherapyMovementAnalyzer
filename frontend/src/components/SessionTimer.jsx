import React, { useState, useEffect, useRef } from 'react';

function SessionTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showTimer, setShowTimer] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetSeconds = targetMinutes * 60;
  const progress = Math.min((elapsed / targetSeconds) * 100, 100);
  const isOvertime = elapsed > targetSeconds;
  const remaining = targetSeconds - elapsed;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => { setIsRunning(false); setElapsed(0); setSessionNotes(''); };

  if (!showTimer) {
    return (
      <button className="session-timer-toggle" onClick={() => setShowTimer(true)} title="Session Timer">
        <span>&#9201;</span>
      </button>
    );
  }

  return (
    <div className="session-timer-panel">
      <div className="session-timer-header">
        <h3>Session Timer</h3>
        <button className="modal-close-btn" onClick={() => setShowTimer(false)}>&times;</button>
      </div>

      <div className="session-timer-display">
        <div className={`session-timer-time ${isOvertime ? 'session-timer-overtime' : ''}`}>
          {formatTime(elapsed)}
        </div>
        <div className="session-timer-target">
          Target: {targetMinutes} min
          {remaining > 0 ? ` | ${formatTime(remaining)} remaining` : ' | Overtime'}
        </div>
        <div className="session-timer-progress">
          <div
            className="session-timer-progress-bar"
            style={{
              width: `${progress}%`,
              background: isOvertime ? '#dc2626' : progress > 80 ? '#d97706' : '#059669',
            }}
          />
        </div>
      </div>

      <div className="session-timer-target-select">
        <label>Duration (min):</label>
        <div className="session-timer-presets">
          {[30, 45, 60, 90].map(m => (
            <button
              key={m}
              className={`btn btn-sm ${targetMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTargetMinutes(m)}
              disabled={isRunning}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="session-timer-controls">
        {!isRunning ? (
          <button className="btn btn-primary" onClick={handleStart}>
            {elapsed > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={handlePause}>Pause</button>
        )}
        <button className="btn btn-danger" onClick={handleReset} disabled={elapsed === 0}>Reset</button>
      </div>

      <div className="session-timer-notes">
        <label>Session Notes:</label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Quick notes during session..."
          rows="3"
        />
      </div>
    </div>
  );
}

export default SessionTimer;
