/**
 * FLOWSTATE - Cloud Sync Engine (Supabase Integration)
 * Provides automatic, seamless, offline-first synchronization across all devices.
 */

class CloudSync {
  constructor() {
    this.storageKey = 'FLOWSTATE_CLOUD_CONFIG';
    
    // Default built-in Supabase configuration for Adam and friends
    this.DEFAULT_CONFIG = {
      supabaseUrl: 'https://vinuhlqfhterbpplzzxu.supabase.co',
      supabaseAnonKey: 'sb_publishable_L0fd1QKKCm_FaQwAuo8Nyw_J5moY4N9',
      autoSync: true
    };

    this.config = this.loadConfig();

    this.syncTimeout = null;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.status = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured'
  }

  cleanUrl(url) {
    if (!url) return '';
    return (url || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          supabaseUrl: this.cleanUrl(parsed.supabaseUrl) || this.DEFAULT_CONFIG.supabaseUrl,
          supabaseAnonKey: (parsed.supabaseAnonKey || '').trim() || this.DEFAULT_CONFIG.supabaseAnonKey,
          autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true
        };
      }
    } catch (e) {
      console.warn('Erreur chargement cloud config:', e);
    }

    return { ...this.DEFAULT_CONFIG };
  }

  saveConfig(supabaseUrl, supabaseAnonKey) {
    this.config.supabaseUrl = this.cleanUrl(supabaseUrl) || this.DEFAULT_CONFIG.supabaseUrl;
    this.config.supabaseAnonKey = (supabaseAnonKey || '').trim() || this.DEFAULT_CONFIG.supabaseAnonKey;
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    this.updateUI();

    if (this.isConfigured()) {
      this.pullFromCloud();
    }
  }

  isConfigured() {
    return Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  init() {
    this.bindEvents();
    this.updateUI();

    if (this.isConfigured()) {
      // Pull fresh data on launch
      setTimeout(() => this.pullFromCloud(), 400);

      // Auto-sync when user returns to the tab or app
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isConfigured()) {
          this.pullFromCloud();
        }
      });
    } else {
      this.status = 'unconfigured';
      this.updateUI();
    }
  }

  bindEvents() {
    const cloudBtn = document.getElementById('headerCloudSyncBtn');
    const cloudModal = document.getElementById('cloudModal');
    const btnCloseCloudModal = document.getElementById('btnCloseCloudModal');
    const cloudForm = document.getElementById('cloudConfigForm');
    const btnManualSync = document.getElementById('btnManualCloudSync');

    if (cloudBtn && cloudModal) {
      cloudBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (btnCloseCloudModal && cloudModal) {
      btnCloseCloudModal.addEventListener('click', () => {
        cloudModal.classList.remove('open');
      });
    }

    if (cloudModal) {
      cloudModal.addEventListener('click', (e) => {
        if (e.target === cloudModal) cloudModal.classList.remove('open');
      });
    }

    if (cloudForm) {
      cloudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlInput = document.getElementById('cloudSupabaseUrl');
        const keyInput = document.getElementById('cloudSupabaseKey');
        this.saveConfig(urlInput.value, keyInput.value);
        if (window.app) {
          window.app.showToast('Configuration Cloud enregistrée ! ☁️');
        }
      });
    }

    if (btnManualSync) {
      btnManualSync.addEventListener('click', () => {
        this.manualSync();
      });
    }
  }

  openModal() {
    const cloudModal = document.getElementById('cloudModal');
    if (!cloudModal) return;

    const urlInput = document.getElementById('cloudSupabaseUrl');
    const keyInput = document.getElementById('cloudSupabaseKey');
    if (urlInput) urlInput.value = this.config.supabaseUrl || '';
    if (keyInput) keyInput.value = this.config.supabaseAnonKey || '';

    this.renderModalStatus();
    cloudModal.classList.add('open');
  }

  renderModalStatus() {
    const statusTextEl = document.getElementById('modalCloudStatusText');
    const lastSyncEl = document.getElementById('modalCloudLastSync');

    if (statusTextEl) {
      if (!this.isConfigured()) {
        statusTextEl.innerHTML = '<span style="color:var(--accent-amber);">🟡 Non connecté (mode local uniquement)</span>';
      } else if (this.status === 'synced') {
        statusTextEl.innerHTML = '<span style="color:var(--accent-emerald);">🟢 Connecté & Synchronisé</span>';
      } else if (this.status === 'syncing') {
        statusTextEl.innerHTML = '<span style="color:var(--accent-amber);">🔄 Synchronisation en cours...</span>';
      } else if (this.status === 'error') {
        statusTextEl.innerHTML = '<span style="color:var(--accent-rose);">🔴 Erreur de connexion au Cloud</span>';
      } else {
        statusTextEl.innerHTML = '<span style="color:var(--text-muted);">Prêt pour la synchronisation</span>';
      }
    }

    if (lastSyncEl) {
      if (this.lastSyncTime) {
        lastSyncEl.textContent = `Dernière synchro : ${this.lastSyncTime.toLocaleTimeString('fr-FR')}`;
      } else {
        lastSyncEl.textContent = 'Aucune synchronisation récente';
      }
    }
  }

  updateUI() {
    const iconEl = document.getElementById('cloudStatusIcon');
    const textEl = document.getElementById('cloudStatusText');
    const btn = document.getElementById('headerCloudSyncBtn');

    if (!iconEl || !textEl) return;

    if (!this.isConfigured()) {
      iconEl.textContent = '☁️';
      textEl.textContent = 'Local';
      if (btn) btn.style.borderColor = 'rgba(255,255,255,0.08)';
    } else if (this.status === 'syncing') {
      iconEl.textContent = '🔄';
      textEl.textContent = 'Synchro...';
      if (btn) btn.style.borderColor = 'var(--accent-amber)';
    } else if (this.status === 'synced') {
      iconEl.textContent = '☁️';
      textEl.textContent = 'Cloud OK';
      if (btn) btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else if (this.status === 'error') {
      iconEl.textContent = '⚠️';
      textEl.textContent = 'Erreur Cloud';
      if (btn) btn.style.borderColor = 'var(--accent-rose)';
    } else {
      iconEl.textContent = '☁️';
      textEl.textContent = 'Cloud';
    }

    this.renderModalStatus();
  }

  // --- Network sync methods ---

  async fetchRemoteData(userId) {
    if (!this.isConfigured()) return null;

    const url = `${this.config.supabaseUrl}/rest/v1/flowstate_users?user_id=eq.${encodeURIComponent(userId)}&select=*`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const rows = await response.json();
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      clearTimeout(timer);
      console.warn('Cloud pull error:', err);
      throw err;
    }
  }

  async pushRemoteData(userId, payload) {
    if (!this.isConfigured()) return null;

    const url = `${this.config.supabaseUrl}/rest/v1/flowstate_users`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const bodyData = {
      user_id: userId,
      data: payload,
      updated_at: new Date().toISOString()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(bodyData),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return true;
    } catch (err) {
      clearTimeout(timer);
      console.warn('Cloud push error:', err);
      throw err;
    }
  }

  async pullFromCloud() {
    if (!this.isConfigured() || !window.appState) return;

    const userId = window.appState.currentUser;
    this.status = 'syncing';
    this.updateUI();

    try {
      const remoteRecord = await this.fetchRemoteData(userId);

      if (remoteRecord && remoteRecord.data) {
        const remoteData = remoteRecord.data;
        const remoteTime = new Date(remoteRecord.updated_at || remoteData.lastUpdatedAt || 0).getTime();
        const localTime = new Date(window.appState.lastUpdatedAt || 0).getTime();

        // If remote is newer than local, update local
        if (remoteTime > localTime) {
          console.log('Synchronisation: Données cloud plus récentes, mise à jour locale.');
          if (Array.isArray(remoteData.tasks)) window.appState.tasks = remoteData.tasks;
          if (Array.isArray(remoteData.schedule)) window.appState.schedule = remoteData.schedule;
          if (Array.isArray(remoteData.goals)) window.appState.goals = remoteData.goals;
          if (remoteData.stats) window.appState.stats = remoteData.stats;
          window.appState.lastUpdatedAt = remoteRecord.updated_at;

          // Save locally without re-pushing
          window.appState.save(false);

          // Re-render UI
          if (window.taskManager) window.taskManager.renderAll();
          if (window.plannerManager) window.plannerManager.renderAll();
          if (window.statsManager) window.statsManager.renderAll();
          if (window.app) {
            window.app.updateHeaderStats();
            window.app.showToast('Données synchronisées depuis le Cloud ! ☁️');
          }
        } else if (localTime > remoteTime) {
          // Local is newer, push to cloud
          console.log('Synchronisation: Données locales plus récentes, envoi au cloud.');
          await this.executePush();
        }
      } else {
        // No cloud record yet for this user: initialize cloud record with local state
        console.log('Première synchro cloud pour cet utilisateur.');
        await this.executePush();
      }

      this.status = 'synced';
      this.lastSyncTime = new Date();
      this.updateUI();
    } catch (err) {
      this.status = 'error';
      this.updateUI();
    }
  }

  syncToCloud() {
    if (!this.isConfigured() || !window.appState) return;

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.status = 'syncing';
    this.updateUI();

    // Debounce 1.2s to prevent spamming
    this.syncTimeout = setTimeout(async () => {
      try {
        await this.executePush();
        this.status = 'synced';
        this.lastSyncTime = new Date();
        this.updateUI();
      } catch (e) {
        this.status = 'error';
        this.updateUI();
      }
    }, 1200);
  }

  async executePush() {
    if (!this.isConfigured() || !window.appState) return;
    const userId = window.appState.currentUser;
    const payload = {
      tasks: window.appState.tasks,
      schedule: window.appState.schedule,
      goals: window.appState.goals,
      stats: window.appState.stats,
      lastUpdatedAt: window.appState.lastUpdatedAt || new Date().toISOString()
    };
    await this.pushRemoteData(userId, payload);
  }

  async manualSync() {
    if (!this.isConfigured()) {
      this.openModal();
      return;
    }
    const btn = document.getElementById('btnManualCloudSync');
    if (btn) btn.textContent = 'Synchronisation en cours...';

    await this.pullFromCloud();

    if (btn) btn.textContent = 'Forcer une synchronisation 🔄';
    if (this.status === 'synced' && window.app) {
      window.app.showToast('Synchronisation Cloud réussie ! 🚀');
    }
  }
}

window.cloudSync = new CloudSync();
