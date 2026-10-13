/**
 * FLOWSTATE - Tasks & To-Do List Management
 * Includes full task modal, dynamic subtasks, and calendar integration
 */

class TaskManager {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.modalSubtasks = [];
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.render();
  }

  cacheElements() {
    this.taskListEl = document.getElementById('taskList');
    this.taskInputEl = document.getElementById('taskMainInput');
    this.taskPrioritySelect = document.getElementById('taskPrioritySelect');
    this.taskCategorySelect = document.getElementById('taskCategorySelect');
    this.taskPomoEstSelect = document.getElementById('taskPomoEstSelect');
    this.btnAddTask = document.getElementById('btnAddTask');
    this.taskSearchInput = document.getElementById('taskSearchInput');

    // Modal elements
    this.taskModal = document.getElementById('taskModal');
    this.taskModalForm = document.getElementById('taskModalForm');
    this.taskModalHeadingText = document.getElementById('taskModalHeadingText');
    this.taskModalEditingId = document.getElementById('taskModalEditingId');
    this.taskModalInputTitle = document.getElementById('taskModalInputTitle');
    this.taskModalSelectCat = document.getElementById('taskModalSelectCat');
    this.taskModalSelectPrio = document.getElementById('taskModalSelectPrio');
    this.taskModalSelectPomos = document.getElementById('taskModalSelectPomos');
    this.taskModalSubtaskCount = document.getElementById('taskModalSubtaskCount');
    this.taskModalSubtaskInput = document.getElementById('taskModalSubtaskInput');
    this.btnTaskModalAddSubtask = document.getElementById('btnTaskModalAddSubtask');
    this.taskModalSubtaskList = document.getElementById('taskModalSubtaskList');
    this.taskModalScheduleToggle = document.getElementById('taskModalScheduleToggle');
    this.taskModalScheduleFields = document.getElementById('taskModalScheduleFields');
    this.taskModalScheduleDay = document.getElementById('taskModalScheduleDay');
    this.taskModalScheduleStart = document.getElementById('taskModalScheduleStart');
    this.taskModalScheduleEnd = document.getElementById('taskModalScheduleEnd');
    this.btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
    this.btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
    this.btnOpenTaskModal = document.getElementById('btnOpenTaskModal');
    this.btnOpenTaskModalWithOptions = document.getElementById('btnOpenTaskModalWithOptions');
  }

  bindEvents() {
    if (this.btnAddTask) {
      this.btnAddTask.addEventListener('click', () => this.handleQuickAddTask());
    }

    if (this.taskInputEl) {
      this.taskInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleQuickAddTask();
        }
      });
    }

    if (this.taskSearchInput) {
      this.taskSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Filter pills
    document.querySelectorAll('[data-task-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-task-filter]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.getAttribute('data-task-filter');
        this.render();
      });
    });

    // Modal triggers
    if (this.btnOpenTaskModal) {
      this.btnOpenTaskModal.addEventListener('click', () => this.openTaskModal());
    }

    if (this.btnOpenTaskModalWithOptions) {
      this.btnOpenTaskModalWithOptions.addEventListener('click', () => {
        const currentTitle = this.taskInputEl ? this.taskInputEl.value.trim() : '';
        this.openTaskModal(null, currentTitle);
      });
    }

    if (this.btnCloseTaskModal) {
      this.btnCloseTaskModal.addEventListener('click', () => this.closeTaskModal());
    }

    if (this.btnCancelTaskModal) {
      this.btnCancelTaskModal.addEventListener('click', () => this.closeTaskModal());
    }

    if (this.taskModal) {
      this.taskModal.addEventListener('click', (e) => {
        if (e.target === this.taskModal) this.closeTaskModal();
      });
    }

    // Subtask add in modal
    if (this.btnTaskModalAddSubtask) {
      this.btnTaskModalAddSubtask.addEventListener('click', () => this.addModalSubtask());
    }

    if (this.taskModalSubtaskInput) {
      this.taskModalSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addModalSubtask();
        }
      });
    }

    // Schedule toggle
    if (this.taskModalScheduleToggle) {
      this.taskModalScheduleToggle.addEventListener('change', () => {
        if (this.taskModalScheduleFields) {
          this.taskModalScheduleFields.style.display = this.taskModalScheduleToggle.checked ? 'block' : 'none';
        }
      });
    }

    // Modal Form Submit
    if (this.taskModalForm) {
      this.taskModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTaskModal();
      });
    }
  }

  openTaskModal(taskToEdit = null, prefilledTitle = '') {
    if (!this.taskModal) return;

    if (taskToEdit) {
      this.taskModalEditingId.value = taskToEdit.id;
      if (this.taskModalHeadingText) this.taskModalHeadingText.textContent = "Modifier la Tâche";
      this.taskModalInputTitle.value = taskToEdit.title || '';
      this.taskModalSelectCat.value = taskToEdit.tag || 'deepwork';
      this.taskModalSelectPrio.value = taskToEdit.priority || 'medium';
      this.taskModalSelectPomos.value = taskToEdit.estimatedPomos || 2;
      this.modalSubtasks = taskToEdit.subtasks ? JSON.parse(JSON.stringify(taskToEdit.subtasks)) : [];

      // Reset schedule toggle
      if (this.taskModalScheduleToggle) {
        this.taskModalScheduleToggle.checked = false;
        if (this.taskModalScheduleFields) this.taskModalScheduleFields.style.display = 'none';
      }
    } else {
      this.taskModalEditingId.value = '';
      if (this.taskModalHeadingText) this.taskModalHeadingText.textContent = "Nouvelle Tâche & Sous-tâches";
      this.taskModalInputTitle.value = prefilledTitle || (this.taskInputEl ? this.taskInputEl.value.trim() : '');
      this.taskModalSelectCat.value = this.taskCategorySelect ? this.taskCategorySelect.value : 'deepwork';
      this.taskModalSelectPrio.value = this.taskPrioritySelect ? this.taskPrioritySelect.value : 'medium';
      this.taskModalSelectPomos.value = this.taskPomoEstSelect ? this.taskPomoEstSelect.value : 2;
      this.modalSubtasks = [];

      // Default schedule day to today's day (1 = Monday, 7 = Sunday)
      const currentDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
      if (this.taskModalScheduleDay) this.taskModalScheduleDay.value = String(currentDay);

      if (this.taskModalScheduleToggle) {
        this.taskModalScheduleToggle.checked = false;
        if (this.taskModalScheduleFields) this.taskModalScheduleFields.style.display = 'none';
      }
    }

    if (this.taskModalSubtaskInput) this.taskModalSubtaskInput.value = '';
    this.renderModalSubtaskList();

    this.taskModal.classList.add('open');
    setTimeout(() => {
      if (this.taskModalInputTitle) this.taskModalInputTitle.focus();
    }, 100);
  }

  closeTaskModal() {
    if (this.taskModal) {
      this.taskModal.classList.remove('open');
    }
  }

  addModalSubtask() {
    if (!this.taskModalSubtaskInput) return;
    const text = this.taskModalSubtaskInput.value.trim();
    if (!text) return;

    this.modalSubtasks.push({
      id: 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: text,
      completed: false
    });

    this.taskModalSubtaskInput.value = '';
    this.renderModalSubtaskList();
    this.taskModalSubtaskInput.focus();
  }

  removeModalSubtask(index) {
    this.modalSubtasks.splice(index, 1);
    this.renderModalSubtaskList();
  }

  renderModalSubtaskList() {
    if (this.taskModalSubtaskCount) {
      this.taskModalSubtaskCount.textContent = this.modalSubtasks.length;
    }

    if (!this.taskModalSubtaskList) return;

    if (this.modalSubtasks.length === 0) {
      this.taskModalSubtaskList.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 0.75rem;">
          Aucune sous-tâche pour le moment. Ajoutes-en une ci-dessus pour décomposer ton travail !
        </div>
      `;
      return;
    }

    this.taskModalSubtaskList.innerHTML = this.modalSubtasks.map((st, idx) => `
      <div class="modal-subtask-item">
        <span title="${escapeHtml(st.title)}">📌 ${escapeHtml(st.title)}</span>
        <button type="button" class="btn btn-ghost btn-sm" onclick="window.taskManager.removeModalSubtask(${idx})" style="padding: 0.15rem 0.4rem; font-size: 0.75rem; color: var(--accent-rose);" title="Retirer cette sous-tâche">
          ✕
        </button>
      </div>
    `).join('');
  }

  handleSaveTaskModal() {
    const title = this.taskModalInputTitle.value.trim();
    if (!title) return;

    const priority = this.taskModalSelectPrio.value;
    const tag = this.taskModalSelectCat.value;
    const pomos = parseInt(this.taskModalSelectPomos.value, 10) || 2;
    const editingId = this.taskModalEditingId.value;

    let targetTask = null;

    if (editingId) {
      targetTask = window.appState.tasks.find(t => t.id === editingId);
      if (targetTask) {
        targetTask.title = title;
        targetTask.priority = priority;
        targetTask.tag = tag;
        targetTask.estimatedPomos = pomos;
        targetTask.subtasks = this.modalSubtasks;
      }
    } else {
      targetTask = {
        id: 'task_' + Date.now(),
        title,
        priority,
        tag,
        estimatedPomos: pomos,
        completedPomos: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: this.modalSubtasks
      };
      window.appState.tasks.unshift(targetTask);
    }

    // Schedule into calendar if checked
    if (this.taskModalScheduleToggle && this.taskModalScheduleToggle.checked) {
      const dayIndex = parseInt(this.taskModalScheduleDay.value, 10) || 1;
      const startTime = this.taskModalScheduleStart.value || '09:00';
      const endTime = this.taskModalScheduleEnd.value || '10:30';

      const typeMap = {
        deepwork: 'deepwork',
        projet: 'deepwork',
        admin: 'review',
        perso: 'break'
      };

      const newBlock = {
        id: 'block_' + Date.now(),
        dayIndex: dayIndex,
        title: title,
        startTime: startTime,
        endTime: endTime,
        type: typeMap[tag] || 'deepwork'
      };

      if (!window.appState.schedule) window.appState.schedule = [];
      window.appState.schedule.push(newBlock);

      if (window.plannerManager) {
        window.plannerManager.renderBlocks();
      }
    }

    window.appState.save();
    this.closeTaskModal();

    if (this.taskInputEl) this.taskInputEl.value = '';
    this.render();

    if (window.app) {
      window.app.updateHeaderStats();
      const actionLabel = editingId ? 'Tâche mise à jour !' : 'Tâche créée avec ses sous-étapes ! 📋';
      window.app.showToast(actionLabel);
    }
  }

  handleQuickAddTask() {
    const title = this.taskInputEl.value.trim();
    if (!title) return;

    const priority = this.taskPrioritySelect ? this.taskPrioritySelect.value : 'medium';
    const tag = this.taskCategorySelect ? this.taskCategorySelect.value : 'deepwork';
    const pomos = this.taskPomoEstSelect ? parseInt(this.taskPomoEstSelect.value, 10) : 2;

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      priority,
      tag,
      estimatedPomos: pomos,
      completedPomos: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: []
    };

    window.appState.tasks.unshift(newTask);
    window.appState.save();

    this.taskInputEl.value = '';
    this.render();
    if (window.app) window.app.showToast('Tâche ajoutée avec succès !');
  }

  toggleTask(taskId) {
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date().toISOString();
      window.audioEngine.playTaskCompletion();
      if (window.confettiHelper) window.confettiHelper.fire();
      if (window.app) window.app.showToast('✨ Tâche terminée ! Superbe travail.');
    }

    window.appState.save();
    this.render();
    if (window.app) window.app.updateHeaderStats();
  }

  deleteTask(taskId) {
    window.appState.tasks = window.appState.tasks.filter(t => t.id !== taskId);
    window.appState.save();
    this.render();
    if (window.app) window.app.updateHeaderStats();
  }

  startFocusOnTask(taskId) {
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (window.deepWorkTimer) {
      window.deepWorkTimer.setActiveTask(task);
    }

    // Switch to Deep Work tab
    if (window.app) {
      window.app.switchTab('timer');
      window.app.showToast(`🎯 Session lancée sur : "${task.title}"`);
    }
  }

  editTask(taskId) {
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.openTaskModal(task);
  }

  addSubtask(taskId) {
    // Open the sleek modal directly on this task
    this.editTask(taskId);
  }

  toggleSubtask(taskId, subtaskId) {
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      window.audioEngine.playTaskCompletion();
      if (sub.completed && window.confettiHelper) {
        window.confettiHelper.fire();
      }
      window.appState.save();
      this.render();
    }
  }

  getFilteredTasks() {
    let list = [...(window.appState.tasks || [])];

    if (this.currentFilter === 'active') {
      list = list.filter(t => !t.completed);
    } else if (this.currentFilter === 'completed') {
      list = list.filter(t => t.completed);
    } else if (['deepwork', 'projet', 'admin', 'perso'].includes(this.currentFilter)) {
      list = list.filter(t => t.tag === this.currentFilter);
    } else if (['high', 'medium', 'low'].includes(this.currentFilter)) {
      list = list.filter(t => t.priority === this.currentFilter);
    }

    if (this.searchQuery) {
      list = list.filter(t => t.title.toLowerCase().includes(this.searchQuery));
    }

    return list;
  }

  render() {
    if (!this.taskListEl) return;
    const tasks = this.getFilteredTasks();

    if (tasks.length === 0) {
      this.taskListEl.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🍃</div>
          <p style="font-size: 0.95rem; font-weight: 500;">Aucune tâche ne correspond à ces critères.</p>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">Profites-en pour te reposer ou ajoute un nouvel objectif !</p>
        </div>
      `;
      return;
    }

    const priorityLabels = {
      high: { label: 'Haute', class: 'p-high' },
      medium: { label: 'Moyenne', class: 'p-medium' },
      low: { label: 'Basse', class: 'p-low' }
    };

    const tagLabels = {
      deepwork: { label: '🎯 Deep Work', class: 'deepwork' },
      projet: { label: '🚀 Projet', class: 'projet' },
      admin: { label: '📋 Admin', class: 'admin' },
      perso: { label: '🌿 Perso', class: 'perso' }
    };

    this.taskListEl.innerHTML = tasks.map(task => {
      const prio = priorityLabels[task.priority] || priorityLabels.medium;
      const tag = tagLabels[task.tag] || tagLabels.deepwork;
      const completedClass = task.completed ? 'completed' : '';

      const subtasksHtml = (task.subtasks && task.subtasks.length > 0) ? `
        <div style="margin-top: 0.75rem; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; border-left: 2px solid rgba(255,255,255,0.08);">
          ${task.subtasks.map(s => `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; cursor: pointer; color: ${s.completed ? 'var(--text-dim)' : 'var(--text-muted)'}; text-decoration: ${s.completed ? 'line-through' : 'none'};">
              <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="window.taskManager.toggleSubtask('${task.id}', '${s.id}')" style="accent-color: var(--accent-amber);">
              ${escapeHtml(s.title)}
            </label>
          `).join('')}
        </div>
      ` : '';

      return `
        <div class="task-item ${completedClass}" id="item-${task.id}">
          <div class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="window.taskManager.toggleTask('${task.id}')" title="Marquer comme terminée">
          </div>
          <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span class="tag-badge ${tag.class}">${tag.label}</span>
              <span class="priority-indicator ${prio.class}">
                <span class="priority-dot"></span>
                ${prio.label}
              </span>
              <span class="pomo-counter-badge" title="Pomodoros estimés">
                ⏳ ${task.completedPomos || 0}/${task.estimatedPomos || 1}
              </span>
              <button onclick="window.taskManager.editTask('${task.id}')" class="btn btn-ghost btn-sm" style="padding: 0.15rem 0.55rem; font-size: 0.74rem;" title="Gérer ou ajouter des sous-tâches">
                ✏️ Sous-tâches (${task.subtasks ? task.subtasks.length : 0})
              </button>
            </div>
            ${subtasksHtml}
          </div>
          <div class="task-actions">
            ${!task.completed ? `
              <button onclick="window.taskManager.startFocusOnTask('${task.id}')" class="btn btn-secondary btn-sm" title="Lancer une session Deep Work sur cette tâche">
                <svg viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
                Focus
              </button>
            ` : ''}
            <button onclick="window.taskManager.deleteTask('${task.id}')" class="icon-btn" style="width: 30px; height: 30px;" title="Supprimer">
              <svg viewBox="0 0 24 24" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.taskManager = new TaskManager();
