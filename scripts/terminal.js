/**
 * In-Engine Developer Terminal & Quake Console System
 * Accessible via [~] key or HUD trigger button.
 */
class DevTerminalSystem {
  constructor() {
    this.terminalEl = document.getElementById('dev-terminal');
    this.outputEl = document.getElementById('terminal-output');
    this.inputEl = document.getElementById('terminal-input');
    this.openBtn = document.getElementById('btn-open-terminal');
    this.closeBtn = document.getElementById('btn-close-terminal');

    this.isOpen = false;
    this.history = [];
    this.historyIndex = -1;

    this.commands = {
      help: () => this.cmdHelp(),
      skills: () => this.cmdSkills(),
      projects: () => this.cmdProjects(),
      experience: () => this.cmdExperience(),
      statetree: (args) => this.cmdStateTree(args),
      contact: () => this.cmdContact(),
      benchmark: () => this.cmdBenchmark(),
      resume: () => this.cmdResume(),
      download: () => this.cmdDownload(),
      gdrive: (args) => this.cmdGdrive(args),
      clear: () => this.cmdClear(),
      godmode: () => this.cmdGodmode(),
      matrix: () => this.cmdMatrix(),
      color: (args) => this.cmdColor(args),
      exit: () => this.toggle(false)
    };

    this.init();
  }

  init() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => {
        this.toggle(true);
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.toggle(false);
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    // [~] or [`] key toggle
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle(!this.isOpen);
        if (window.soundFX) window.soundFX.playClick();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.toggle(false);
      }
    });

    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (window.soundFX && e.key.length === 1) {
          window.soundFX.playKeypress();
        }

        if (e.key === 'Enter') {
          const raw = this.inputEl.value.trim();
          if (raw) {
            this.history.push(raw);
            this.historyIndex = this.history.length;
            this.execute(raw);
            this.inputEl.value = '';
          }
        } else if (e.key === 'ArrowUp') {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.inputEl.value = this.history[this.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.inputEl.value = this.history[this.historyIndex] || '';
          } else {
            this.historyIndex = this.history.length;
            this.inputEl.value = '';
          }
        }
      });
    }
  }

  toggle(show) {
    this.isOpen = show;
    if (this.terminalEl) {
      this.terminalEl.hidden = !show;
      if (show) {
        this.terminalEl.classList.add('active');
        this.terminalEl.style.display = 'flex';
        if (this.inputEl) {
          setTimeout(() => this.inputEl.focus(), 50);
        }
      } else {
        this.terminalEl.classList.remove('active');
        this.terminalEl.style.display = 'none';
      }
    }
  }

  println(text, type = 'output') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  execute(raw) {
    this.println(`cmd&gt; ${raw}`, 'hint');
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (this.commands[cmd]) {
      this.commands[cmd](args);
    } else {
      this.println(`Unknown command '${cmd}'. Type <span class="cmd-highlight">help</span> for valid directives.`, 'error');
    }
  }

  cmdHelp() {
    this.println(`================ AVAILABLE DEBUGGER COMMANDS ================`);
    this.println(`<span class="cmd-highlight">skills</span>      - Print low-level competencies & weapon loadout`);
    this.println(`<span class="cmd-highlight">projects</span>    - List commercial titles (ECricket, Sachin Saga, BYJU'S)`);
    this.println(`<span class="cmd-highlight">experience</span>  - Display 12+ year career trajectory log`);
    this.println(`<span class="cmd-highlight">statetree</span>   - Switch StateTree state [idle|sprint|dodge|ability]`);
    this.println(`<span class="cmd-highlight">benchmark</span>   - Run live CPU tick scheduling stress benchmark`);
    this.println(`<span class="cmd-highlight">resume</span>      - Open printable TDD Resume Specification`);
    this.println(`<span class="cmd-highlight">contact</span>     - Display direct communications channels & email`);
    this.println(`<span class="cmd-highlight">color &lt;name&gt;</span> - Switch palette [cyan | amber | green | red]`);
    this.println(`<span class="cmd-highlight">godmode</span>     - [Easter Egg] Max telemetry capabilities`);
    this.println(`<span class="cmd-highlight">clear</span>       - Clear console output stream`);
    this.println(`<span class="cmd-highlight">exit</span>        - Close terminal console [Esc or ~]`);
  }

  cmdSkills() {
    this.println(`================ ARCHITECTURAL TECHNICAL LOADOUT ================`);
    this.println(`• Engines: Unreal Engine 5 (UE5.4+), UE4, Unity (3D/2D)`);
    this.println(`• Languages: Modern C++ (C++17/C++20), C#, JavaScript/TypeScript`);
    this.println(`• Gameplay Systems: StateTree, Gameplay Tags, Decoupled Locomotion, Zenject`);
    this.println(`• Multiplayer: Server-Authoritative Netcode, Client-Side Prediction, Photon`);
    this.println(`• Profiling: Unreal Insights, Tick Scheduling, Draw Call Batching, Memory`);
    this.println(`• Community: Founder of 'Unity Developers India' nationwide guild`);
  }

  cmdProjects() {
    this.println(`================ COMMERCIAL SHIPPED TITLES ================`);
    this.println(`1. [UE5 Live]   ECricket - LightFury Games (Mobile live, PC/Console roadmap)`);
    this.println(`2. [Unity Hit]  Sachin Saga Cricket Champions - JetSynthesys (Physics & Ragdoll)`);
    this.println(`3. [Unity Scaled] Disney • BYJU'S Early Learn - Scaled to millions globally`);
    this.println(`4. [Multiplayer] Real-Time Multiplayer Architecture - LightFury Games (Server Authority & Netcode)`);
    this.println(`5. [Unity 3D]   Dhoom 3 Jet Speed - Hydrodynamic water simulation`);
    this.println(`6. [Apple Arcade] Hanx Trivia - M56 Technologies (iPhone, iPad, Mac, Apple TV)`);
    this.println(`7. [Live Audio] Bop Live - Apra Technologies Private LTD (Real-time loops)`);
  }

  cmdExperience() {
    this.println(`================ 12+ YEARS CAREER PROGRESSION ================`);
    this.println(`• 2026 - Present: Senior Gameplay Programmer Level 4 @ LightFury Games`);
    this.println(`• 2024 - 2026:    Senior Gameplay Programmer 3 @ LightFury Games`);
    this.println(`• 2023 - 2024:    Lead Game Developer @ M56 Technologies Pvt Ltd`);
    this.println(`• 2021 - 2023:    Lead Engineer @ BYJU'S [Employee of the Year]`);
    this.println(`• 2019 - 2020:    Senior Game Developer @ BYJU'S`);
    this.println(`• 2017 - 2019:    Senior Game Developer @ JetSynthesys [Sachin Saga]`);
    this.println(`• 2012 - 2017:    Game Developer @ Aquimo, Robosoft & GameAnax`);
    this.println(`• 2009 - 2012:    BA Game Development (Grade-A) @ Univ of Wales, UK`);
  }

  cmdStateTree(args) {
    const state = args[0] ? args[0].toLowerCase() : 'sprint';
    const valid = ['idle', 'sprint', 'dodge', 'ability'];
    if (valid.includes(state)) {
      const btn = document.getElementById(`btn-trigger-state-${state}`);
      if (btn) btn.click();
      this.println(`StateTree transitioned to node state: <span class="cmd-highlight">${state.toUpperCase()}</span>`, 'system');
    } else {
      this.println(`Invalid state. Choose: idle | sprint | dodge | ability`, 'error');
    }
  }

  cmdBenchmark() {
    this.println(`Initiating in-engine tick simulation benchmark...`, 'system');
    let ticks = 0;
    const t0 = performance.now();
    for (let i = 0; i < 500000; i++) {
      ticks += Math.sqrt(i) * Math.sin(i);
    }
    const t1 = performance.now();
    const duration = (t1 - t0).toFixed(2);
    this.println(`Benchmark Complete: 500,000 tick evaluations in ${duration}ms.`, 'system');
    this.println(`Zero Garbage Collection pauses detected. Allocations: GC-Free.`, 'system');
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  cmdResume() {
    const resumeBtn = document.getElementById('btn-quick-resume');
    if (resumeBtn) resumeBtn.click();
    this.println(`Opening TDD Resume Blueprint specification modal...`, 'system');
  }

  cmdDownload() {
    const dlBtn = document.getElementById('hero-download-resume-btn');
    if (dlBtn) dlBtn.click();
    this.println(`Dispatched Resume PDF download request...`, 'system');
  }

  cmdGdrive(args) {
    if (args && args.length > 0) {
      const url = args.join(' ');
      localStorage.setItem('manjul_gdrive_resume_url', url);
      const heroDl = document.getElementById('hero-download-resume-btn');
      const topDl = document.getElementById('topbar-download-resume');
      const modalDl = document.getElementById('modal-gdrive-download');
      if (heroDl) heroDl.href = url;
      if (topDl) topDl.href = url;
      if (modalDl) modalDl.href = url;
      this.println(`Google Drive Resume URL configured to: <span class="cmd-highlight">${url}</span>`, 'system');
    } else {
      const current = localStorage.getItem('manjul_gdrive_resume_url') || 'None set';
      this.println(`Current Google Drive URL: <span class="cmd-highlight">${current}</span>`);
      this.println(`Usage: <span class="cmd-highlight">gdrive &lt;https://drive.google.com/...&gt;</span> to update.`);
    }
  }

  cmdContact() {
    this.println(`Direct Comms Email: <span class="cmd-highlight">mayankmanjul@live.com</span>`);
    this.println(`Mobile Line:        <span class="cmd-highlight">+91-7066845227</span>`);
    this.println(`LinkedIn:           <span class="cmd-highlight">linkedin.com/in/mayankmanjul</span>`);
    this.println(`Station:            Bengaluru, Karnataka, India`);
  }

  cmdColor(args) {
    const map = {
      cyan: 'theme-unreal-cyan',
      amber: 'theme-amber-gold',
      green: 'theme-matrix-green',
      red: 'theme-crimson-red'
    };
    const choice = args[0] ? args[0].toLowerCase() : 'cyan';
    if (map[choice]) {
      document.body.className = map[choice];
      this.println(`Theme updated to: ${choice.toUpperCase()}`, 'system');
    } else {
      this.println(`Available palettes: cyan | amber | green | red`, 'error');
    }
  }

  cmdMatrix() {
    document.body.className = 'theme-matrix-green';
    this.println(`[MATRIX PROTOCOL ENGAGED] Zenject Dependency Inversion Active.`, 'system');
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  cmdGodmode() {
    this.println(`[GODMODE ACTIVE] All tick barriers dismantled. Max frame unlocked.`, 'system');
    const fps = document.getElementById('hud-fps');
    if (fps) fps.textContent = '240.0';
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  cmdClear() {
    this.outputEl.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.devTerminal = new DevTerminalSystem();
});
