/**
 * FLOWSTATE - Tasks, Notes & Subtasks Management
 * Industrial tactile Braun edition with dedicated notes space,
 * interactive subtask checklists, and deep work focus integration.
 */

class TaskManager {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.modalSubtasks = [];
    this.notesAutosaveTimeout = null;
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

    // Metrics ribbon
    this.tasksMetricTotal = document.getElementById('tasksMetricTotal');
    this.tasksMetricActive = document.getElementById('tasksMetricActive');
    this.tasksMetricDone = document.getElementById('tasksMetricDone');
    this.tasksMetricSubtasks = document.getElementById('tasksMetricSubtasks');

    // Modal elements
    this.taskModal = document.getElementById('taskModal');
    this.taskModalForm = document.getElementById('taskModalForm');
    this.taskModalHeadingText = document.getElementById('taskModalHeadingText');
    this.taskModalSubheading = document.getElementById('taskModalSubheading');
    this.taskModalEditingId = document.getElementById('taskModalEditingId');
    this.taskModalInputTitle = document.getElementById('taskModalInputTitle');
    this.taskModalSelectCat = document.getElementById('taskModalSelectCat');
    this.taskModalSelectPrio = document.getElementById('taskModalSelectPrio');
    this.taskModalSelectPomos = document.getElementById('taskModalSelectPomos');

    // Notes elements
    this.taskModalNotes = document.getElementById('taskModalNotes');
    this.taskModalNotesStatus = document.getElementById('taskModalNotesStatus');
    this.notesStatusText = document.getElementById('notesStatusText');
    this.btnNoteBullet = document.getElementById('btnNoteBullet');
    this.btnNoteChecklist = document.getElementById('btnNoteChecklist');
    this.btnNoteDate = document.getElementById('btnNoteDate');
    this.btnNoteLink = document.getElementById('btnNoteLink');
    this.btnNoteClear = document.getElementById('btnNoteClear');

    // Subtasks modal elements
    this.taskModalSubtaskCount = document.getElementById('taskModalSubtaskCount');
    this.taskModalSubtaskProgressText = document.getElementById('taskModalSubtaskProgressText');
    this.taskModalProgressBar = document.getElementById('taskModalProgressBar');
    this.taskModalSubtaskInput = document.getElementById('taskModalSubtaskInput');
    this.btnTaskModalAddSubtask = document.getElementById('btnTaskModalAddSubtask');
    this.taskModalSubtaskList = document.getElementById('taskModalSubtaskList');

    // Schedule modal elements
    this.taskModalScheduleToggle = document.getElementById('taskModalScheduleToggle');
    this.taskModalScheduleFields = document.getElementById('taskModalScheduleFields');
    this.taskModalScheduleDay = document.getElementById('taskModalScheduleDay');
    this.taskModalScheduleStart = document.getElementById('taskModalScheduleStart');
    this.taskModalScheduleEnd = document.getElementById('taskModalScheduleEnd');

    // Footer actions
    this.btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
    this.btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
    this.btnOpenTaskModal = document.getElementById('btnOpenTaskModal');
    this.btnOpenTaskModalWithOptions = document.getElementById('btnOpenTaskModalWithOptions');
    this.btnTaskModalDelete = document.getElementById('btnTaskModalDelete');
    this.btnTaskModalStartFocus = document.getElementById('btnTaskModalStartFocus');
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.taskModal && this.taskModal.classList.contains('open')) {
        this.closeTaskModal();
      }
    });

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

    // Notes auto-save listener
    if (this.taskModalNotes) {
      this.taskModalNotes.addEventListener('input', () => {
        this.handleNotesInput();
      });
    }

    // Note toolbar buttons
    if (this.btnNoteBullet) {
      this.btnNoteBullet.addEventListener('click', () => this.insertNoteText('• '));
    }
    if (this.btnNoteChecklist) {
      this.btnNoteChecklist.addEventListener('click', () => this.insertNoteText('☑ '));
    }
    if (this.btnNoteDate) {
      this.btnNoteDate.addEventListener('click', () => {
        const d = new Date();
        const dateStr = `[${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}] `;
        this.insertNoteText(dateStr);
      });
    }
    if (this.btnNoteLink) {
      this.btnNoteLink.addEventListener('click', () => this.insertNoteText('[Titre du lien](https://)'));
    }
    if (this.btnNoteClear) {
      this.btnNoteClear.addEventListener('click', () => {
        if (!this.taskModalNotes.value.trim() || confirm('Effacer toutes les notes de cette tâche ?')) {
          this.taskModalNotes.value = '';
          this.handleNotesInput();
        }
      });
    }

    // Delete button in modal
    if (this.btnTaskModalDelete) {
      this.btnTaskModalDelete.addEventListener('click', () => {
        const editingId = this.taskModalEditingId ? this.taskModalEditingId.value : null;
        if (editingId && confirm('Supprimer définitivement cette tâche ?')) {
          this.deleteTask(editingId);
          this.closeTaskModal();
        }
      });
    }

    // Start Focus button in modal
    if (this.btnTaskModalStartFocus) {
      this.btnTaskModalStartFocus.addEventListener('click', () => {
        const editingId = this.taskModalEditingId ? this.taskModalEditingId.value : null;
        if (editingId) {
          this.closeTaskModal();
          this.startFocusOnTask(editingId);
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

  insertNoteText(textToInsert) {
    if (!this.taskModalNotes) return;
    const textarea = this.taskModalNotes;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    // If needed add newline before if not at start of line
    const needsNewline = (start > 0 && before[start - 1] !== '\n');
    const insertion = (needsNewline ? '\n' : '') + textToInsert;

    textarea.value = before + insertion + after;
    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    textarea.focus();
    this.handleNotesInput();
  }

  handleNotesInput() {
    if (this.notesStatusText) {
      this.notesStatusText.textContent = 'Modifié...';
      if (this.taskModalNotesStatus) this.taskModalNotesStatus.classList.add('saving');
    }

    clearTimeout(this.notesAutosaveTimeout);
    this.notesAutosaveTimeout = setTimeout(() => {
      // Auto-save to active task if we are editing
      const editingId = this.taskModalEditingId ? this.taskModalEditingId.value : null;
      if (editingId && window.appState && window.appState.tasks) {
        const task = window.appState.tasks.find(t => t.id === editingId);
        if (task) {
          task.notes = this.taskModalNotes.value;
          window.appState.save();
        }
      }
      if (this.notesStatusText) {
        this.notesStatusText.textContent = 'Enregistré';
        if (this.taskModalNotesStatus) this.taskModalNotesStatus.classList.remove('saving');
      }
    }, 400);
  }

  openTaskModal(taskToEdit = null, prefilledTitle = '') {
    if (!this.taskModal) return;

    if (taskToEdit) {
      this.taskModalEditingId.value = taskToEdit.id;
      if (this.taskModalHeadingText) this.taskModalHeadingText.textContent = "Détail de la Tâche & Notes";
      if (this.taskModalSubheading) this.taskModalSubheading.textContent = "Modifie tes notes, tes sous-tâches et ton focus";
      this.taskModalInputTitle.value = taskToEdit.title || '';
      this.taskModalSelectCat.value = taskToEdit.tag || 'deepwork';
      this.taskModalSelectPrio.value = taskToEdit.priority || 'medium';
      this.taskModalSelectPomos.value = taskToEdit.estimatedPomos || 2;
      if (this.taskModalNotes) this.taskModalNotes.value = taskToEdit.notes || '';
      this.modalSubtasks = taskToEdit.subtasks ? JSON.parse(JSON.stringify(taskToEdit.subtasks)) : [];

      if (this.btnTaskModalDelete) this.btnTaskModalDelete.style.display = 'inline-flex';
      if (this.btnTaskModalStartFocus) this.btnTaskModalStartFocus.style.display = 'inline-flex';

      // Reset schedule toggle
      if (this.taskModalScheduleToggle) {
        this.taskModalScheduleToggle.checked = false;
        if (this.taskModalScheduleFields) this.taskModalScheduleFields.style.display = 'none';
      }
    } else {
      this.taskModalEditingId.value = '';
      if (this.taskModalHeadingText) this.taskModalHeadingText.textContent = "Nouvelle Tâche, Notes & Étapes";
      if (this.taskModalSubheading) this.taskModalSubheading.textContent = "Crée un nouvel objectif et structure tes étapes de travail";
      this.taskModalInputTitle.value = prefilledTitle || (this.taskInputEl ? this.taskInputEl.value.trim() : '');
      this.taskModalSelectCat.value = this.taskCategorySelect ? this.taskCategorySelect.value : 'deepwork';
      this.taskModalSelectPrio.value = this.taskPrioritySelect ? this.taskPrioritySelect.value : 'medium';
      this.taskModalSelectPomos.value = this.taskPomoEstSelect ? this.taskPomoEstSelect.value : 2;
      if (this.taskModalNotes) this.taskModalNotes.value = '';
      this.modalSubtasks = [];

      if (this.btnTaskModalDelete) this.btnTaskModalDelete.style.display = 'none';
      if (this.btnTaskModalStartFocus) this.btnTaskModalStartFocus.style.display = 'none';

      // Default schedule day to today's day (1 = Monday, 7 = Sunday)
      const currentDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
      if (this.taskModalScheduleDay) this.taskModalScheduleDay.value = String(currentDay);

      if (this.taskModalScheduleToggle) {
        this.taskModalScheduleToggle.checked = false;
        if (this.taskModalScheduleFields) this.taskModalScheduleFields.style.display = 'none';
      }
    }

    if (this.notesStatusText) this.notesStatusText.textContent = 'Prêt';
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

  toggleModalSubtask(index) {
    if (this.modalSubtasks[index]) {
      this.modalSubtasks[index].completed = !this.modalSubtasks[index].completed;
      if (window.audioEngine) window.audioEngine.playTaskCompletion();
      this.renderModalSubtaskList();

      // If we are editing an existing task, save instantly
      const editingId = this.taskModalEditingId ? this.taskModalEditingId.value : null;
      if (editingId && window.appState && window.appState.tasks) {
        const target = window.appState.tasks.find(t => t.id === editingId);
        if (target) {
          target.subtasks = this.modalSubtasks;
          window.appState.save();
          this.render();
        }
      }
    }
  }

  removeModalSubtask(index) {
    this.modalSubtasks.splice(index, 1);
    this.renderModalSubtaskList();

    // If we are editing an existing task, save instantly
    const editingId = this.taskModalEditingId ? this.taskModalEditingId.value : null;
    if (editingId && window.appState && window.appState.tasks) {
      const target = window.appState.tasks.find(t => t.id === editingId);
      if (target) {
        target.subtasks = this.modalSubtasks;
        window.appState.save();
        this.render();
      }
    }
  }

  renderModalSubtaskList() {
    const total = this.modalSubtasks.length;
    const completed = this.modalSubtasks.filter(s => s.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.taskModalSubtaskCount) {
      this.taskModalSubtaskCount.textContent = total;
    }
    if (this.taskModalSubtaskProgressText) {
      this.taskModalSubtaskProgressText.textContent = total > 0 ? `${completed}/${total} (${percentage}%)` : '0%';
    }
    if (this.taskModalProgressBar) {
      this.taskModalProgressBar.style.width = `${percentage}%`;
    }

    if (!this.taskModalSubtaskList) return;

    if (total === 0) {
      this.taskModalSubtaskList.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 0.75rem;">
          Aucune sous-tâche pour le moment. Ajoutes-en une ci-dessus pour décomposer ton travail !
        </div>
      `;
      return;
    }

    this.taskModalSubtaskList.innerHTML = this.modalSubtasks.map((st, idx) => `
      <div class="modal-subtask-item ${st.completed ? 'completed' : ''}">
        <label class="modal-subtask-label" style="display: flex; align-items: center; gap: 0.65rem; flex: 1; cursor: pointer;">
          <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="window.taskManager.toggleModalSubtask(${idx})" class="modal-subtask-checkbox">
          <span class="modal-subtask-title" title="${escapeHtml(st.title)}" style="text-decoration: ${st.completed ? 'line-through' : 'none'}; color: ${st.completed ? 'var(--text-dim)' : 'var(--text-main)'};">
            ${escapeHtml(st.title)}
          </span>
        </label>
        <button type="button" class="btn btn-ghost btn-sm" onclick="window.taskManager.removeModalSubtask(${idx})" style="padding: 0.15rem 0.45rem; font-size: 0.75rem; color: var(--accent-rose);" title="Retirer cette sous-tâche">
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
    const notes = this.taskModalNotes ? this.taskModalNotes.value : '';
    const editingId = this.taskModalEditingId.value;

    let targetTask = null;

    if (editingId) {
      targetTask = window.appState.tasks.find(t => t.id === editingId);
      if (targetTask) {
        targetTask.title = title;
        targetTask.priority = priority;
        targetTask.tag = tag;
        targetTask.estimatedPomos = pomos;
        targetTask.notes = notes;
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
        notes,
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
      const actionLabel = editingId ? 'Tâche et notes enregistrées !' : 'Nouvelle tâche créée avec ses notes ! 📋';
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
      notes: '',
      subtasks: []
    };

    window.appState.tasks.unshift(newTask);
    window.appState.save();

    this.taskInputEl.value = '';
    this.render();
    if (window.app) window.app.showToast('Tâche ajoutée avec succès !');
  }

  toggleTask(taskId, e) {
    if (e) e.stopPropagation();
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date().toISOString();
      if (window.audioEngine) window.audioEngine.playTaskCompletion();
      if (window.confettiHelper) window.confettiHelper.fire();
      if (window.app) window.app.showToast('✨ Tâche terminée ! Félicitations.');
    }

    window.appState.save();
    this.render();
    if (window.app) window.app.updateHeaderStats();
  }

  deleteTask(taskId, e) {
    if (e) e.stopPropagation();
    window.appState.tasks = window.appState.tasks.filter(t => t.id !== taskId);
    window.appState.save();
    this.render();
    if (window.app) {
      window.app.updateHeaderStats();
      window.app.showToast('Tâche supprimée.');
    }
  }

  startFocusOnTask(taskId, e) {
    if (e) e.stopPropagation();
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

  openTask(taskId) {
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.openTaskModal(task);
  }

  editTask(taskId, e) {
    if (e) e.stopPropagation();
    this.openTask(taskId);
  }

  toggleSubtask(taskId, subtaskId, e) {
    if (e) e.stopPropagation();
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      if (window.audioEngine) window.audioEngine.playTaskCompletion();
      if (sub.completed && window.confettiHelper) {
        window.confettiHelper.fire();
      }
      window.appState.save();
      this.render();
    }
  }

  quickAddSubtaskInline(taskId, e) {
    if (e) e.stopPropagation();
    const task = window.appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    const subtaskTitle = prompt(`Ajouter une sous-tâche pour "${task.title}" :`);
    if (subtaskTitle && subtaskTitle.trim()) {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({
        id: 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: subtaskTitle.trim(),
        completed: false
      });
      window.appState.save();
      this.render();
      if (window.app) window.app.showToast('Sous-tâche ajoutée ! 📌');
    }
  }

  getFilteredTasks() {
    let list = [...(window.appState.tasks || [])];

    if (this.currentFilter === 'active') {
      list = list.filter(t => !t.completed);
    } else if (this.currentFilter === 'completed') {
      list = list.filter(t => t.completed);
    } else if (this.currentFilter === 'has_notes') {
      list = list.filter(t => t.notes && t.notes.trim().length > 0);
    } else if (['deepwork', 'projet', 'admin', 'perso'].includes(this.currentFilter)) {
      list = list.filter(t => t.tag === this.currentFilter);
    } else if (['high', 'medium', 'low'].includes(this.currentFilter)) {
      list = list.filter(t => t.priority === this.currentFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }

  updateMetricsRibbon() {
    const all = window.appState.tasks || [];
    const active = all.filter(t => !t.completed).length;
    const done = all.filter(t => t.completed).length;

    let totalSubtasks = 0;
    let doneSubtasks = 0;
    all.forEach(t => {
      if (t.subtasks && t.subtasks.length > 0) {
        totalSubtasks += t.subtasks.length;
        doneSubtasks += t.subtasks.filter(s => s.completed).length;
      }
    });

    if (this.tasksMetricTotal) this.tasksMetricTotal.textContent = all.length;
    if (this.tasksMetricActive) this.tasksMetricActive.textContent = active;
    if (this.tasksMetricDone) this.tasksMetricDone.textContent = done;
    if (this.tasksMetricSubtasks) {
      this.tasksMetricSubtasks.textContent = totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks}` : '0';
    }
  }

  render() {
    this.updateMetricsRibbon();
    if (!this.taskListEl) return;
    const tasks = this.getFilteredTasks();

    if (tasks.length === 0) {
      this.taskListEl.innerHTML = `
        <div class="empty-state-card">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🍃</div>
          <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-main);">Aucune tâche ne correspond à ces critères.</p>
          <p style="font-size: 0.8rem; margin-top: 0.25rem; color: var(--text-dim);">Profites-en pour te reposer ou ajoute un nouvel objectif ci-dessus !</p>
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

      // Notes badge & preview
      const hasNotes = task.notes && task.notes.trim().length > 0;
      let notesSnippet = '';
      if (hasNotes) {
        const firstLine = task.notes.trim().split('\n')[0].replace(/^[•\-\*]\s*/, '');
        notesSnippet = `
          <div class="task-notes-snippet" title="${escapeHtml(task.notes)}">
            <span class="snippet-icon">📝</span>
            <span class="snippet-text">${escapeHtml(firstLine)}</span>
          </div>
        `;
      }

      // Subtasks calculation & rendering
      const subtasks = task.subtasks || [];
      const totalSubs = subtasks.length;
      const doneSubs = subtasks.filter(s => s.completed).length;
      const subPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

      const subtasksHtml = totalSubs > 0 ? `
        <div class="task-card-subtasks-wrap" onclick="event.stopPropagation()">
          <div class="subtasks-summary-header">
            <span class="subtasks-progress-label">📋 Sous-tâches : ${doneSubs}/${totalSubs} (${subPct}%)</span>
            <div class="subtasks-mini-bar">
              <div class="subtasks-mini-fill" style="width: ${subPct}%"></div>
            </div>
          </div>
          <div class="subtasks-inline-list">
            ${subtasks.map(s => `
              <label class="subtask-inline-item ${s.completed ? 'completed' : ''}">
                <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="window.taskManager.toggleSubtask('${task.id}', '${s.id}', event)" class="subtask-inline-checkbox">
                <span>${escapeHtml(s.title)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      ` : '';

      return `
        <div class="task-item ${completedClass}" id="item-${task.id}" onclick="window.taskManager.openTask('${task.id}')" title="Cliquer pour ouvrir les notes et le détail">
          <!-- Checkbox -->
          <div class="task-checkbox-wrap" onclick="event.stopPropagation()">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="window.taskManager.toggleTask('${task.id}', event)" title="Marquer comme terminée">
          </div>

          <!-- Content -->
          <div class="task-content">
            <div class="task-title-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
              ${hasNotes ? `<span class="task-notes-indicator" title="Contient des notes">📝</span>` : ''}
            </div>

            <!-- Notes Excerpt Preview -->
            ${notesSnippet}

            <!-- Metadata Badges -->
            <div class="task-meta">
              <span class="tag-badge ${tag.class}">${tag.label}</span>
              <span class="priority-indicator ${prio.class}">
                <span class="priority-dot"></span>
                ${prio.label}
              </span>
              <span class="pomo-counter-badge" title="Cycles Deep Work estimés">
                ⏳ ${task.completedPomos || 0}/${task.estimatedPomos || 1}
              </span>

              <!-- Inline Quick Add Subtask Button -->
              <button onclick="window.taskManager.quickAddSubtaskInline('${task.id}', event)" class="btn btn-ghost btn-sm btn-inline-subtask" title="Ajouter une sous-tâche rapide">
                + Sous-tâche
              </button>
            </div>

            <!-- Inline Subtasks -->
            ${subtasksHtml}
          </div>

          <!-- Actions -->
          <div class="task-actions" onclick="event.stopPropagation()">
            ${!task.completed ? `
              <button onclick="window.taskManager.startFocusOnTask('${task.id}', event)" class="btn btn-secondary btn-sm" title="Lancer une session Deep Work sur cette tâche">
                <svg viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M5 3l14 9-14 9V3z" fill="currentColor"/></svg>
                Focus
              </button>
            ` : ''}
            <button onclick="window.taskManager.openTask('${task.id}')" class="icon-btn btn-open-notes" title="Ouvrir les notes & détails" style="width: 32px; height: 32px;">
              📝
            </button>
            <button onclick="window.taskManager.deleteTask('${task.id}', event)" class="icon-btn" style="width: 32px; height: 32px;" title="Supprimer">
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
