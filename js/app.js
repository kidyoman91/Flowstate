/**
 * FLOWSTATE - Main Orchestrator & State Management
 */

// --- Default Preloaded Initial Data for First Launch ---
const DEFAULT_INITIAL_STATE = {
  tasks: [
    {
      id: 'task_sample_1',
      title: 'Finaliser l’architecture du projet & roadmap',
      priority: 'high',
      tag: 'deepwork',
      estimatedPomos: 3,
      completedPomos: 1,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub_1', title: 'Définir les specs clés', completed: true },
        { id: 'sub_2', title: 'Schématiser le flux utilisateur', completed: false },
        { id: 'sub_3', title: 'Validation finale', completed: false }
      ]
    },
    {
      id: 'task_sample_2',
      title: 'Session Deep Work : Rédaction du rapport stratégique',
      priority: 'high',
      tag: 'deepwork',
      estimatedPomos: 2,
      completedPomos: 2,
      completed: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      completedAt: new Date().toISOString(),
      subtasks: []
    },
    {
      id: 'task_sample_3',
      title: 'Préparer la présentation pour le point d’équipe',
      priority: 'medium',
      tag: 'projet',
      estimatedPomos: 2,
      completedPomos: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: []
    },
    {
      id: 'task_sample_4',
      title: 'Trier la boîte mail & archiver les tickets résolus',
      priority: 'low',
      tag: 'admin',
      estimatedPomos: 1,
      completedPomos: 1,
      completed: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      subtasks: []
    },
    {
      id: 'task_sample_5',
      title: 'Méditation guidée & étirements de fin de journée',
      priority: 'low',
      tag: 'perso',
      estimatedPomos: 1,
      completedPomos: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: []
    }
  ],
  schedule: [
    { id: 'b_1', dayIndex: 1, title: 'Deep Work : Architecture & Code', startTime: '09:00', endTime: '11:30', type: 'deepwork' },
    { id: 'b_2', dayIndex: 1, title: 'Point d’équipe synchronisation', startTime: '11:45', endTime: '12:30', type: 'meeting' },
    { id: 'b_3', dayIndex: 1, title: 'Pause déjeuner & marche', startTime: '12:30', endTime: '13:45', type: 'break' },
    { id: 'b_4', dayIndex: 1, title: 'Focus Sprint : Revues & Corrections', startTime: '14:00', endTime: '16:00', type: 'deepwork' },
    { id: 'b_5', dayIndex: 1, title: 'Séance Sport / Cardio', startTime: '18:00', endTime: '19:15', type: 'sport' },

    { id: 'b_6', dayIndex: 2, title: 'Deep Work : Rédaction technique', startTime: '09:00', endTime: '12:00', type: 'deepwork' },
    { id: 'b_7', dayIndex: 3, title: 'Session Créative & Design UI', startTime: '10:00', endTime: '12:30', type: 'deepwork' },
    { id: 'b_8', dayIndex: 4, title: 'Deep Work : Optimisations & Perf', startTime: '09:30', endTime: '12:00', type: 'deepwork' },
    { id: 'b_9', dayIndex: 5, title: 'Bilan Hebdo & Rétrospective', startTime: '15:30', endTime: '17:00', type: 'review' }
  ],
  goals: [
    { id: 'g_1', title: 'Atteindre 15h de Deep Work cette semaine', target: 15, current: 8.5, unit: 'heures', category: 'Focus' },
    { id: 'g_2', title: 'Valider 12 tâches majeures', target: 12, current: 7, unit: 'tâches', category: 'Livrables' },
    { id: 'g_3', title: '3 Séances de sport / bien-être', target: 3, current: 2, unit: 'séances', category: 'Santé' }
  ],
  stats: {
    bestStreak: 7,
    history: {
      // populate last few days to make heatmap look alive and encouraging
      [new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]]: { minutes: 95 },
      [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: { minutes: 120 },
      [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: { minutes: 75 },
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: { minutes: 150 },
      [new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]]: { minutes: 110 },
      [new Date().toISOString().split('T')[0]]: { minutes: 50 }
    }
  }
};

class AppState {
  constructor() {
    const rawUser = localStorage.getItem('flowstate_current_user') || sessionStorage.getItem('flowstate_current_user') || 'adamflowstate';
    this.currentUser = rawUser.trim().toLowerCase();
    this.displayName = localStorage.getItem('flowstate_display_name') || sessionStorage.getItem('flowstate_display_name') || 'Adam';
    this.storageKey = `FLOWSTATE_DATA_${this.currentUser}`;
    this.lastUpdatedAt = null;
    this.load();
  }

  load() {
    try {
      let raw = localStorage.getItem(this.storageKey);

      // Auto-migration for Adam: if FLOWSTATE_DATA_adamflowstate is empty but legacy FLOWSTATE_DATA_V1 exists, migrate it
      if (!raw && this.currentUser === 'adamflowstate') {
        const legacy = localStorage.getItem('FLOWSTATE_DATA_V1');
        if (legacy) {
          raw = legacy;
          localStorage.setItem(this.storageKey, legacy);
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        this.tasks = parsed.tasks || [];
        this.schedule = parsed.schedule || [];
        this.goals = parsed.goals || [];
        this.stats = parsed.stats || { bestStreak: 0, history: {} };
        this.lastUpdatedAt = parsed.lastUpdatedAt || new Date().toISOString();
      } else {
        // Bootstrap defaults for new user or fresh space
        this.tasks = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE.tasks));
        this.schedule = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE.schedule));
        this.goals = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE.goals));
        this.stats = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE.stats));
        this.lastUpdatedAt = new Date().toISOString();
        this.save(false);
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
      this.tasks = [];
      this.schedule = [];
      this.goals = [];
      this.stats = { bestStreak: 0, history: {} };
      this.lastUpdatedAt = new Date().toISOString();
    }
  }

  save(triggerCloudSync = true) {
    try {
      this.lastUpdatedAt = new Date().toISOString();
      const data = {
        tasks: this.tasks,
        schedule: this.schedule,
        goals: this.goals,
        stats: this.stats,
        lastUpdatedAt: this.lastUpdatedAt
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));

      if (triggerCloudSync && window.cloudSync) {
        window.cloudSync.syncToCloud();
      }
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }

  logFocusSession(minutes, intentionTitle) {
    const todayKey = new Date().toISOString().split('T')[0];
    if (!this.stats.history) this.stats.history = {};
    if (!this.stats.history[todayKey]) {
      this.stats.history[todayKey] = { minutes: 0, sessions: 0 };
    }
    this.stats.history[todayKey].minutes += minutes;
    this.stats.history[todayKey].sessions = (this.stats.history[todayKey].sessions || 0) + 1;

    // Increment associated goal if any
    const focusGoal = (this.goals || []).find(g => g.category === 'Focus' || g.unit === 'heures');
    if (focusGoal) {
      focusGoal.current = parseFloat((focusGoal.current + (minutes / 60)).toFixed(1));
    }

    this.save();

    if (window.statsManager) {
      window.statsManager.renderStreakBanner();
      window.statsManager.renderHeatmap();
      window.statsManager.renderWeeklyChart();
      window.statsManager.renderGoals();
    }
    if (window.app) {
      window.app.updateHeaderStats();
    }
  }

  calculateStreak() {
    if (!this.stats || !this.stats.history) return 0;
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const entry = this.stats.history[key];

      if (entry && entry.minutes > 0) {
        streak++;
      } else if (i === 0) {
        // Today might not have a session yet; keep checking yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: this.tasks,
      schedule: this.schedule,
      goals: this.goals,
      stats: this.stats
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `flowstate-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.tasks && Array.isArray(parsed.tasks)) this.tasks = parsed.tasks;
      if (parsed.schedule && Array.isArray(parsed.schedule)) this.schedule = parsed.schedule;
      if (parsed.goals && Array.isArray(parsed.goals)) this.goals = parsed.goals;
      if (parsed.stats && typeof parsed.stats === 'object') this.stats = parsed.stats;
      this.save();
      return true;
    } catch (e) {
      console.error('Import invalide:', e);
      return false;
    }
  }

  resetAll() {
    localStorage.removeItem(this.storageKey);
    this.load();
  }
}

class App {
  constructor() {
    this.currentTab = 'dashboard';
  }

  init() {
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindAmbientDrawer();
    this.bindBackupModal();
    this.preventHorizontalTrackpadBounce();
    this.startClock();
    this.updateUserProfile();
    this.updateGreeting();
    this.updateHeaderStats();

    // Init cloud sync engine
    if (window.cloudSync) window.cloudSync.init();

    // Render modules
    if (window.deepWorkTimer) window.deepWorkTimer.init();
    if (window.taskManager) window.taskManager.init();
    if (window.plannerManager) window.plannerManager.init();
    if (window.statsManager) window.statsManager.init();
  }

  preventHorizontalTrackpadBounce() {
    // Lock horizontal navigation gestures on Mac trackpads so the page never moves horizontally
    window.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8) {
        let el = e.target;
        let allowsScrollX = false;
        while (el && el !== document.body && el !== document.documentElement) {
          const style = window.getComputedStyle(el);
          if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
            allowsScrollX = true;
            break;
          }
          el = el.parentElement;
        }
        if (!allowsScrollX) {
          e.preventDefault();
        }
      }
    }, { passive: false });
  }

  bindNavigation() {
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-target');
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-nav-target') === tabId);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    // Refresh charts if entering stats tab
    if (tabId === 'stats' && window.statsManager) {
      window.statsManager.renderWeeklyChart();
      window.statsManager.renderHeatmap();
    }
  }

  bindHeaderActions() {
    const btnAudioToggle = document.getElementById('btnAudioToggle');
    const audioQuickWidget = document.getElementById('audioQuickWidget');
    const drawer = document.getElementById('ambientDrawer');

    const toggleDrawer = () => {
      if (drawer) drawer.classList.toggle('open');
    };

    if (btnAudioToggle) btnAudioToggle.addEventListener('click', toggleDrawer);
    if (audioQuickWidget) audioQuickWidget.addEventListener('click', toggleDrawer);

    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => drawer.classList.remove('open'));
    }
  }

  bindAmbientDrawer() {
    // Sliders
    ['rain', 'fire', 'drone', 'wind'].forEach(key => {
      const slider = document.getElementById(`slider-${key}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          window.audioEngine.setChannelVolume(key, e.target.value);
        });
      }
    });

    const masterSlider = document.getElementById('slider-master');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        window.audioEngine.setMasterVolume(e.target.value);
      });
    }

    const btnMuteAll = document.getElementById('btnMuteAll');
    if (btnMuteAll) {
      btnMuteAll.addEventListener('click', () => {
        window.audioEngine.muteAll();
        this.showToast('Ambiance sonore coupée');
      });
    }
  }

  bindBackupModal() {
    const btnOpenModal = document.getElementById('btnOpenBackupModal');
    const modalBackdrop = document.getElementById('backupModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnExport = document.getElementById('btnExportJson');
    const btnImport = document.getElementById('btnImportJson');
    const importFileInput = document.getElementById('importFileInput');
    const btnReset = document.getElementById('btnResetData');

    if (btnOpenModal && modalBackdrop) {
      btnOpenModal.addEventListener('click', () => modalBackdrop.classList.add('open'));
    }

    if (btnCloseModal && modalBackdrop) {
      btnCloseModal.addEventListener('click', () => modalBackdrop.classList.remove('open'));
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) modalBackdrop.classList.remove('open');
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        window.appState.exportJson();
        this.showToast('Données exportées au format JSON ! 📥');
      });
    }

    if (btnImport && importFileInput) {
      btnImport.addEventListener('click', () => importFileInput.click());

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = window.appState.importJson(event.target.result);
          if (success) {
            this.showToast('✅ Sauvegarde restaurée avec succès !');
            setTimeout(() => location.reload(), 600);
          } else {
            alert('Fichier JSON invalide.');
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Attention : réinitialiser toutes les données effacera votre historique et restaurera les exemples par défaut. Continuer ?')) {
          window.appState.resetAll();
          location.reload();
        }
      });
    }
  }

  startClock() {
    const clockEl = document.getElementById('liveClockTime');
    const dateEl = document.getElementById('liveClockDate');

    const update = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      }
    };

    update();
    setInterval(update, 1000);
  }

  updateUserProfile() {
    const nameEl = document.getElementById('headerUserName');
    const avatarEl = document.getElementById('headerUserAvatar');
    const dispName = (window.appState && window.appState.displayName) ? window.appState.displayName : 'Adam';
    
    if (nameEl) nameEl.textContent = dispName;
    if (avatarEl) avatarEl.textContent = dispName.charAt(0).toUpperCase();
  }

  updateGreeting() {
    const greetingEl = document.getElementById('dashboardGreeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let text = 'Bonne journée';
    if (hour >= 5 && hour < 12) text = 'Bonjour';
    else if (hour >= 12 && hour < 18) text = 'Bon après-midi';
    else if (hour >= 18 && hour < 23) text = 'Bonne soirée';
    else text = 'Douce nuit & bon focus';

    const dispName = (window.appState && window.appState.displayName) ? window.appState.displayName : '';
    if (dispName) {
      greetingEl.textContent = `${text}, ${dispName} 👋`;
    } else {
      greetingEl.textContent = text;
    }
  }

  updateHeaderStats() {
    const streakNum = window.appState.calculateStreak();
    const streakEl = document.getElementById('headerStreakNum');
    if (streakEl) streakEl.textContent = streakNum;

    const todayKey = new Date().toISOString().split('T')[0];
    const todayMins = (window.appState.stats.history && window.appState.stats.history[todayKey]) ? window.appState.stats.history[todayKey].minutes : 0;
    const todayHours = (todayMins / 60).toFixed(1);

    const todayFocusEl = document.getElementById('metricTodayFocus');
    if (todayFocusEl) todayFocusEl.textContent = `${todayHours}h`;

    const pendingTasks = (window.appState.tasks || []).filter(t => !t.completed).length;
    const completedTasks = (window.appState.tasks || []).filter(t => t.completed).length;

    const metricPendingTasks = document.getElementById('metricPendingTasks');
    if (metricPendingTasks) metricPendingTasks.textContent = pendingTasks;

    const metricDoneTasks = document.getElementById('metricDoneTasks');
    if (metricDoneTasks) metricDoneTasks.textContent = completedTasks;

    // Mini preview in dashboard
    const dashTasksList = document.getElementById('dashRecentTasksList');
    if (dashTasksList) {
      const activeThree = (window.appState.tasks || []).filter(t => !t.completed).slice(0, 3);
      if (activeThree.length === 0) {
        dashTasksList.innerHTML = `<p style="color:var(--text-dim);font-size:0.85rem;">Toutes les tâches actuelles sont terminées ! 🌟</p>`;
      } else {
        dashTasksList.innerHTML = activeThree.map(t => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.8rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);margin-bottom:0.4rem;">
            <span style="font-size:0.88rem;color:var(--text-main);">${escapeHtml(t.title)}</span>
            <button onclick="window.taskManager.startFocusOnTask('${t.id}')" class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;font-size:0.75rem;">Focus 🎯</button>
          </div>
        `).join('');
      }
    }
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

// --- Confetti Micro-Engine ---
class ConfettiHelper {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }

  init() {
    this.canvas = document.getElementById('confettiCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    const colors = ['#f59e0b', '#fbbf24', '#818cf8', '#6366f1', '#ec4899', '#10b981'];
    const count = 70;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.45,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        life: 1
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.vr;
      p.life -= 0.015;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Global instances
window.appState = new AppState();
window.confettiHelper = new ConfettiHelper();
window.app = new App();

document.addEventListener('DOMContentLoaded', () => {
  if (window.authManager) window.authManager.initUI();
  window.confettiHelper.init();
  window.app.init();
});
