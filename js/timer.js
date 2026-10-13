/**
 * FLOWSTATE - Deep Work Studio & Timer Engine
 */

class DeepWorkTimer {
  constructor() {
    this.modes = {
      deepwork: { name: 'Deep Work', workMin: 50, breakMin: 10 },
      pomodoro: { name: 'Pomodoro', workMin: 25, breakMin: 5 },
      ultradian: { name: 'Sprint 90', workMin: 90, breakMin: 20 },
      custom: { name: 'Sur-mesure', workMin: 45, breakMin: 15 }
    };

    this.currentMode = 'deepwork';
    this.isBreak = false;
    this.cycleCount = 1;

    this.totalSeconds = 50 * 60;
    this.remainingSeconds = 50 * 60;
    this.targetEndTime = null;
    this.isRunning = false;
    this.intervalId = null;

    this.activeTask = null;

    // SVG Circle constants (r = 140, circumference = 2 * PI * 140 ~= 879.64)
    this.circumference = 2 * Math.PI * 140;
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setMode('deepwork');
    this.updateDisplay();
  }

  cacheElements() {
    this.countdownEl = document.getElementById('timerCountdown');
    this.sessionLabelEl = document.getElementById('timerSessionLabel');
    this.cycleLabelEl = document.getElementById('timerCycleLabel');
    this.progressCircleEl = document.getElementById('timerProgressCircle');
    this.btnPlay = document.getElementById('btnTimerPlay');
    this.btnReset = document.getElementById('btnTimerReset');
    this.btnSkip = document.getElementById('btnTimerSkip');
    this.btnZen = document.getElementById('btnTimerZen');
    this.btnStandby = document.getElementById('btnTimerStandby');
    this.btnExitStandby = document.getElementById('btnExitStandby');
    this.intentionTextEl = document.getElementById('intentionTaskName');

    if (this.progressCircleEl) {
      this.progressCircleEl.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
      this.progressCircleEl.style.strokeDashoffset = '0';
    }
  }

  bindEvents() {
    // Mode buttons
    document.querySelectorAll('[data-timer-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.getAttribute('data-timer-mode');
        this.setMode(mode);
      });
    });

    if (this.btnPlay) this.btnPlay.addEventListener('click', () => this.toggle());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.reset());
    if (this.btnSkip) this.btnSkip.addEventListener('click', () => this.skip());
    if (this.btnZen) this.btnZen.addEventListener('click', () => this.toggleZenMode());
    if (this.btnStandby) this.btnStandby.addEventListener('click', () => this.toggleStandbyMode());
    if (this.btnExitStandby) this.btnExitStandby.addEventListener('click', () => this.toggleStandbyMode(false));

    // Request notification permission smoothly
    if ('Notification' in window && Notification.permission === 'default') {
      window.addEventListener('click', () => {
        Notification.requestPermission();
      }, { once: true });
    }

    // Background tab & app switch auto-sync:
    // Browser tabs aggressively throttle setInterval in the background.
    // By re-syncing against targetEndTime on visibilitychange, focus and pageshow,
    // the timer is ALWAYS 100% accurate down to the second when returning to the tab.
    const resyncTimer = () => {
      if (this.isRunning && this.targetEndTime) {
        this.tick();
      }
    };
    document.addEventListener('visibilitychange', resyncTimer);
    window.addEventListener('focus', resyncTimer);
    window.addEventListener('pageshow', resyncTimer);
  }

  setMode(modeKey) {
    if (this.isRunning) {
      if (!confirm('Une session est en cours. Changer de mode réinitialisera le timer. Continuer ?')) {
        return;
      }
      this.pause();
    }

    this.currentMode = modeKey;
    this.isBreak = false;
    const modeConfig = this.modes[modeKey] || this.modes.deepwork;

    this.totalSeconds = modeConfig.workMin * 60;
    this.remainingSeconds = this.totalSeconds;
    this.targetEndTime = null;

    // Update active tab styles
    document.querySelectorAll('[data-timer-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-timer-mode') === modeKey);
    });

    this.updateDisplay();
  }

  toggle() {
    window.audioEngine.ensureContext();
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.targetEndTime = Date.now() + (this.remainingSeconds * 1000);
    this.updatePlayBtnState(true);

    // Run tick immediately
    this.tick();

    // Check frequently (250ms) to update display precisely
    this.intervalId = setInterval(() => {
      this.tick();
    }, 250);
  }

  pause() {
    if (this.isRunning && this.targetEndTime) {
      const now = Date.now();
      this.remainingSeconds = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));
    }
    this.isRunning = false;
    this.targetEndTime = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updatePlayBtnState(false);
    this.updateDisplay();
  }

  reset() {
    this.pause();
    const modeConfig = this.modes[this.currentMode];
    this.totalSeconds = (this.isBreak ? modeConfig.breakMin : modeConfig.workMin) * 60;
    this.remainingSeconds = this.totalSeconds;
    this.targetEndTime = null;
    this.updateDisplay();
  }

  skip() {
    this.pause();
    this.completeSession(true);
  }

  tick() {
    if (!this.isRunning || !this.targetEndTime) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));

    if (remaining !== this.remainingSeconds) {
      this.remainingSeconds = remaining;
      this.updateDisplay();
    }

    if (remaining <= 0) {
      this.completeSession(false);
    }
  }

  completeSession(isSkipped = false) {
    this.pause();

    if (!isSkipped) {
      // Play Zen Singing Bowl sound chime!
      window.audioEngine.playZenBowl();

      // Trigger Confetti effect
      if (window.confettiHelper) {
        window.confettiHelper.fire();
      }

      if (!this.isBreak) {
        // Log completed work session to app stats
        const minutesLogged = this.modes[this.currentMode].workMin;
        if (window.appState) {
          window.appState.logFocusSession(minutesLogged, this.activeTask ? this.activeTask.title : 'Session Libre');
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Deep Work terminée ! 🎯', {
            body: 'Bravo ! Prends un instant pour respirer et t’étirer.',
            icon: 'favicon.ico'
          });
        }
        if (window.app) window.app.showToast('🎯 Session Deep Work terminée avec brio !');
      } else {
        if (window.app) window.app.showToast('☕ Pause terminée ! Prêt à replonger en focus ?');
      }
    }

    // Switch mode between work and break
    this.isBreak = !this.isBreak;
    const modeConfig = this.modes[this.currentMode];
    if (this.isBreak) {
      this.totalSeconds = modeConfig.breakMin * 60;
    } else {
      this.cycleCount++;
      this.totalSeconds = modeConfig.workMin * 60;
    }
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.countdownEl) {
      this.countdownEl.textContent = timeStr;
    }

    // Update document title for easy multitasking tab view
    const statusLabel = this.isBreak ? '☕ Pause' : '🎯 Focus';
    document.title = `${timeStr} - ${statusLabel} | Flowstate`;

    if (this.sessionLabelEl) {
      this.sessionLabelEl.textContent = this.isBreak ? '☕ Temps de Pause & Détente' : `🎯 ${this.modes[this.currentMode].name} en cours`;
      this.sessionLabelEl.style.color = this.isBreak ? 'var(--accent-emerald)' : 'var(--accent-amber-light)';
    }

    if (this.cycleLabelEl) {
      this.cycleLabelEl.textContent = `Cycle #${this.cycleCount}`;
    }

    // Circular SVG progress bar offset
    if (this.progressCircleEl && this.totalSeconds > 0) {
      const progressRatio = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
      const offset = this.circumference - (progressRatio * this.circumference);
      this.progressCircleEl.style.strokeDashoffset = offset;
    }
  }

  updatePlayBtnState(isPlaying) {
    if (!this.btnPlay) return;
    if (isPlaying) {
      this.btnPlay.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
      `;
      this.btnPlay.setAttribute('title', 'Pause');
    } else {
      this.btnPlay.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      `;
      this.btnPlay.setAttribute('title', 'Démarrer');
    }
  }

  setActiveTask(task) {
    this.activeTask = task;
    if (this.intentionTextEl) {
      this.intentionTextEl.textContent = task ? task.title : 'Session libre (aucun objectif spécifique lié)';
    }
  }

  toggleZenMode() {
    document.body.classList.toggle('zen-active');
    const isZen = document.body.classList.contains('zen-active');
    if (isZen) {
      if (window.app) window.app.showToast('Mode Zen activé. Appuyez sur Echap pour quitter.');
    }
  }

  async toggleStandbyMode(forceState) {
    const shouldActivate = forceState !== undefined ? forceState : !document.body.classList.contains('standby-mode-active');
    document.body.classList.toggle('standby-mode-active', shouldActivate);

    if (shouldActivate) {
      if (window.app) window.app.showToast('📱 Mode Horloge de Bureau actif (l’écran reste allumé)');
      // Request Screen Wake Lock so iPhone screen does not turn off
      if ('wakeLock' in navigator) {
        try {
          this.wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('WakeLock non disponible:', err);
        }
      }
    } else {
      if (this.wakeLockSentinel) {
        try {
          await this.wakeLockSentinel.release();
          this.wakeLockSentinel = null;
        } catch (e) {}
      }
    }
  }
}

// Global Keyboard shortcuts for Desktop:
// - Space: Toggle Start/Pause (if not focused on an input)
// - Escape: Exit Zen or Standby mode
window.addEventListener('keydown', (e) => {
  // ESC exits Zen / Standby
  if (e.key === 'Escape') {
    if (document.body.classList.contains('standby-mode-active')) {
      window.deepWorkTimer.toggleStandbyMode(false);
    }
    if (document.body.classList.contains('zen-active')) {
      document.body.classList.remove('zen-active');
    }
    return;
  }

  // Spacebar toggles timer play/pause on desktop (if user isn't typing in an input)
  if (e.code === 'Space') {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      e.preventDefault();
      window.deepWorkTimer.toggle();
    }
  }
});

window.deepWorkTimer = new DeepWorkTimer();
