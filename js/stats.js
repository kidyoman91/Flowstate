/**
 * FLOWSTATE - Statistics, Streaks, Heatmap & Weekly Goals
 */

class StatsManager {
  constructor() {}

  init() {
    this.renderStreakBanner();
    this.renderHeatmap();
    this.renderWeeklyChart();
    this.renderGoals();
    this.bindEvents();
  }

  bindEvents() {
    const btnAddGoal = document.getElementById('btnAddWeeklyGoal');
    if (btnAddGoal) {
      btnAddGoal.addEventListener('click', () => this.promptNewGoal());
    }
  }

  renderStreakBanner() {
    const streakEl = document.getElementById('streakLargeNum');
    const bestStreakEl = document.getElementById('bestStreakNum');
    const totalHoursEl = document.getElementById('totalFocusHours');

    const streak = window.appState.calculateStreak();
    const best = window.appState.stats.bestStreak || streak;
    if (streak > best) window.appState.stats.bestStreak = streak;

    if (streakEl) streakEl.textContent = streak;
    if (bestStreakEl) bestStreakEl.textContent = `${window.appState.stats.bestStreak} jours`;

    const totalMinutes = Object.values(window.appState.stats.history || {}).reduce((acc, v) => acc + (v.minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    if (totalHoursEl) totalHoursEl.textContent = `${totalHours} h`;
  }

  renderHeatmap() {
    const container = document.getElementById('activityHeatmapGrid');
    if (!container) return;

    // Generate last 30 days
    const cells = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const entry = (window.appState.stats.history && window.appState.stats.history[dateKey]) || { minutes: 0 };

      // Determine level from 0 to 4
      let level = 0;
      if (entry.minutes > 0 && entry.minutes < 30) level = 1;
      else if (entry.minutes >= 30 && entry.minutes < 60) level = 2;
      else if (entry.minutes >= 60 && entry.minutes < 120) level = 3;
      else if (entry.minutes >= 120) level = 4;

      const dateDisplay = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      cells.push(`
        <div class="heatmap-cell" data-level="${level}" title="${dateDisplay} : ${entry.minutes} min de Deep Work"></div>
      `);
    }

    container.innerHTML = cells.join('');
  }

  renderWeeklyChart() {
    const chartWrap = document.getElementById('weeklyChartWrap');
    if (!chartWrap) return;

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const now = new Date();
    // Monday of current week
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 is Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const weekData = [];
    let maxMin = 60; // minimum scale

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const mins = (window.appState.stats.history && window.appState.stats.history[key]) ? window.appState.stats.history[key].minutes : 0;
      if (mins > maxMin) maxMin = mins;
      weekData.push({ label: days[i], minutes: mins, isToday: i === dayOfWeek });
    }

    // Build SVG bar chart
    const svgWidth = 560;
    const svgHeight = 160;
    const barWidth = 38;
    const gap = (svgWidth - (7 * barWidth)) / 8;

    const bars = weekData.map((d, index) => {
      const x = gap + index * (barWidth + gap);
      const barHeight = Math.max(6, (d.minutes / maxMin) * (svgHeight - 40));
      const y = svgHeight - 25 - barHeight;
      const fill = d.isToday ? 'url(#barGradientAmber)' : 'rgba(255, 255, 255, 0.12)';
      const textFill = d.isToday ? 'var(--accent-amber-light)' : 'var(--text-dim)';
      const fontW = d.isToday ? '700' : '500';

      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${fill}" />
          <text x="${x + barWidth / 2}" y="${y - 6}" font-family="var(--font-mono)" font-size="10" fill="var(--text-muted)" text-anchor="middle">${d.minutes}m</text>
          <text x="${x + barWidth / 2}" y="${svgHeight - 8}" font-family="var(--font-sans)" font-size="11" font-weight="${fontW}" fill="${textFill}" text-anchor="middle">${d.label}</text>
        </g>
      `;
    }).join('');

    chartWrap.innerHTML = `
      <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <defs>
          <linearGradient id="barGradientAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#EA580C" />
          </linearGradient>
        </defs>
        ${bars}
      </svg>
    `;
  }

  renderGoals() {
    const goalsListEl = document.getElementById('weeklyGoalsList');
    if (!goalsListEl) return;

    const goals = window.appState.goals || [];

    if (goals.length === 0) {
      goalsListEl.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-dim);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
          <p>Aucun objectif défini pour cette semaine.</p>
        </div>
      `;
      return;
    }

    goalsListEl.innerHTML = goals.map(goal => {
      const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
      return `
        <div class="goal-card">
          <div class="goal-header">
            <span class="goal-title">${escapeHtml(goal.title)}</span>
            <span class="goal-progress-badge">${goal.current} / ${goal.target} ${goal.unit} (${pct}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="goal-footer">
            <span>Catégorie : <strong>${escapeHtml(goal.category || 'Productivité')}</strong></span>
            <div style="display: flex; gap: 0.4rem;">
              <button onclick="window.statsManager.stepGoal('${goal.id}', -1)" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.6rem;">-1</button>
              <button onclick="window.statsManager.stepGoal('${goal.id}', 1)" class="btn btn-primary btn-sm" style="padding: 0.2rem 0.6rem;">+1</button>
              <button onclick="window.statsManager.deleteGoal('${goal.id}')" class="btn btn-ghost btn-sm" style="padding: 0.2rem 0.4rem;" title="Supprimer">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  stepGoal(goalId, step) {
    const goal = (window.appState.goals || []).find(g => g.id === goalId);
    if (!goal) return;

    goal.current = Math.max(0, goal.current + step);
    if (goal.current >= goal.target && step > 0) {
      if (window.confettiHelper) window.confettiHelper.fire();
      window.audioEngine.playTaskCompletion();
      if (window.app) window.app.showToast(`🎉 Objectif "${goal.title}" atteint ! Félicitations !`);
    }

    window.appState.save();
    this.renderGoals();
  }

  deleteGoal(goalId) {
    window.appState.goals = (window.appState.goals || []).filter(g => g.id !== goalId);
    window.appState.save();
    this.renderGoals();
  }

  promptNewGoal() {
    const title = prompt('Intitulé de l’objectif hebdomadaire :', '15h de Deep Work');
    if (!title || !title.trim()) return;

    const targetStr = prompt('Objectif cible (nombre) :', '15');
    const target = parseInt(targetStr, 10) || 10;

    const unit = prompt('Unité (heures, sessions, tâches) :', 'heures') || 'heures';

    const newGoal = {
      id: 'goal_' + Date.now(),
      title: title.trim(),
      target: target,
      current: 0,
      unit: unit.trim(),
      category: 'Priorité Hebdo'
    };

    if (!window.appState.goals) window.appState.goals = [];
    window.appState.goals.push(newGoal);
    window.appState.save();
    this.renderGoals();
    if (window.app) window.app.showToast('Nouvel objectif configuré ! 🚀');
  }
}

window.statsManager = new StatsManager();
