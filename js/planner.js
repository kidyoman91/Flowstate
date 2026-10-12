/**
 * FLOWSTATE - Daily Planning & Time Blocking Engine
 */

class PlannerManager {
  constructor() {
    this.startHour = 7;  // 07:00
    this.endHour = 23;   // 23:00
    this.slotHeight = 60; // 60px per hour
    this.selectedDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
    // Map Sunday to 7 so 1 is Monday, 7 is Sunday
    if (this.selectedDayIndex === 0) this.selectedDayIndex = 7;
  }

  init() {
    this.cacheElements();
    this.buildDayPicker();
    this.buildTimelineHours();
    this.bindEvents();
    this.renderBlocks();
    this.startCurrentTimeTicker();
  }

  cacheElements() {
    this.hoursColEl = document.getElementById('timelineHoursCol');
    this.blocksColEl = document.getElementById('timelineBlocksCol');
    this.dayPickerEl = document.getElementById('dayPickerList');
    this.btnAddBlock = document.getElementById('btnAddTimeBlock');
  }

  bindEvents() {
    if (this.btnAddBlock) {
      this.btnAddBlock.addEventListener('click', () => this.promptNewBlock());
    }

    // Double click on blocks column to quickly add block at that hour
    if (this.blocksColEl) {
      this.blocksColEl.addEventListener('dblclick', (e) => {
        const rect = this.blocksColEl.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const clickedHour = Math.floor(offsetY / this.slotHeight) + this.startHour;
        this.promptNewBlock(clickedHour);
      });
    }
  }

  buildDayPicker() {
    if (!this.dayPickerEl) return;
    const days = [
      { id: 1, name: 'LUN', full: 'Lundi' },
      { id: 2, name: 'MAR', full: 'Mardi' },
      { id: 3, name: 'MER', full: 'Mercredi' },
      { id: 4, name: 'JEU', full: 'Jeudi' },
      { id: 5, name: 'VEN', full: 'Vendredi' },
      { id: 6, name: 'SAM', full: 'Samedi' },
      { id: 7, name: 'DIM', full: 'Dimanche' }
    ];

    const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();

    this.dayPickerEl.innerHTML = days.map(d => {
      const isToday = d.id === todayDay;
      const isActive = d.id === this.selectedDayIndex;
      return `
        <button class="day-pill ${isActive ? 'active' : ''}" onclick="window.plannerManager.selectDay(${d.id})" title="${d.full}">
          <span class="day-name">${d.name}</span>
          <span class="day-num">${isToday ? 'Aujourd’hui' : d.full.substring(0, 4)}</span>
        </button>
      `;
    }).join('');
  }

  selectDay(dayId) {
    this.selectedDayIndex = dayId;
    this.buildDayPicker();
    this.renderBlocks();
  }

  buildTimelineHours() {
    if (!this.hoursColEl) return;
    let html = '';
    for (let h = this.startHour; h < this.endHour; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      html += `<div class="time-slot-label">${label}</div>`;
    }
    this.hoursColEl.innerHTML = html;
  }

  startCurrentTimeTicker() {
    this.updateCurrentTimeIndicator();
    setInterval(() => {
      this.updateCurrentTimeIndicator();
    }, 60000); // Check every minute
  }

  updateCurrentTimeIndicator() {
    let line = document.getElementById('timelineCurrentTimeLine');
    const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();

    // Only show live indicator if looking at today
    if (this.selectedDayIndex !== todayDay) {
      if (line) line.style.display = 'none';
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (currentHour < this.startHour || currentHour >= this.endHour) {
      if (line) line.style.display = 'none';
      return;
    }

    if (!line) {
      line = document.createElement('div');
      line.id = 'timelineCurrentTimeLine';
      line.className = 'timeline-current-time-line';
      if (this.blocksColEl) this.blocksColEl.appendChild(line);
    }

    line.style.display = 'block';
    const totalMinutesFromStart = ((currentHour - this.startHour) * 60) + currentMin;
    const topPx = (totalMinutesFromStart / 60) * this.slotHeight;
    line.style.top = `${topPx}px`;
  }

  promptNewBlock(defaultStartHour = 9) {
    const title = prompt('Titre du bloc temporel :', 'Deep Work : Architecture');
    if (!title || !title.trim()) return;

    const start = prompt('Heure de début (format HH:MM) :', `${String(defaultStartHour).padStart(2, '0')}:00`);
    if (!start) return;

    const end = prompt('Heure de fin (format HH:MM) :', `${String(defaultStartHour + 1).padStart(2, '0')}:30`);
    if (!end) return;

    const type = prompt('Catégorie (deepwork / meeting / sport / break / review) :', 'deepwork') || 'deepwork';

    const newBlock = {
      id: 'block_' + Date.now(),
      dayIndex: this.selectedDayIndex,
      title: title.trim(),
      startTime: start.trim(),
      endTime: end.trim(),
      type: type.toLowerCase()
    };

    if (!window.appState.schedule) window.appState.schedule = [];
    window.appState.schedule.push(newBlock);
    window.appState.save();
    this.renderBlocks();
    if (window.app) window.app.showToast('Bloc de temps programmé ! 📅');
  }

  deleteBlock(blockId) {
    if (!window.appState.schedule) return;
    window.appState.schedule = window.appState.schedule.filter(b => b.id !== blockId);
    window.appState.save();
    this.renderBlocks();
  }

  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  }

  renderBlocks() {
    if (!this.blocksColEl) return;

    // Preserve the current time line if present
    const existingLine = document.getElementById('timelineCurrentTimeLine');

    // Guidelines background
    let bgHtml = '';
    const totalSlots = this.endHour - this.startHour;
    for (let i = 0; i < totalSlots; i++) {
      bgHtml += `<div class="timeline-hour-guideline" style="top: ${i * this.slotHeight}px;"></div>`;
    }

    const dayBlocks = (window.appState.schedule || []).filter(b => b.dayIndex === this.selectedDayIndex);

    const typeClasses = {
      deepwork: 'b-deepwork',
      meeting: 'b-meeting',
      sport: 'b-sport',
      break: 'b-break',
      review: 'b-review'
    };

    const typeIcons = {
      deepwork: '🎯',
      meeting: '👥',
      sport: '⚡',
      break: '☕',
      review: '🔍'
    };

    const blocksHtml = dayBlocks.map(block => {
      const startMin = this.timeToMinutes(block.startTime);
      const endMin = this.timeToMinutes(block.endTime);
      const startLimitMin = this.startHour * 60;

      const topPx = ((startMin - startLimitMin) / 60) * this.slotHeight;
      const heightPx = Math.max(38, ((endMin - startMin) / 60) * this.slotHeight);

      const typeClass = typeClasses[block.type] || 'b-deepwork';
      const icon = typeIcons[block.type] || '📌';

      return `
        <div class="plan-block ${typeClass}" style="top: ${topPx}px; height: ${heightPx}px;" onclick="window.plannerManager.handleBlockClick('${block.id}')" title="Cliquez pour supprimer ou gérer">
          <div>
            <div class="plan-block-title">${icon} ${escapeHtml(block.title)}</div>
          </div>
          <div class="plan-block-time">${block.startTime} - ${block.endTime}</div>
        </div>
      `;
    }).join('');

    this.blocksColEl.innerHTML = bgHtml + blocksHtml;
    if (existingLine) {
      this.blocksColEl.appendChild(existingLine);
    }
    this.updateCurrentTimeIndicator();
  }

  handleBlockClick(blockId) {
    const block = (window.appState.schedule || []).find(b => b.id === blockId);
    if (!block) return;

    if (confirm(`Voulez-vous supprimer le bloc "${block.title}" (${block.startTime} - ${block.endTime}) ?`)) {
      this.deleteBlock(blockId);
      if (window.app) window.app.showToast('Bloc supprimé.');
    }
  }
}

window.plannerManager = new PlannerManager();
