/**
 * FLOWSTATE - Authentication & Privacy Gate
 * Manages login, session persistence, and credential updates.
 */

class AuthManager {
  constructor() {
    this.storageKey = 'FLOWSTATE_AUTH_CONFIG_V2';
    this.sessionKey = 'FLOWSTATE_AUTH_SESSION_V2';

    // Configured credentials
    this.defaultCredentials = {
      username: 'AdamFlowState',
      passwordHash: this.hashString('Lv18102002@')
    };

    this.credentials = this.loadCredentials();
    this.isAuthenticated = false;
  }

  // Lightweight hash for client-side local verification
  hashString(str) {
    let hash = 0;
    const salt = '_flowstate_salt_key_';
    const input = str + salt;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  loadCredentials() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erreur chargement auth:', e);
    }
    // Save defaults
    this.saveCredentials(this.defaultCredentials.username, 'Lv18102002@');
    return this.defaultCredentials;
  }

  saveCredentials(username, rawPassword) {
    const data = {
      username: username.trim(),
      passwordHash: this.hashString(rawPassword.trim())
    };
    this.credentials = data;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  checkSession() {
    const session = localStorage.getItem(this.sessionKey) || sessionStorage.getItem(this.sessionKey);
    if (session === 'authenticated') {
      this.isAuthenticated = true;
      return true;
    }
    this.isAuthenticated = false;
    return false;
  }

  login(usernameInput, passwordInput, rememberMe = true) {
    const inputUser = usernameInput.trim().toLowerCase();
    const inputHash = this.hashString(passwordInput.trim());

    if (inputUser === this.credentials.username.toLowerCase() && inputHash === this.credentials.passwordHash) {
      this.isAuthenticated = true;
      if (rememberMe) {
        localStorage.setItem(this.sessionKey, 'authenticated');
      } else {
        sessionStorage.setItem(this.sessionKey, 'authenticated');
      }
      return { success: true };
    }

    return {
      success: false,
      message: 'Identifiant ou mot de passe incorrect.'
    };
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);
    this.isAuthenticated = false;
    this.showLoginScreen();
  }

  initUI() {
    this.cacheElements();
    this.bindEvents();

    if (this.checkSession()) {
      this.hideLoginScreen();
    } else {
      this.showLoginScreen();
    }
  }

  cacheElements() {
    this.loginOverlay = document.getElementById('loginOverlay');
    this.loginForm = document.getElementById('loginForm');
    this.userInput = document.getElementById('loginUsername');
    this.passInput = document.getElementById('loginPassword');
    this.rememberInput = document.getElementById('loginRememberMe');
    this.errorMsg = document.getElementById('loginErrorMsg');
    this.togglePassBtn = document.getElementById('btnTogglePassword');
    this.btnLogout = document.getElementById('btnHeaderLogout');
  }

  bindEvents() {
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLoginSubmit();
      });
    }

    if (this.togglePassBtn && this.passInput) {
      this.togglePassBtn.addEventListener('click', () => {
        const isPass = this.passInput.type === 'password';
        this.passInput.type = isPass ? 'text' : 'password';
        this.togglePassBtn.textContent = isPass ? '🙈' : '👁️';
      });
    }

    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        if (confirm('Voulez-vous verrouiller l’application ?')) {
          this.logout();
        }
      });
    }
  }

  handleLoginSubmit() {
    const username = this.userInput ? this.userInput.value : '';
    const password = this.passInput ? this.passInput.value : '';
    const remember = this.rememberInput ? this.rememberInput.checked : true;

    const result = this.login(username, password, remember);

    if (result.success) {
      if (this.errorMsg) this.errorMsg.style.display = 'none';
      this.hideLoginScreen();
      if (window.app) {
        window.app.showToast(`Bienvenue ${this.credentials.username} ! ✨`);
      }
    } else {
      this.showError(result.message);
    }
  }

  showError(msg) {
    if (!this.errorMsg) return;
    this.errorMsg.textContent = msg;
    this.errorMsg.style.display = 'block';

    const card = document.getElementById('loginCard');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth; // Trigger reflow
      card.classList.add('shake');
    }
  }

  showLoginScreen() {
    if (this.loginOverlay) {
      this.loginOverlay.style.display = 'flex';
      setTimeout(() => {
        this.loginOverlay.style.opacity = '1';
        this.loginOverlay.style.pointerEvents = 'all';
      }, 10);
      if (this.userInput) {
        this.userInput.focus();
      }
    }
  }

  hideLoginScreen() {
    if (this.loginOverlay) {
      this.loginOverlay.style.opacity = '0';
      this.loginOverlay.style.pointerEvents = 'none';
      setTimeout(() => {
        this.loginOverlay.style.display = 'none';
      }, 300);
    }
  }
}

window.authManager = new AuthManager();
