/**
 * Canvas roundRect Polyfill for universal cross-browser compatibility
 */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (typeof radii === 'number') radii = [radii];
    const r = (radii && radii[0]) || 0;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

/**
 * AAA-Grade Interactive Gameplay Simulator & Physics Engine
 * Modes:
 * 1. Hydrodynamics & Wave Buoyancy (Dhoom 3 Jet Speed)
 * 2. Cricket Ballistics & Magnus Trajectory (Sachin Saga)
 * 3. Server Replication & Client-Side Prediction (Netcode)
 * 4. Articulated Verlet Ragdoll & Dynamic Collisions
 */
class PhysicsSandboxEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // UI Controls
    this.modeSelect = document.getElementById('sim-mode-select');
    this.tickSlider = document.getElementById('tick-rate-slider');
    this.tickValLabel = document.getElementById('tick-rate-val');
    this.fireBtn = document.getElementById('btn-fire-sim');
    this.fireBtnText = document.getElementById('btn-fire-text');
    this.secBtn = document.getElementById('btn-secondary-sim');
    this.secBtnText = document.getElementById('btn-secondary-text');
    this.clearBtn = document.getElementById('btn-clear-sim');

    // Buoyancy specific controls
    this.waveAmpSlider = document.getElementById('wave-amp-slider');
    this.waveAmpVal = document.getElementById('wave-amp-val');
    this.waveFreqSlider = document.getElementById('wave-freq-slider');
    this.waveFreqVal = document.getElementById('wave-freq-val');

    // Cricket specific controls (Sachin Saga)
    this.cricketDeliverySelect = document.getElementById('cricket-delivery-type');
    this.cricketLengthSlider = document.getElementById('cricket-length-slider');
    this.cricketLengthVal = document.getElementById('cricket-length-val');
    this.cricketLineSlider = document.getElementById('cricket-line-slider');
    this.cricketLineVal = document.getElementById('cricket-line-val');
    this.cricketSpeedSlider = document.getElementById('cricket-speed-slider');
    this.cricketSpeedVal = document.getElementById('cricket-speed-val');
    this.simTimeScale = 1.0;

    // Netcode specific controls
    this.pingSlider = document.getElementById('ping-slider');
    this.pingValLabel = document.getElementById('ping-val');
    this.lossSlider = document.getElementById('loss-slider');
    this.lossValLabel = document.getElementById('loss-val');
    this.autoToggle = document.getElementById('netcode-auto-toggle');
    this.autoValLabel = document.getElementById('netcode-auto-label');

    // Telemetry DOM
    this.actorCountLabel = document.getElementById('sim-actor-count');
    this.buoyancyStatLabel = document.getElementById('sim-buoyancy-stat');
    this.speedStatLabel = document.getElementById('sim-speed-stat');
    this.modeIndicator = document.getElementById('sim-mode-indicator');
    this.predictionStatus = document.getElementById('sim-lag-mitigation-status');
    this.instructionsText = document.getElementById('sandbox-instructions-text');

    // Mini graph canvases
    this.graphFrametimeCanvas = document.getElementById('graph-canvas-frametime');
    this.graphDriftCanvas = document.getElementById('graph-canvas-drift');
    this.graphAllocCanvas = document.getElementById('graph-canvas-alloc');
    this.deltaReadout = document.getElementById('graph-delta-readout');
    this.driftReadout = document.getElementById('graph-drift-readout');

    // Simulation Config
    this.mode = 'netcode'; // 'buoyancy' | 'trajectory' | 'netcode' | 'ragdoll'
    this.tickRate = 60;
    this.simulatedPing = 150; // ms RTT
    this.packetLoss = 5; // %
    this.totalCollisions = 0;

    // Simulation Time
    this.simTime = 0;
    this.lastTime = performance.now();
    this.tickAccumulator = 0;

    // Throttle input state
    this.throttleActive = false;

    // Particle FX Pool
    this.particles = [];

    // Mode-specific states
    this.initBuoyancyState();
    this.initTrajectoryState();
    this.initNetcodeState();
    this.initRagdollState();

    // Telemetry buffers
    this.frameHistory = new Array(50).fill(16.6);
    this.driftHistory = new Array(50).fill(0.2);

    this.init();
  }

  /* ==========================================================================
     INITIALIZATION & EVENT HOOKS
     ========================================================================== */
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mode selector change
    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        this.mode = e.target.value;
        this.updateModeUI();
        this.resetWorld();
        if (this.mode === 'trajectory') {
          setTimeout(() => this.bowlCricketBall(), 250);
        }
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    // Sliders
    if (this.tickSlider) {
      this.tickSlider.addEventListener('input', (e) => {
        this.tickRate = parseInt(e.target.value);
        if (this.tickValLabel) this.tickValLabel.textContent = `${this.tickRate} Hz`;
      });
    }

    if (this.waveAmpSlider) {
      this.waveAmpSlider.addEventListener('input', (e) => {
        this.buoyancyState.waveAmplitude = parseFloat(e.target.value);
        if (this.waveAmpVal) this.waveAmpVal.textContent = `${this.buoyancyState.waveAmplitude} px`;
      });
    }

    if (this.waveFreqSlider) {
      this.waveFreqSlider.addEventListener('input', (e) => {
        this.buoyancyState.waveFrequency = parseFloat(e.target.value);
        if (this.waveFreqVal) this.waveFreqVal.textContent = `${this.buoyancyState.waveFrequency.toFixed(1)}x`;
      });
    }

    // Cricket controls
    if (this.cricketDeliverySelect) {
      this.cricketDeliverySelect.addEventListener('change', (e) => {
        this.cricketState.deliveryType = e.target.value;
        this.computePredictedTrajectory();
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    if (this.cricketLengthSlider) {
      this.cricketLengthSlider.addEventListener('input', (e) => {
        const len = parseFloat(e.target.value);
        this.cricketState.pitchLengthMeters = len;
        let desc = 'GOOD LENGTH';
        if (len < 3.5) desc = 'DEADLY YORKER';
        else if (len < 5.0) desc = 'FULL LENGTH';
        else if (len < 8.0) desc = 'GOOD LENGTH';
        else desc = 'SHORT PITCH BOUNCER';
        if (this.cricketLengthVal) this.cricketLengthVal.textContent = `${desc} (${len.toFixed(1)}m)`;
        this.computePredictedTrajectory();
      });
    }

    if (this.cricketLineSlider) {
      this.cricketLineSlider.addEventListener('input', (e) => {
        const line = parseFloat(e.target.value);
        this.cricketState.targetMarkerX = line;
        let lineDesc = 'MIDDLE STUMP';
        if (line < -0.12) lineDesc = `OUTSIDE OFF (${Math.abs(line).toFixed(2)}m)`;
        else if (line > 0.12) lineDesc = `DOWN LEG (+${line.toFixed(2)}m)`;
        if (this.cricketLineVal) this.cricketLineVal.textContent = lineDesc;
        this.computePredictedTrajectory();
      });
    }

    if (this.cricketSpeedSlider) {
      this.cricketSpeedSlider.addEventListener('input', (e) => {
        const spd = parseFloat(e.target.value);
        this.simTimeScale = spd;
        let desc = `${spd.toFixed(2)}x (REAL-TIME)`;
        if (spd <= 0.3) desc = `${spd.toFixed(2)}x (HAWK-EYE SLOW-MO)`;
        else if (spd <= 0.6) desc = `${spd.toFixed(2)}x (HALF SPEED)`;
        if (this.cricketSpeedVal) this.cricketSpeedVal.textContent = desc;
      });
    }

    if (this.pingSlider) {
      this.pingSlider.addEventListener('input', (e) => {
        this.simulatedPing = parseInt(e.target.value);
        if (this.pingValLabel) this.pingValLabel.textContent = `${this.simulatedPing} ms`;
      });
    }

    if (this.lossSlider) {
      this.lossSlider.addEventListener('input', (e) => {
        this.packetLoss = parseInt(e.target.value);
        if (this.lossValLabel) this.lossValLabel.textContent = `${this.packetLoss}%`;
      });
    }

    if (this.autoToggle) {
      this.autoToggle.addEventListener('change', (e) => {
        if (this.netcodeState) {
          this.netcodeState.autoPilot = e.target.checked;
          if (this.autoValLabel) {
            this.autoValLabel.textContent = e.target.checked ? 'AUTO-PILOT ACTIVE' : 'MANUAL WASD STEERING';
            this.autoValLabel.className = e.target.checked ? 'text-emerald' : 'text-cyan';
          }
        }
      });
    }

    // Buttons
    if (this.fireBtn) {
      this.fireBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handlePrimaryActionClick();
      });
      this.fireBtn.addEventListener('mousedown', () => this.handlePrimaryActionStart());
      this.fireBtn.addEventListener('mouseup', () => this.handlePrimaryActionEnd());
      this.fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handlePrimaryActionStart(); });
      this.fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.handlePrimaryActionEnd(); });
    }

    if (this.secBtn) {
      this.secBtn.addEventListener('click', () => this.handleSecondaryAction());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.resetWorld();
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    // Canvas Mouse & Touch Interaction
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    // Mobile Touch Bindings
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: true });

    window.addEventListener('touchend', () => this.onMouseUp(), { passive: true });

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      if (this.mode === 'netcode' && this.netcodeState) {
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
          if (k.startsWith('arrow')) e.preventDefault();
          this.netcodeState.keys.add(k);
          if (this.netcodeState.autoPilot) {
            this.netcodeState.autoPilot = false;
            if (this.autoToggle) this.autoToggle.checked = false;
            if (this.autoValLabel) {
              this.autoValLabel.textContent = 'MANUAL WASD STEERING';
              this.autoValLabel.className = 'text-cyan';
            }
          }
        }
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (this.mode !== 'netcode') e.preventDefault();
        this.handlePrimaryActionClick();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.mode === 'netcode' && this.netcodeState) {
        this.netcodeState.keys.delete(e.key.toLowerCase());
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.handlePrimaryActionEnd();
      }
    });

    this.updateModeUI();
    this.resetWorld();

    this.loop = this.loop.bind(this);
    this.running = false;
    this.observer = new IntersectionObserver(([entry]) => {
      this.running = entry.isIntersecting;
      if (this.running) {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
      }
    }, { threshold: 0.05 });
    if (this.canvas) this.observer.observe(this.canvas);
    else requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const displayW = (rect && rect.width > 50) ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 960);
    const isMobile = window.innerWidth <= 600;
    const targetH = isMobile ? 350 : 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for smooth mobile GPU performance
    this.canvas.width = displayW * dpr;
    this.canvas.height = targetH * dpr;
    this.scale = dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
    this.ctx.scale(this.scale, this.scale);
  }

  updateModeUI() {
    const buoyancyGroup = document.getElementById('ctrl-group-buoyancy');
    const buoyancyFreqGroup = document.getElementById('ctrl-group-buoyancy-freq');
    const cricketTypeGroup = document.getElementById('ctrl-group-cricket-type');
    const cricketLengthGroup = document.getElementById('ctrl-group-cricket-length');
    const cricketLineGroup = document.getElementById('ctrl-group-cricket-line');
    const cricketSpeedGroup = document.getElementById('ctrl-group-cricket-speed');
    const netcodeDelayBox = document.getElementById('netcode-delay-box');
    const netcodeLossBox = document.getElementById('netcode-loss-box');

    // Hide all dynamic groups first
    if (buoyancyGroup) buoyancyGroup.style.display = 'none';
    if (buoyancyFreqGroup) buoyancyFreqGroup.style.display = 'none';
    if (cricketTypeGroup) cricketTypeGroup.style.display = 'none';
    if (cricketLengthGroup) cricketLengthGroup.style.display = 'none';
    if (cricketLineGroup) cricketLineGroup.style.display = 'none';
    if (cricketSpeedGroup) cricketSpeedGroup.style.display = 'none';
    if (netcodeDelayBox) netcodeDelayBox.style.display = 'none';
    if (netcodeLossBox) netcodeLossBox.style.display = 'none';

    if (this.mode === 'buoyancy') {
      if (buoyancyGroup) buoyancyGroup.style.display = 'flex';
      if (buoyancyFreqGroup) buoyancyFreqGroup.style.display = 'flex';
      if (this.fireBtnText) this.fireBtnText.textContent = 'HOLD THROTTLE [W / ↑]';
      if (this.secBtnText) this.secBtnText.textContent = 'DROP BUOYANT CARGO';
      if (this.secBtn) this.secBtn.style.display = 'inline-flex';
      this.modeIndicator.textContent = 'MODE: HYDRODYNAMICS_BUOYANCY_SOLVER';
      this.predictionStatus.textContent = 'SOLVER: ARCHIMEDES_MULTI_POINT_DRAFT';
      if (this.instructionsText) {
        this.instructionsText.innerHTML = '<strong>Controls:</strong> Press/Hold [W] or [↑] to fire Jet-Ski throttle across waves • Click anywhere in water to spawn floating cargo barrels!';
      }
    } else if (this.mode === 'trajectory') {
      if (cricketTypeGroup) cricketTypeGroup.style.display = 'flex';
      if (cricketLengthGroup) cricketLengthGroup.style.display = 'flex';
      if (cricketLineGroup) cricketLineGroup.style.display = 'flex';
      if (cricketSpeedGroup) cricketSpeedGroup.style.display = 'flex';
      if (this.fireBtnText) this.fireBtnText.textContent = 'BOWL EXPRESS DELIVERY [SPACE]';
      if (this.secBtnText) this.secBtnText.textContent = 'HAWK-EYE SLOW-MO REPLAY';
      if (this.secBtn) this.secBtn.style.display = 'inline-flex';
      this.modeIndicator.textContent = 'MODE: SACHIN_SAGA_3D_HAWKEYE_ENGINE';
      this.predictionStatus.textContent = 'PHYSICS: 3D_MAGNUS_SEAM_AERODYNAMICS';
      if (this.instructionsText) {
        this.instructionsText.innerHTML = '<strong>Controls:</strong> Click anywhere on the 22-yard pitch to place Target Marker • Press [Space] or click BOWL to deliver • Press [Space] or click when ball arrives at crease to SMASH IT • Click SLOW-MO REPLAY to review the full 3D ball path!';
      }
      this.computePredictedTrajectory();
    } else if (this.mode === 'netcode') {
      const netcodeAutoBox = document.getElementById('netcode-auto-box');
      if (netcodeDelayBox) netcodeDelayBox.style.display = 'flex';
      if (netcodeLossBox) netcodeLossBox.style.display = 'flex';
      if (netcodeAutoBox) netcodeAutoBox.style.display = 'flex';
      if (this.fireBtnText) this.fireBtnText.textContent = 'TOGGLE AUTO-PILOT';
      if (this.secBtnText) this.secBtnText.textContent = 'INJECT SERVER DESYNC';
      if (this.secBtn) this.secBtn.style.display = 'inline-flex';
      this.modeIndicator.textContent = 'MODE: SERVER_REPLICATION_CLIENT_PREDICTION';
      this.predictionStatus.textContent = 'RECONCILIATION: REWIND_REPLAY_DETERMINISTIC';
      if (this.instructionsText) {
        this.instructionsText.innerHTML = '<strong>Controls:</strong> Steer predicted ship with [W/A/S/D] or [Arrow Keys] • Click or Drag canvas to navigate • Turn off Auto-Pilot to test manual prediction • Raise Ping and Packet Loss to stress reconciliation!';
      }
    } else if (this.mode === 'ragdoll') {
      if (this.fireBtnText) this.fireBtnText.textContent = 'LAUNCH RAGDOLL IMPULSE';
      if (this.secBtnText) this.secBtnText.textContent = 'SPAWN EXTRA MANNEQUIN';
      if (this.secBtn) this.secBtn.style.display = 'inline-flex';
      this.modeIndicator.textContent = 'MODE: VERLET_ARTICULATED_RAGDOLL_IK';
      this.predictionStatus.textContent = 'SOLVER: RELAXATION_CONSTRAINT_SOLVER';
      if (this.instructionsText) {
        this.instructionsText.innerHTML = '<strong>Controls:</strong> Click and DRAG ANY LIMB directly with mouse to throw or position the ragdoll • Press [Space] for kinetic impulse blast!';
      }
    }
  }

  resetWorld() {
    this.particles = [];
    const w = this.canvas.width / this.scale;
    const h = this.canvas.height / this.scale;

    if (this.mode === 'buoyancy') {
      this.buoyancyState.vessel.x = w * 0.28;
      this.buoyancyState.vessel.y = 280;
      this.buoyancyState.vessel.vx = 75;
      this.buoyancyState.vessel.vy = 0;
      this.buoyancyState.vessel.angle = 0;
      this.buoyancyState.vessel.angVel = 0;
      this.buoyancyState.vessel.throttle = 0.24;
      this.buoyancyState.floatingCrates = [];
      // Seed with 2 cargo barrels
      this.spawnBuoyantCrate(w * 0.55, 200, 24, 24);
      this.spawnBuoyantCrate(w * 0.75, 180, 28, 20);
    } else if (this.mode === 'trajectory') {
      this.resetCricketPitch();
    } else if (this.mode === 'netcode') {
      this.netcodeState.serverX = w * 0.5;
      this.netcodeState.clientPredictedX = w * 0.5;
      this.netcodeState.clientRawX = w * 0.5;
      this.netcodeState.targetX = w * 0.5;
      this.netcodeState.history = [];
      this.netcodeState.packets = [];
      this.netcodeState.rollbackActive = false;
    } else if (this.mode === 'ragdoll') {
      this.ragdollState.ragdolls = [];
      this.spawnVerletMannequin(w * 0.5, 120);
    }
  }

  /* ==========================================================================
     1. HYDRODYNAMICS & WAVE BUOYANCY (DHOOM 3 JET SPEED)
     ========================================================================== */
  initBuoyancyState() {
    this.buoyancyState = {
      baseWaterY: 300,
      waveAmplitude: 24,
      waveFrequency: 1.8,
      vessel: {
        x: 200,
        y: 280,
        vx: 0,
        vy: 0,
        angle: 0,
        angVel: 0,
        throttle: 0,
        width: 72,
        height: 24,
        mass: 380,
        inWater: true,
        knots: 0
      },
      floatingCrates: []
    };
  }

  // Analytical Gerstner / Multi-Sine Wave surface height
  getWaterHeight(x, t) {
    const amp = this.buoyancyState.waveAmplitude;
    const freq = this.buoyancyState.waveFrequency * 0.007;
    const speed = 2.2;

    const w1 = Math.sin(x * freq + t * speed) * amp;
    const w2 = Math.sin(x * freq * 2.1 + t * speed * 1.4 + 1.2) * (amp * 0.35);
    const w3 = Math.cos(x * freq * 0.6 - t * speed * 0.8) * (amp * 0.2);

    return this.buoyancyState.baseWaterY + w1 + w2 + w3;
  }

  // Wave slope tangent
  getWaterSlope(x, t) {
    const dx = 4;
    const y1 = this.getWaterHeight(x - dx, t);
    const y2 = this.getWaterHeight(x + dx, t);
    return Math.atan2(y2 - y1, dx * 2);
  }

  updateBuoyancy(dt) {
    const v = this.buoyancyState.vessel;
    const t = this.simTime;
    const w = this.canvas.width / this.scale;
    const gravity = 550; // px/s^2

    // 1. Throttle acceleration
    const baseCruise = 0.24;
    if (this.throttleActive) {
      v.throttle = Math.min(1.0, v.throttle + dt * 2.8);
      // Spawn engine spray wake particles from stern
      const sternX = v.x - Math.cos(v.angle) * (v.width * 0.45);
      const sternY = v.y - Math.sin(v.angle) * (v.width * 0.45) + 4;

      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: sternX + (Math.random() - 0.5) * 6,
          y: sternY + (Math.random() - 0.5) * 4,
          vx: -Math.cos(v.angle) * (180 + Math.random() * 80) + (Math.random() - 0.5) * 30,
          vy: -Math.random() * 60 - 20,
          life: 0.45,
          maxLife: 0.45,
          color: 'rgba(180, 240, 255, 0.75)',
          size: Math.random() * 4 + 2
        });
      }
    } else {
      v.throttle = Math.max(baseCruise, v.throttle - dt * 1.5);
      // Subtle cruising wake
      if (Math.random() < 0.25) {
        const sternX = v.x - Math.cos(v.angle) * (v.width * 0.45);
        const sternY = v.y - Math.sin(v.angle) * (v.width * 0.45) + 4;
        this.particles.push({
          x: sternX,
          y: sternY,
          vx: -Math.cos(v.angle) * 35 + (Math.random() - 0.5) * 10,
          vy: -Math.random() * 15 - 5,
          life: 0.35,
          maxLife: 0.35,
          color: 'rgba(180, 240, 255, 0.4)',
          size: Math.random() * 2 + 1
        });
      }
    }

    // Forward thrust along heading
    const thrust = v.throttle * 900;
    v.vx += Math.cos(v.angle) * thrust * dt;
    v.vy += Math.sin(v.angle) * thrust * dt * 0.3;

    // Apply Gravity
    v.vy += gravity * dt;

    // Sample 3 draft points along hull (stern, amidships, bow)
    const offsets = [-v.width * 0.4, 0, v.width * 0.4];
    let totalBuoyancy = 0;
    let totalTorque = 0;
    let submergedPoints = 0;

    for (let offset of offsets) {
      const px = v.x + Math.cos(v.angle) * offset;
      const py = v.y + Math.sin(v.angle) * offset + 6;
      const waterY = this.getWaterHeight(px, t);

      if (py > waterY) {
        submergedPoints++;
        const immersion = Math.min(40, py - waterY);
        const fb = immersion * 420; // Archimedes buoyant upward force
        totalBuoyancy += fb;

        // Torque about center of mass: cross product (rx * Fy - ry * Fx)
        const rx = Math.cos(v.angle) * offset;
        totalTorque += rx * (-fb * 0.08);

        // Water drag & damping
        v.vx *= (1 - 0.02 * dt * 60);
        v.vy *= (1 - 0.06 * dt * 60);
      }
    }

    // Apply Buoyancy force
    v.vy -= (totalBuoyancy / v.mass) * dt * 45;

    // Align hull with local water slope
    const targetSlope = this.getWaterSlope(v.x, t);
    const slopeDiff = targetSlope - v.angle;
    totalTorque += slopeDiff * 250;

    // Apply angular torque & damping
    v.angVel += (totalTorque / v.mass) * dt * 40;
    v.angVel *= (1 - 0.08 * dt * 60);
    v.angle += v.angVel * dt;

    // Integrate Position
    v.x += v.vx * dt;
    v.y += v.vy * dt;

    // Screen wrap
    if (v.x > w + 60) v.x = -50;
    if (v.x < -60) v.x = w + 50;

    // Detect splashdown when falling from air into water
    const midWaterY = this.getWaterHeight(v.x, t);
    if (!v.inWater && v.y >= midWaterY) {
      v.inWater = true;
      if (Math.abs(v.vy) > 80) {
        this.triggerWaterSplash(v.x, midWaterY, Math.min(30, Math.abs(v.vy) / 6));
        if (window.soundFX) window.soundFX.playImpactSound(0.25);
      }
    } else if (v.y < midWaterY - 10) {
      v.inWater = false;
    }

    // Speed in knots calculation
    v.knots = Math.sqrt(v.vx * v.vx + v.vy * v.vy) * 0.12;

    // 2. Update Floating Cargo Crates
    for (let c of this.buoyancyState.floatingCrates) {
      c.vy += gravity * dt;
      const crateWaterY = this.getWaterHeight(c.x, t);

      if (c.y + c.h * 0.5 > crateWaterY) {
        const submersion = (c.y + c.h * 0.5) - crateWaterY;
        const crateFb = submersion * 850;
        c.vy -= crateFb * dt;
        c.vy *= 0.92;
        c.vx *= 0.95;

        // Drift with wave current
        c.vx += (this.buoyancyState.waveFrequency * 8 - c.vx) * 0.02;

        const localSlope = this.getWaterSlope(c.x, t);
        c.angle += (localSlope - c.angle) * 0.12;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (c.x > w + 40) c.x = -30;
    }

    // Telemetry updates
    if (this.buoyancyStatLabel) {
      const draftPct = Math.min(100, Math.round((submergedPoints / 3) * 100));
      this.buoyancyStatLabel.textContent = `${draftPct}% DRAFT BUOYANT`;
    }
    if (this.speedStatLabel) {
      this.speedStatLabel.textContent = `${v.knots.toFixed(1)} KNOTS`;
    }
    if (this.actorCountLabel) {
      this.actorCountLabel.textContent = `1 Jet-Ski • ${this.buoyancyState.floatingCrates.length} Cargo`;
    }
  }

  triggerWaterSplash(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 0.8) + Math.random() * (Math.PI * 1.4);
      const spd = 60 + Math.random() * 180;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 2,
        vx: Math.cos(angle) * spd,
        vy: -Math.abs(Math.sin(angle)) * spd,
        life: 0.6,
        maxLife: 0.6,
        color: 'rgba(210, 248, 255, 0.85)',
        size: Math.random() * 4 + 2
      });
    }
  }

  spawnBuoyantCrate(x, y, w = 26, h = 26) {
    this.buoyancyState.floatingCrates.push({
      x, y, vx: (Math.random() - 0.5) * 40, vy: 0,
      w, h, angle: 0,
      color: '#ffb800'
    });
    this.triggerWaterSplash(x, this.getWaterHeight(x, this.simTime), 15);
    if (window.soundFX) window.soundFX.playLaunchSound();
  }

  /* ==========================================================================
     2. 3D BROADCAST CRICKET BALLISTICS & MAGNUS SWING (SACHIN SAGA)
     ========================================================================== */
  initTrajectoryState() {
    this.cricketState = {
      deliveryType: 'outswing',
      pitchLengthMeters: 6.5, // distance from batsman stumps (2 = yorker, 6.5 = good length, 10.5 = bouncer)
      targetMarkerX: 0.18,    // lateral target meters (-0.6 offside to +0.6 legside)
      hoverTarget: null,
      speedKmph: 145.4,
      bounceSpeedKmph: 125.8,
      swingDeviationCm: 0,
      seamCutDeviationCm: 0,
      bounceAngleDeg: 16.5,
      predictedTrajectory: [],
      lastDeliveryReplay: [],
      isReplaying: false,
      replayFrameIndex: 0,
      ball: {
        active: false,
        x: 0.35,  // release position
        y: 2.15,
        z: 0.5,
        vx: 0,
        vy: 0,
        vz: 0,
        bounced: false,
        bounceX: 0,
        bounceY: 0,
        bounceZ: 0,
        seamAngle: 0.25,
        swingAccumX: 0,
        seamCutAccumX: 0,
        hitResult: null,
        hitSubtext: '',
        shotDistanceM: 0,
        trail: [] // full 3D points
      },
      batsman: {
        x: 0.12,
        y: 0,
        z: 21.0,
        isSwinging: false,
        swingProgress: 0,
        connected: false,
        timingDeltaMs: 0,
        timingRating: ''
      },
      wickets: {
        stumps: [
          { x: -0.09, y: 0, z: 22.0, h: 0.72, shattered: false, rotX: 0, rotZ: 0, vx: 0, vy: 0, vz: 0 },
          { x: 0.0,   y: 0, z: 22.0, h: 0.72, shattered: false, rotX: 0, rotZ: 0, vx: 0, vy: 0, vz: 0 },
          { x: 0.09,  y: 0, z: 22.0, h: 0.72, shattered: false, rotX: 0, rotZ: 0, vx: 0, vy: 0, vz: 0 }
        ],
        bails: [
          { x: -0.045, y: 0.73, z: 22.0, shattered: false, vx: 0, vy: 0, vz: 0, rot: 0 },
          { x: 0.045,  y: 0.73, z: 22.0, shattered: false, vx: 0, vy: 0, vz: 0, rot: 0 }
        ]
      }
    };
    this.computePredictedTrajectory();
  }

  // 3D Perspective Projector: Maps (x, y, z) into 2D Screen space
  // z = 0 (Bowler) to z = 22 (Batsman & Stumps)
  projectCricket3D(x, y, z, w, h) {
    const normZ = Math.max(0, z / 22.0);
    const topY = h * 0.30;
    const bottomY = h * 0.94;
    const pitchWidthNear = 340;
    const pitchWidthFar = 80;

    const curPitchWidth = pitchWidthNear - Math.min(1.0, normZ) * (pitchWidthNear - pitchWidthFar);
    const groundY = bottomY - Math.min(1.0, normZ) * (bottomY - topY);

    const scale = Math.max(0.18, 1.0 - normZ * 0.72);
    const screenX = (w * 0.5) + (x / 1.52) * (curPitchWidth * 0.5);
    const screenY = groundY - (y * 70 * scale);

    return { x: screenX, y: screenY, groundY: groundY, scale: scale, normZ: normZ };
  }

  // Inverse Raycaster: Maps (screenX, screenY) on turf surface (y = 0) back to 3D (x, z)
  unprojectCricket3D(screenX, screenY, w, h) {
    const topY = h * 0.30;
    const bottomY = h * 0.94;
    const pitchWidthNear = 340;
    const pitchWidthFar = 80;

    const normZ = (bottomY - screenY) / (bottomY - topY);
    if (normZ < -0.05 || normZ > 1.08) return null;

    const z = normZ * 22.0;
    const curPitchWidth = pitchWidthNear - normZ * (pitchWidthNear - pitchWidthFar);
    const x = ((screenX - (w * 0.5)) / (curPitchWidth * 0.5)) * 1.52;

    return { x, z, normZ };
  }

  resetCricketPitch() {
    const cs = this.cricketState;
    if (!cs) return;
    const b = cs.ball;
    b.active = false;
    b.hitResult = null;
    b.hitSubtext = '';
    b.bounced = false;

    cs.batsman.isSwinging = false;
    cs.batsman.swingProgress = 0;
    cs.batsman.connected = false;

    // Reset wickets
    cs.wickets.stumps.forEach((s, idx) => {
      s.x = (idx - 1) * 0.09;
      s.y = 0;
      s.z = 22.0;
      s.shattered = false;
      s.rotX = 0; s.rotZ = 0;
      s.vx = 0; s.vy = 0; s.vz = 0;
    });

    cs.wickets.bails.forEach((bail, idx) => {
      bail.x = (idx === 0 ? -0.045 : 0.045);
      bail.y = 0.73;
      bail.z = 22.0;
      bail.shattered = false;
      bail.vx = 0; bail.vy = 0; bail.vz = 0;
      bail.rot = 0;
    });

    if (this.fireBtnText) {
      this.fireBtnText.textContent = 'BOWL EXPRESS DELIVERY [SPACE]';
    }

    this.computePredictedTrajectory();
  }

  computePredictedTrajectory() {
    const cs = this.cricketState;
    if (!cs) return;
    const dType = cs.deliveryType || 'outswing';
    const lengthMeters = cs.pitchLengthMeters || 6.5;
    const targetX = cs.targetMarkerX !== undefined ? cs.targetMarkerX : 0.18;

    let speed = 40.5;
    if (dType === 'yorker') speed = 41.2;
    else if (dType === 'bouncer') speed = 42.4;
    else if (dType === 'legcutter' || dType === 'offcutter') speed = 34.8;
    else if (dType === 'inswing') speed = 41.0;
    else if (dType === 'reverse') speed = 40.8;

    const zBounce = Math.max(7.5, Math.min(21.4, 22.0 - lengthMeters));
    const tBounce = Math.max(0.18, (zBounce - 0.5) / speed);
    const g = 9.81;

    // Direct analytical launch velocity to land at target
    const vy0 = (-2.15 + 0.5 * g * tBounce * tBounce) / tBounce;
    const vx0 = (targetX - 0.35) / tBounce;

    let simX = 0.35, simY = 2.15, simZ = 0.5;
    let simVx = vx0, simVy = vy0, simVz = speed;
    let simBounced = false;

    const pts = [{ x: simX, y: simY, z: simZ, bounced: false, speed: speed * 3.6 }];
    const simDt = 0.018;

    for (let step = 0; step < 85; step++) {
      const vMag = Math.hypot(simVx, simVy, simVz);
      simVx -= 0.0035 * vMag * simVx * simDt;
      simVy -= (g + 0.0035 * vMag * simVy) * simDt;
      simVz -= 0.0035 * vMag * simVz * simDt;

      // Aerodynamic Swing
      if (simZ > 6.0 && !simBounced) {
        if (dType === 'outswing') simVx += 2.2 * simDt;
        else if (dType === 'inswing') simVx -= 2.6 * simDt;
        else if (dType === 'reverse' && simZ > 12.0) simVx -= 4.2 * simDt;
      }

      simX += simVx * simDt;
      simY += simVy * simDt;
      simZ += simVz * simDt;

      if (simY <= 0.04 && simVz > 0 && !simBounced) {
        simY = 0.04;
        simBounced = true;
        const rest = dType === 'bouncer' ? 0.76 : (dType === 'yorker' ? 0.40 : 0.64);
        simVy = -simVy * rest;
        simVz *= 0.86;

        if (dType === 'legcutter') simVx += 2.4;
        else if (dType === 'offcutter') simVx -= 2.5;
      }

      pts.push({ x: simX, y: simY, z: simZ, bounced: simBounced, speed: vMag * 3.6 });
      if (simZ >= 23.5) break;
    }

    cs.predictedTrajectory = pts;
  }

  bowlCricketBall() {
    this.resetCricketPitch();
    const cs = this.cricketState;
    const b = cs.ball;

    cs.isReplaying = false;
    cs.lastDeliveryReplay = [];

    const dType = cs.deliveryType || 'outswing';
    const lengthMeters = cs.pitchLengthMeters || 6.5;
    const targetX = cs.targetMarkerX !== undefined ? cs.targetMarkerX : 0.18;

    let speed = 40.5; // ~145.8 km/h
    if (dType === 'yorker') speed = 41.2;
    else if (dType === 'bouncer') speed = 42.4;
    else if (dType === 'legcutter' || dType === 'offcutter') speed = 34.8;
    else if (dType === 'inswing') speed = 41.0;
    else if (dType === 'reverse') speed = 40.8;

    cs.speedKmph = speed * 3.6;

    const zBounce = Math.max(7.5, Math.min(21.4, 22.0 - lengthMeters));
    const tBounce = Math.max(0.18, (zBounce - 0.5) / speed);
    const g = 9.81;

    const vy = (-2.15 + 0.5 * g * tBounce * tBounce) / tBounce;
    const vx = (targetX - 0.35) / tBounce;

    b.x = 0.35;
    b.y = 2.15;
    b.z = 0.5;
    b.vx = vx;
    b.vy = vy;
    b.vz = speed;
    b.active = true;
    b.bounced = false;
    b.swingAccumX = 0;
    b.seamCutAccumX = 0;
    b.trail = [{ x: b.x, y: b.y, z: b.z, speed: cs.speedKmph, bounced: false }];

    if (this.fireBtnText) {
      this.fireBtnText.textContent = 'SWING CRICKET BAT [SPACE]';
    }

    if (window.soundFX) window.soundFX.playLaunchSound();
  }

  swingBat() {
    const cs = this.cricketState;
    const b = cs.ball;

    cs.batsman.isSwinging = true;
    cs.batsman.swingProgress = 0;

    if (b.active && b.z >= 16.5 && b.z <= 23.0 && !cs.batsman.connected) {
      cs.batsman.connected = true;
      const idealZ = 20.8;
      const timeDeltaMs = ((b.z - idealZ) / Math.max(12, Math.abs(b.vz))) * 1000;
      const absTimeDelta = Math.abs(timeDeltaMs);
      const lateralDist = Math.abs(b.x - (cs.batsman.x - 0.05));
      const isBouncer = cs.deliveryType === 'bouncer' && b.y > 1.3;

      if (absTimeDelta < 48 && lateralDist < 0.45) {
        // ★ SENSATIONAL MAXIMUM SIX (Lofted drive / Hook into stands)
        cs.batsman.timingRating = 'PERFECT SWEET SPOT';
        b.vz = -46;
        b.vy = 29;
        b.vx = (b.x - cs.batsman.x) * 14;
        const dist = (98 + Math.random() * 22).toFixed(1);
        b.hitResult = `★ SENSATIONAL MAXIMUM SIX! ${dist}M`;
        b.hitSubtext = isBouncer
          ? 'IMPERIOUS HOOK SHOT // SMASHED DEEP INTO SQUARE LEG CROWD!'
          : 'SWEET SPOT BLUDGEON // 110M LOFTED DRIVE OVER BOWLER’S HEAD!';
        b.shotDistanceM = dist;
        this.totalCollisions++;

        if (window.soundFX) {
          window.soundFX.playBatCrack();
          window.soundFX.playCrowdCheer();
        }

        // Golden celebration particles
        for (let i = 0; i < 45; i++) {
          this.particles.push({
            x: 480 + (Math.random() - 0.5) * 80,
            y: 200 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 400,
            vy: -Math.random() * 320 - 40,
            life: 0.85, maxLife: 0.85,
            color: '#facc15',
            size: Math.random() * 4 + 2
          });
        }
      } else if (absTimeDelta < 95 && lateralDist < 0.70) {
        // ◆ BULLET COVER DRIVE - FOUR
        cs.batsman.timingRating = timeDeltaMs < 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE';
        b.vz = -36;
        b.vy = 4.2;
        b.vx = (b.x < cs.batsman.x ? -24 : 22);
        b.hitResult = '◆ BULLET COVER DRIVE! 4 RUNS';
        b.hitSubtext = 'CRISP TIMING THROUGH EXTRA COVER // RACING TO BOUNDARY ROPE!';
        this.totalCollisions++;

        if (window.soundFX) window.soundFX.playBatCrack();
      } else if (absTimeDelta < 165 && lateralDist < 0.90) {
        // Thick Outside Edge
        cs.batsman.timingRating = 'THICK OUTSIDE EDGE';
        b.vz = 20;
        b.vy = 8;
        b.vx = (b.x < cs.batsman.x ? -22 : 22);
        b.hitResult = 'OUT! EDGED TO SLIP CORDON';
        b.hitSubtext = 'LATE SEAM DEVIATION // REGULATION CATCH IN SLIPS!';
        if (window.soundFX) window.soundFX.playImpactSound(0.25);
      } else {
        // Inside Edge / Chopped On
        cs.batsman.timingRating = 'INSIDE EDGE / CHOPPED ON';
        b.vz = 8;
        b.vy = -2;
        b.vx = (0 - b.x) * 4;
        b.hitResult = 'CHOPPED ON! BOWLED';
        b.hitSubtext = 'DRAGGED BACK ONTO THE OFF STUMP!';
        this.triggerWicketShatter();
        if (window.soundFX) window.soundFX.playTimberRattle();
      }
    } else {
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  triggerWicketShatter() {
    const cs = this.cricketState;
    cs.wickets.stumps.forEach((s, idx) => {
      s.shattered = true;
      s.vx = (idx - 1) * 2.4 + (Math.random() - 0.5) * 1.8;
      s.vy = 5.2 + Math.random() * 3.5;
      s.vz = 9.0 + Math.random() * 5.0;
      s.rotX = 6 + Math.random() * 4;
    });

    cs.wickets.bails.forEach(bail => {
      bail.shattered = true;
      bail.vx = (Math.random() - 0.5) * 4.0;
      bail.vy = 8.5 + Math.random() * 4.5;
      bail.vz = 7.0 + Math.random() * 4.5;
      bail.rot = 14;
    });
  }

  playSlowMoReplay() {
    const cs = this.cricketState;
    if (!cs.lastDeliveryReplay || cs.lastDeliveryReplay.length === 0) {
      this.bowlCricketBall();
      return;
    }
    cs.isReplaying = true;
    cs.replayFrameIndex = 0;
    if (window.soundFX) window.soundFX.playSlowMoWhoosh();
  }

  updateCricketControlsFromTarget() {
    const cs = this.cricketState;
    if (this.cricketLengthSlider) {
      this.cricketLengthSlider.value = cs.pitchLengthMeters.toFixed(1);
      let desc = 'GOOD LENGTH';
      if (cs.pitchLengthMeters < 3.5) desc = 'DEADLY YORKER';
      else if (cs.pitchLengthMeters < 5.0) desc = 'FULL LENGTH';
      else if (cs.pitchLengthMeters < 8.0) desc = 'GOOD LENGTH';
      else desc = 'SHORT PITCH BOUNCER';
      if (this.cricketLengthVal) this.cricketLengthVal.textContent = `${desc} (${cs.pitchLengthMeters.toFixed(1)}m)`;
    }
    if (this.cricketLineSlider) {
      this.cricketLineSlider.value = cs.targetMarkerX.toFixed(2);
      let lineDesc = 'MIDDLE STUMP';
      if (cs.targetMarkerX < -0.12) lineDesc = `OUTSIDE OFF (${Math.abs(cs.targetMarkerX).toFixed(2)}m)`;
      else if (cs.targetMarkerX > 0.12) lineDesc = `DOWN LEG (+${cs.targetMarkerX.toFixed(2)}m)`;
      if (this.cricketLineVal) this.cricketLineVal.textContent = lineDesc;
    }
  }

  updateCricketBallistics(dt) {
    const cs = this.cricketState;
    const b = cs.ball;

    // Slow-mo Replay handling
    if (cs.isReplaying) {
      if (cs.lastDeliveryReplay && cs.replayFrameIndex < cs.lastDeliveryReplay.length) {
        const frame = cs.lastDeliveryReplay[cs.replayFrameIndex];
        b.x = frame.x;
        b.y = frame.y;
        b.z = frame.z;
        b.vx = frame.vx;
        b.vy = frame.vy;
        b.vz = frame.vz;
        b.bounced = frame.bounced;
        b.bounceX = frame.bounceX;
        b.bounceZ = frame.bounceZ;
        cs.batsman.swingProgress = frame.batsmanProgress;
        cs.batsman.isSwinging = frame.isSwinging;
        b.hitResult = frame.hitResult;
        b.hitSubtext = frame.hitSubtext;
        cs.replayFrameIndex++;
      } else {
        cs.isReplaying = false;
      }
      return;
    }

    // Batsman animation progression
    if (cs.batsman.isSwinging) {
      cs.batsman.swingProgress += dt * 3.8;
      if (cs.batsman.swingProgress >= 1.0) {
        cs.batsman.isSwinging = false;
        cs.batsman.swingProgress = 0;
      }
    }

    if (!b.active) {
      this.updateShatteredWickets(dt);
      return;
    }

    // Record frame into replay buffer
    cs.lastDeliveryReplay.push({
      x: b.x, y: b.y, z: b.z,
      vx: b.vx, vy: b.vy, vz: b.vz,
      bounced: b.bounced,
      bounceX: b.bounceX, bounceZ: b.bounceZ,
      batsmanProgress: cs.batsman.swingProgress,
      isSwinging: cs.batsman.isSwinging,
      hitResult: b.hitResult,
      hitSubtext: b.hitSubtext
    });

    const dType = cs.deliveryType || 'outswing';
    const g = 9.81;

    // Air drag
    const vMag = Math.hypot(b.vx, b.vy, b.vz);
    b.vx -= 0.0035 * vMag * b.vx * dt;
    b.vy -= (g + 0.0035 * vMag * b.vy) * dt;
    b.vz -= 0.0035 * vMag * b.vz * dt;

    // Aerodynamic Magnus Swing before bat contact
    if (b.z > 6.0 && !cs.batsman.connected && b.vz > 0) {
      if (dType === 'outswing') {
        const swingAcc = 2.4 * (1 - Math.exp(-(b.z - 6.0) / 4.0));
        b.vx += swingAcc * dt;
        b.swingAccumX += swingAcc * dt * dt * 100; // cm
      } else if (dType === 'inswing') {
        const swingAcc = -2.8 * (1 - Math.exp(-(b.z - 6.0) / 4.0));
        b.vx += swingAcc * dt;
        b.swingAccumX += Math.abs(swingAcc) * dt * dt * 100;
      } else if (dType === 'reverse' && b.z > 12.0) {
        const revAcc = -4.5;
        b.vx += revAcc * dt;
        b.swingAccumX += Math.abs(revAcc) * dt * dt * 100;
      }
    }

    // 3D Integration
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;

    // Full Persistent Trail
    b.trail.push({
      x: b.x,
      y: b.y,
      z: b.z,
      speed: Math.hypot(b.vx, b.vy, b.vz) * 3.6,
      bounced: b.bounced
    });

    // Pitch Bounce & Continuous Turf Support
    if (b.y <= 0.04) {
      b.y = 0.04;
      if (!b.bounced && b.vz > 0) {
        b.bounced = true;
        b.bounceX = b.x;
        b.bounceZ = b.z;
        cs.bounceSpeedKmph = Math.hypot(b.vx, b.vy, b.vz) * 3.6;

        const restY = dType === 'bouncer' ? 0.77 : (dType === 'yorker' ? 0.40 : 0.65);
        const incAngle = Math.atan2(Math.abs(b.vy), b.vz) * (180 / Math.PI);
        cs.bounceAngleDeg = incAngle * restY;

        b.vy = Math.abs(b.vy) * restY;
        b.vz *= 0.86; // Turf friction loss

        // Seam Deviation off pitch crack
        if (dType === 'legcutter') {
          b.vx += 2.4;
          b.seamCutAccumX = 14.5;
        } else if (dType === 'offcutter') {
          b.vx -= 2.5;
          b.seamCutAccumX = -15.2;
        }

        // Turf dust particulate burst
        const proj = this.projectCricket3D(b.x, 0, b.z, this.canvas.width / this.scale, this.canvas.height / this.scale);
        for (let i = 0; i < 14; i++) {
          this.particles.push({
            x: proj.x, y: proj.y,
            vx: (Math.random() - 0.5) * 110,
            vy: -Math.random() * 80 - 10,
            life: 0.4, maxLife: 0.4,
            color: 'rgba(217, 185, 126, 0.8)',
            size: Math.random() * 3 + 2
          });
        }

        if (window.soundFX) window.soundFX.playTurfBounce();
      } else {
        // Continuous rolling or secondary bounces on turf
        if (b.vy < 0) {
          b.vy = Math.abs(b.vy) * 0.4;
          b.vz *= 0.94;
          b.vx *= 0.94;
        }
      }
    }

    // Check Stumps Collision at z >= 21.8m if not hit by bat
    if (b.z >= 21.8 && b.z <= 22.5 && b.vz > 0 && !cs.batsman.connected && !b.hitResult) {
      if (Math.abs(b.x) <= 0.14 && b.y <= 0.75) {
        b.hitResult = '⚡ CLEAN BOWLED!';
        b.hitSubtext = `${cs.speedKmph.toFixed(1)} KM/H // OFF STUMP CARTWHEELING!`;
        b.active = false;
        this.totalCollisions++;
        this.triggerWicketShatter();
        if (window.soundFX) window.soundFX.playTimberRattle();
      } else if (Math.abs(b.x - cs.batsman.x) <= 0.16 && b.y <= 0.68 && b.z >= 21.0) {
        b.hitResult = '☝ LBW APPEAL! (OUT)';
        b.hitSubtext = 'HAWK-EYE DRS: PITCHING IN LINE • IMPACT IN LINE • HITTING WICKETS!';
        b.vz = 2.0;
        b.vy = 1.0;
        b.active = false;
        if (window.soundFX) window.soundFX.playImpactSound(0.28);
      }
    }

    // Missed past stumps into keeper gloves
    if (b.z >= 24.2 && b.vz > 0 && !cs.batsman.connected && !b.hitResult) {
      b.hitResult = 'PLAY & MISS // GATHERED BY KEEPER';
      b.hitSubtext = `RELEASE: ${cs.speedKmph.toFixed(1)} KM/H • SWING: ${b.swingAccumX.toFixed(1)}cm • BEATEN OUTSIDE OFF!`;
      b.active = false;
      if (window.soundFX) window.soundFX.playImpactSound(0.12);
    }

    // Bounds limit (when ball flies out after shot or delivery)
    if (b.z > 50 || b.z < -25 || Math.abs(b.x) > 30 || b.y > 60) {
      b.active = false;
    }

    if (!b.active && this.fireBtnText) {
      this.fireBtnText.textContent = 'BOWL EXPRESS DELIVERY [SPACE]';
    }

    this.updateShatteredWickets(dt);
  }

  updateShatteredWickets(dt) {
    const cs = this.cricketState;
    cs.wickets.stumps.forEach(s => {
      if (s.shattered) {
        s.vy -= 9.8 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.rotX += 6 * dt;
        if (s.y < 0) { s.y = 0; s.vx *= 0.7; s.vz *= 0.7; }
      }
    });

    cs.wickets.bails.forEach(bail => {
      if (bail.shattered) {
        bail.vy -= 9.8 * dt;
        bail.x += bail.vx * dt;
        bail.y += bail.vy * dt;
        bail.z += bail.vz * dt;
        bail.rot += 10 * dt;
        if (bail.y < 0) { bail.y = 0; bail.vx *= 0.7; bail.vz *= 0.7; }
      }
    });
  }

  /* ==========================================================================
     3. SERVER REPLICATION & DETERMINISTIC PREDICTION (NETCODE)
     ========================================================================== */
  initNetcodeState() {
    const w = (this.canvas ? this.canvas.width / (this.scale || 1) : 960);
    const h = (this.canvas ? this.canvas.height / (this.scale || 1) : 480);
    this.netcodeState = {
      server: { x: w * 0.5, y: h * 0.5 },
      raw: { x: w * 0.5, y: h * 0.5 },
      pred: { x: w * 0.5, y: h * 0.5 },
      seq: 0,
      lastAck: -1,
      t: 0,
      acc: 0,
      pending: [],
      wire: [],
      trail: { s: [], r: [], p: [] },
      autoPilot: true,
      keys: new Set(),
      targetPoint: null,
      speed: 250,
      tickRateTime: 1 / 30
    };
  }

  updateNetcode(dt) {
    const ns = this.netcodeState;
    if (!ns || !ns.server) this.initNetcodeState();
    const w = this.canvas.width / this.scale;
    const h = this.canvas.height / this.scale;
    const TICK = ns.tickRateTime || (1 / 30);
    const SPEED = ns.speed || 250;

    const getInput = () => {
      if (ns.autoPilot) {
        const tx = w / 2 + Math.cos(ns.t * 0.75) * (w * 0.38);
        const ty = h / 2 + Math.sin(ns.t * 1.5) * (h * 0.32);
        const dx = tx - ns.pred.x, dy = ty - ns.pred.y, l = Math.hypot(dx, dy);
        return l < 6 ? { x: 0, y: 0 } : { x: dx / l, y: dy / l };
      }
      if (ns.targetPoint) {
        const dx = ns.targetPoint.x - ns.pred.x, dy = ns.targetPoint.y - ns.pred.y, l = Math.hypot(dx, dy);
        if (l < 10) {
          ns.targetPoint = null;
          return { x: 0, y: 0 };
        }
        return { x: dx / l, y: dy / l };
      }
      const k = (a, b) => (ns.keys.has(a) || ns.keys.has(b) ? 1 : 0);
      const vx = k('d', 'arrowright') - k('a', 'arrowleft');
      const vy = k('s', 'arrowdown') - k('w', 'arrowup');
      const l = Math.hypot(vx, vy) || 1;
      return (vx === 0 && vy === 0) ? { x: 0, y: 0 } : { x: vx / l, y: vy / l };
    };

    const stepEntity = (p, d) => {
      p.x = Math.min(w - 28, Math.max(28, p.x + d.x * SPEED * TICK));
      p.y = Math.min(h - 28, Math.max(28, p.y + d.y * SPEED * TICK));
    };

    const rtt = Math.max(0, this.simulatedPing || 150);
    const loss = Math.max(0, Math.min(100, this.packetLoss || 0));

    const sendPacket = (fn) => {
      if (Math.random() * 100 >= loss) {
        ns.wire.push({ at: performance.now() + (rtt / 2), fn });
      }
    };

    ns.acc += Math.min(0.25, dt);
    while (ns.acc >= TICK) {
      ns.t += TICK;
      ns.acc -= TICK;
      const dir = getInput();
      const s = ns.seq++;

      // Client predicts immediately
      stepEntity(ns.pred, dir);
      ns.pending.push({ seq: s, dir });

      // Send to server over wire with latency
      sendPacket(() => {
        stepEntity(ns.server, dir);
        const snap = { x: ns.server.x, y: ns.server.y, ack: s };
        sendPacket(() => {
          ns.raw.x = snap.x;
          ns.raw.y = snap.y;
          if (snap.ack <= ns.lastAck) return;
          ns.lastAck = snap.ack;

          // Gabriel Gambetta Reconciliation:
          // 1. Rewind to server authoritative snapshot
          ns.pred.x = snap.x;
          ns.pred.y = snap.y;
          // 2. Discard acknowledged inputs
          while (ns.pending.length && ns.pending[0].seq <= snap.ack) {
            ns.pending.shift();
          }
          // 3. Replay unacknowledged inputs
          for (const p of ns.pending) {
            stepEntity(ns.pred, p.dir);
          }
        });
      });
    }

    // Process wire packets
    const now = performance.now();
    for (let i = ns.wire.length - 1; i >= 0; i--) {
      if (ns.wire[i].at <= now) {
        const m = ns.wire.splice(i, 1)[0];
        m.fn();
      }
    }

    // Update trails
    const maxTrail = 42;
    const dots = [['s', ns.server], ['r', ns.raw], ['p', ns.pred]];
    for (const [k, p] of dots) {
      const tr = ns.trail[k];
      tr.push({ x: p.x, y: p.y });
      if (tr.length > maxTrail) tr.shift();
    }

    // Telemetry updates
    const driftPx = Math.hypot(ns.raw.x - ns.pred.x, ns.raw.y - ns.pred.y).toFixed(1);
    if (this.driftReadout) this.driftReadout.textContent = `${driftPx} px`;
    const allocReadout = document.getElementById('graph-alloc-readout');
    if (allocReadout) allocReadout.textContent = `0 KB/tick (GC-Free)`;
    if (this.actorCountLabel) this.actorCountLabel.textContent = `3 Network Entities`;
    if (this.buoyancyStatLabel) {
      const pCount = ns.pending ? ns.pending.length : 0;
      this.buoyancyStatLabel.innerHTML = `UNACKED INPUTS: <strong class="text-cyan">${pCount}</strong>`;
    }
    if (this.speedStatLabel) {
      this.speedStatLabel.innerHTML = `PREDICTION DRIFT: <strong class="${driftPx > 20 ? 'text-amber' : 'text-emerald'}">${driftPx} px</strong>`;
    }
  }

  injectServerMisprediction() {
    const ns = this.netcodeState;
    if (!ns || !ns.server) return;
    const offset = (Math.random() > 0.5 ? 90 : -90);
    ns.server.x = Math.max(40, Math.min(this.canvas.width / this.scale - 40, ns.server.x + offset));
    ns.server.y = Math.max(40, Math.min(this.canvas.height / this.scale - 40, ns.server.y + (offset * 0.6)));
    if (window.soundFX) window.soundFX.playLaserChime();
  }

  /* ==========================================================================
     4. ARTICULATED VERLET RAGDOLL (PHYSICS IK)
     ========================================================================== */
  initRagdollState() {
    this.ragdollState = {
      ragdolls: [],
      draggedNode: null
    };
  }

  spawnVerletMannequin(x, y) {
    // 8 interconnected articulated nodes
    const ragdoll = {
      nodes: [
        { x: x, y: y - 35, oldX: x, oldY: y - 35, radius: 10, label: 'head', isPinned: false },
        { x: x, y: y, oldX: x, oldY: y, radius: 12, label: 'chest', isPinned: false },
        { x: x, y: y + 30, oldX: x, oldY: y + 30, radius: 11, label: 'pelvis', isPinned: false },
        { x: x - 22, y: y + 10, oldX: x - 22, oldY: y + 10, radius: 6, label: 'l_elbow', isPinned: false },
        { x: x + 22, y: y + 10, oldX: x + 22, oldY: y + 10, radius: 6, label: 'r_elbow', isPinned: false },
        { x: x - 18, y: y + 60, oldX: x - 18, oldY: y + 60, radius: 7, label: 'l_knee', isPinned: false },
        { x: x + 18, y: y + 60, oldX: x + 18, oldY: y + 60, radius: 7, label: 'r_knee', isPinned: false },
        { x: x - 18, y: y + 95, oldX: x - 18, oldY: y + 95, radius: 6, label: 'l_foot', isPinned: false },
        { x: x + 18, y: y + 95, oldX: x + 18, oldY: y + 95, radius: 6, label: 'r_foot', isPinned: false }
      ],
      constraints: [
        [0, 1, 35], // head to chest
        [1, 2, 30], // chest to pelvis
        [1, 3, 24], // chest to l_arm
        [1, 4, 24], // chest to r_arm
        [2, 5, 32], // pelvis to l_knee
        [2, 6, 32], // pelvis to r_knee
        [5, 7, 35], // l_knee to l_foot
        [6, 8, 35]  // r_knee to r_foot
      ]
    };
    this.ragdollState.ragdolls.push(ragdoll);
  }

  updateRagdolls(dt) {
    const gravity = 650;
    const groundY = 380;
    const w = this.canvas.width / this.scale;

    for (let r of this.ragdollState.ragdolls) {
      // 1. Verlet Integration
      for (let n of r.nodes) {
        if (n === this.ragdollState.draggedNode) continue;

        const vx = (n.x - n.oldX) * 0.98;
        const vy = (n.y - n.oldY) * 0.98 + gravity * dt * dt;

        n.oldX = n.x;
        n.oldY = n.y;

        n.x += vx;
        n.y += vy;

        // Ground bounce
        if (n.y + n.radius > groundY) {
          n.y = groundY - n.radius;
          n.oldY = n.y + vy * 0.45;
          this.totalCollisions++;
        }

        // Left/Right boundaries
        if (n.x < 30) { n.x = 30; n.oldX = 30 + vx * 0.5; }
        if (n.x > w - 30) { n.x = w - 30; n.oldX = w - 30 + vx * 0.5; }
      }

      // 2. Satisfy Constraints (Relaxation Iterations)
      for (let iter = 0; iter < 4; iter++) {
        for (let c of r.constraints) {
          const n1 = r.nodes[c[0]];
          const n2 = r.nodes[c[1]];
          const targetDist = c[2];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const diff = (dist - targetDist) / dist;

          const offsetX = dx * 0.5 * diff;
          const offsetY = dy * 0.5 * diff;

          if (n1 !== this.ragdollState.draggedNode) { n1.x += offsetX; n1.y += offsetY; }
          if (n2 !== this.ragdollState.draggedNode) { n2.x -= offsetX; n2.y -= offsetY; }
        }
      }
    }
  }

  /* ==========================================================================
     PRIMARY & SECONDARY ACTIONS
     ========================================================================== */
  handlePrimaryActionClick() {
    if (this.mode === 'buoyancy') {
      this.throttleActive = true;
      this.applyJetSkiImpulse();
    } else if (this.mode === 'trajectory') {
      this.bowlCricketBall();
    } else if (this.mode === 'netcode') {
      if (this.netcodeState) {
        this.netcodeState.autoPilot = !this.netcodeState.autoPilot;
        if (this.autoToggle) this.autoToggle.checked = this.netcodeState.autoPilot;
        if (this.autoValLabel) {
          this.autoValLabel.textContent = this.netcodeState.autoPilot ? 'AUTO-PILOT ACTIVE' : 'MANUAL WASD STEERING';
          this.autoValLabel.className = this.netcodeState.autoPilot ? 'text-emerald' : 'text-cyan';
        }
      }
      if (window.soundFX) window.soundFX.playClick();
    } else if (this.mode === 'ragdoll') {
      for (let r of this.ragdollState.ragdolls) {
        for (let n of r.nodes) {
          n.oldY += 28 + Math.random() * 25;
          n.oldX += (Math.random() - 0.5) * 50;
        }
      }
      if (window.soundFX) window.soundFX.playLaunchSound();
    }
  }

  handlePrimaryActionStart() {
    if (this.mode === 'buoyancy') {
      this.throttleActive = true;
      if (this.fireBtn) this.fireBtn.classList.add('active-throttle');
      if (window.soundFX) window.soundFX.playLaunchSound();
    } else if (this.mode === 'trajectory') {
      const cs = this.cricketState;
      if (cs.ball.active && !cs.batsman.connected) {
        this.swingBat();
      } else {
        this.bowlCricketBall();
      }
    } else if (this.mode === 'netcode') {
      const w = this.canvas.width / this.scale;
      this.netcodeState.targetX = Math.random() * (w - 180) + 90;
      if (window.soundFX) window.soundFX.playClick();
    } else if (this.mode === 'ragdoll') {
      // Kinetic impulse explosion on ragdolls
      for (let r of this.ragdollState.ragdolls) {
        for (let n of r.nodes) {
          n.oldY += 25 + Math.random() * 20;
          n.oldX += (Math.random() - 0.5) * 40;
        }
      }
      if (window.soundFX) window.soundFX.playLaunchSound();
    }
  }

  handlePrimaryActionEnd() {
    if (this.mode === 'buoyancy') {
      this.throttleActive = false;
      if (this.fireBtn) this.fireBtn.classList.remove('active-throttle');
    }
  }

  handleSecondaryAction() {
    const w = this.canvas.width / this.scale;
    if (this.mode === 'buoyancy') {
      this.spawnBuoyantCrate(w * 0.3 + Math.random() * (w * 0.4), 160);
    } else if (this.mode === 'trajectory') {
      this.playSlowMoReplay();
    } else if (this.mode === 'netcode') {
      this.injectServerMisprediction();
    } else if (this.mode === 'ragdoll') {
      this.spawnVerletMannequin(w * 0.3 + Math.random() * (w * 0.4), 100);
      if (window.soundFX) window.soundFX.playLaunchSound();
    }
  }

  /* ==========================================================================
     MOUSE EVENT LISTENERS
     ========================================================================== */
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.scale;
    const y = (e.clientY - rect.top) / this.scale;

    if (this.mode === 'buoyancy') {
      this.spawnBuoyantCrate(x, y);
    } else if (this.mode === 'trajectory') {
      this.setTargetMarkerFromClick(x, y);
    } else if (this.mode === 'netcode') {
      if (this.netcodeState) {
        this.netcodeState.targetPoint = { x, y };
        this.netcodeState.autoPilot = false;
        if (this.autoToggle) this.autoToggle.checked = false;
        if (this.autoValLabel) {
          this.autoValLabel.textContent = 'MANUAL WASD STEERING';
          this.autoValLabel.className = 'text-cyan';
        }
      }
      if (window.soundFX) window.soundFX.playClick();
    } else if (this.mode === 'ragdoll') {
      // Check if mouse grabbed any ragdoll node
      for (let r of this.ragdollState.ragdolls) {
        for (let n of r.nodes) {
          if (Math.hypot(n.x - x, n.y - y) < n.radius + 12) {
            this.ragdollState.draggedNode = n;
            return;
          }
        }
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = this.canvas.width / this.scale;
    const h = this.canvas.height / this.scale;

    if (this.mode === 'trajectory') {
      const hit = this.unprojectCricket3D(x, y, w, h);
      if (hit && Math.abs(hit.x) <= 1.2 && hit.z >= 2.0 && hit.z <= 22.0) {
        this.cricketState.hoverTarget = { x: hit.x, z: hit.z, lengthMeters: 22.0 - hit.z };
      } else {
        this.cricketState.hoverTarget = null;
      }
    }

    if (this.ragdollState.draggedNode) {
      this.ragdollState.draggedNode.x = x;
      this.ragdollState.draggedNode.y = y;
      this.ragdollState.draggedNode.oldX = x;
      this.ragdollState.draggedNode.oldY = y;
    }
  }

  onMouseUp() {
    this.ragdollState.draggedNode = null;
  }

  /* ==========================================================================
     MAIN SIMULATION LOOP
     ========================================================================== */
  loop(currentTime) {
    if (!this.running || !this.canvas || this.canvas.offsetParent === null) {
      if (this.running) requestAnimationFrame(this.loop);
      return;
    }
    const delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    const timeScale = (this.mode === 'trajectory' ? this.simTimeScale : 1.0);
    const scaledDelta = Math.min(delta * timeScale, 0.1);

    const fixedDt = 1 / this.tickRate;
    this.tickAccumulator += scaledDelta;

    while (this.tickAccumulator >= fixedDt) {
      this.simTime += fixedDt;

      if (this.mode === 'buoyancy') this.updateBuoyancy(fixedDt);
      else if (this.mode === 'trajectory') this.updateCricketBallistics(fixedDt);
      else if (this.mode === 'netcode') this.updateNetcode(fixedDt);
      else if (this.mode === 'ragdoll') this.updateRagdolls(fixedDt);

      // Update particles
      for (let p of this.particles) {
        p.x += p.vx * fixedDt;
        p.y += p.vy * fixedDt;
        p.life -= fixedDt;
      }
      this.particles = this.particles.filter(p => p.life > 0);

      this.tickAccumulator -= fixedDt;
    }

    this.render();
    this.updateTelemetry(delta * 1000);

    requestAnimationFrame(this.loop);
  }

  /* ==========================================================================
     RENDERING PIPELINE
     ========================================================================== */
  render() {
    const w = this.canvas.width / this.scale;
    const h = this.canvas.height / this.scale;
    this.ctx.clearRect(0, 0, w, h);

    if (this.mode === 'buoyancy') this.renderBuoyancy(w, h);
    else if (this.mode === 'trajectory') this.renderCricket(w, h);
    else if (this.mode === 'netcode') this.renderNetcode(w, h);
    else if (this.mode === 'ragdoll') this.renderRagdoll(w, h);

    // Render Particles
    for (let p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /* --- Render Buoyancy (Dhoom 3 Jet Speed) --- */
  renderBuoyancy(w, h) {
    const t = this.simTime;

    // 1. Sky & Horizon Grid
    const gradSky = this.ctx.createLinearGradient(0, 0, 0, 300);
    gradSky.addColorStop(0, '#040914');
    gradSky.addColorStop(1, '#0b1d33');
    this.ctx.fillStyle = gradSky;
    this.ctx.fillRect(0, 0, w, h);

    // Horizon grid lines
    this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 180);
      this.ctx.lineTo(x, 300);
      this.ctx.stroke();
    }

    // 2. Draw Floating Cargo Crates
    for (let c of this.buoyancyState.floatingCrates) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(c.angle);
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h);
      this.ctx.strokeStyle = '#fef08a';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h);
      // Cross braces
      this.ctx.beginPath();
      this.ctx.moveTo(-c.w * 0.5, -c.h * 0.5);
      this.ctx.lineTo(c.w * 0.5, c.h * 0.5);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw Water Surface (Multi-layered Wave Polygon)
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, this.getWaterHeight(0, t));

    for (let x = 0; x <= w; x += 6) {
      this.ctx.lineTo(x, this.getWaterHeight(x, t));
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();

    const waterGrad = this.ctx.createLinearGradient(0, 280, 0, h);
    waterGrad.addColorStop(0, 'rgba(0, 180, 216, 0.85)');
    waterGrad.addColorStop(0.3, 'rgba(3, 105, 161, 0.92)');
    waterGrad.addColorStop(1, '#02182b');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fill();

    // Foamy wave crest line
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // 4. Draw Jet-Ski Vessel
    const v = this.buoyancyState.vessel;
    this.ctx.save();
    this.ctx.translate(v.x, v.y);
    this.ctx.rotate(v.angle);

    // Jet-Ski Hull Polygon
    this.ctx.beginPath();
    this.ctx.moveTo(-v.width * 0.45, 6);
    this.ctx.lineTo(v.width * 0.4, 6);
    this.ctx.lineTo(v.width * 0.5, -2);
    this.ctx.lineTo(v.width * 0.25, -12);
    this.ctx.lineTo(-v.width * 0.35, -8);
    this.ctx.closePath();

    this.ctx.fillStyle = '#00f2fe';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Jet-Ski Upper Deck & Windshield
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(-v.width * 0.1, -8);
    this.ctx.lineTo(v.width * 0.2, -8);
    this.ctx.lineTo(v.width * 0.1, -18);
    this.ctx.lineTo(-v.width * 0.05, -18);
    this.ctx.closePath();
    this.ctx.fill();

    // Rider Helmet & Silhouette
    this.ctx.fillStyle = '#ffb800';
    this.ctx.beginPath();
    this.ctx.arc(0, -22, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  /* --- Render 3D Broadcast Cricket (Sachin Saga) --- */
  renderCricket(w, h) {
    const cs = this.cricketState;
    const b = cs.ball;

    // 1. Stadium Night Sky & Atmospheric Lighting
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h * 0.45);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.6, '#081426');
    skyGrad.addColorStop(1, '#0e243a');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Stadium Floodlight Towers with Volumetric Light Beams
    const lightTowers = [
      { x: w * 0.12, y: 35 },
      { x: w * 0.28, y: 25 },
      { x: w * 0.72, y: 25 },
      { x: w * 0.88, y: 35 }
    ];

    for (let lt of lightTowers) {
      // Light beam cone down to pitch
      const beamGrad = this.ctx.createRadialGradient(lt.x, lt.y, 4, w * 0.5, h * 0.6, 320);
      beamGrad.addColorStop(0, 'rgba(200, 245, 255, 0.25)');
      beamGrad.addColorStop(0.4, 'rgba(0, 242, 254, 0.06)');
      beamGrad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = beamGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(lt.x, lt.y);
      this.ctx.lineTo(w * 0.5 - 200, h);
      this.ctx.lineTo(w * 0.5 + 200, h);
      this.ctx.closePath();
      this.ctx.fill();

      // Lamp cluster
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(lt.x, lt.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = 'rgba(0, 242, 254, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(lt.x, lt.y, 14, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Stadium Grandstands & LED Perimeter Ribbon
    this.ctx.fillStyle = '#061322';
    this.ctx.fillRect(0, h * 0.24, w, h * 0.08);

    // LED Perimeter Board
    const ledGrad = this.ctx.createLinearGradient(0, h * 0.28, 0, h * 0.32);
    ledGrad.addColorStop(0, '#0284c7');
    ledGrad.addColorStop(1, '#0369a1');
    this.ctx.fillStyle = ledGrad;
    this.ctx.fillRect(0, h * 0.28, w, 14);

    this.ctx.font = 'bold 9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('◈ SACHIN SAGA PHYSICS ENGINE 5.4 ◈ HAWK-EYE 3D BALL TRACKING ◈ ZERO-HITCH AAA RUNTIME ◈', w * 0.5, h * 0.28 + 10);

    // 4. Outfield Lush Turf Oval
    const outfieldGrad = this.ctx.createRadialGradient(w * 0.5, h * 0.65, 80, w * 0.5, h * 0.65, 420);
    outfieldGrad.addColorStop(0, '#065f46');
    outfieldGrad.addColorStop(0.7, '#044e3b');
    outfieldGrad.addColorStop(1, '#022c22');
    this.ctx.fillStyle = outfieldGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.5, h * 0.68, w * 0.52, h * 0.38, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // White Boundary Rope
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.5, h * 0.68, w * 0.49, h * 0.36, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    // 5. 3D 22-Yard Cricket Pitch Quadrilateral
    const pFarL  = this.projectCricket3D(-1.52, 0, 22.2, w, h);
    const pFarR  = this.projectCricket3D( 1.52, 0, 22.2, w, h);
    const pNearR = this.projectCricket3D( 1.52, 0, 0.2, w, h);
    const pNearL = this.projectCricket3D(-1.52, 0, 0.2, w, h);

    this.ctx.beginPath();
    this.ctx.moveTo(pFarL.x, pFarL.y);
    this.ctx.lineTo(pFarR.x, pFarR.y);
    this.ctx.lineTo(pNearR.x, pNearR.y);
    this.ctx.lineTo(pNearL.x, pNearL.y);
    this.ctx.closePath();

    // Real clay/turf pitch texture gradient
    const pitchGrad = this.ctx.createLinearGradient(0, pFarL.y, 0, pNearL.y);
    pitchGrad.addColorStop(0, '#854d0e');
    pitchGrad.addColorStop(0.5, '#a16207');
    pitchGrad.addColorStop(1, '#ca8a04');
    this.ctx.fillStyle = pitchGrad;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Center wear strip (lighter turf path)
    const cFarL  = this.projectCricket3D(-0.45, 0, 22.0, w, h);
    const cFarR  = this.projectCricket3D( 0.45, 0, 22.0, w, h);
    const cNearR = this.projectCricket3D( 0.45, 0, 0.5, w, h);
    const cNearL = this.projectCricket3D(-0.45, 0, 0.5, w, h);

    this.ctx.beginPath();
    this.ctx.moveTo(cFarL.x, cFarL.y);
    this.ctx.lineTo(cFarR.x, cFarR.y);
    this.ctx.lineTo(cNearR.x, cNearR.y);
    this.ctx.lineTo(cNearL.x, cNearL.y);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
    this.ctx.fill();

    // 6. White Painted Crease Lines
    // Bowling Crease at Foreground (z = 1.2m)
    const bCreaseL = this.projectCricket3D(-1.3, 0, 1.2, w, h);
    const bCreaseR = this.projectCricket3D( 1.3, 0, 1.2, w, h);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(bCreaseL.x, bCreaseL.y);
    this.ctx.lineTo(bCreaseR.x, bCreaseR.y);
    this.ctx.stroke();

    // Popping Crease at Batting end (z = 20.8m)
    const popCreaseL = this.projectCricket3D(-1.3, 0, 20.8, w, h);
    const popCreaseR = this.projectCricket3D( 1.3, 0, 20.8, w, h);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2.0;
    this.ctx.beginPath();
    this.ctx.moveTo(popCreaseL.x, popCreaseL.y);
    this.ctx.lineTo(popCreaseR.x, popCreaseR.y);
    this.ctx.stroke();

    // 7. Hawk-Eye Pitching Target Marker (Interactive Target on Turf)
    const targetZ = Math.max(7.5, Math.min(21.4, 22.0 - (cs.pitchLengthMeters || 6.5)));
    const targetProj = this.projectCricket3D(cs.targetMarkerX || 0.18, 0, targetZ, w, h);

    // Glowing target ring with crosshair
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.ellipse(targetProj.x, targetProj.y, 22 * targetProj.scale, 7 * targetProj.scale, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
    this.ctx.fill();

    // Crosshairs on turf target
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(targetProj.x - 12 * targetProj.scale, targetProj.y);
    this.ctx.lineTo(targetProj.x + 12 * targetProj.scale, targetProj.y);
    this.ctx.moveTo(targetProj.x, targetProj.y - 5 * targetProj.scale);
    this.ctx.lineTo(targetProj.x, targetProj.y + 5 * targetProj.scale);
    this.ctx.stroke();

    // Target label badge
    this.ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#00f2fe';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`TARGET: ${cs.deliveryType.toUpperCase()} (${(cs.pitchLengthMeters || 6.5).toFixed(1)}m)`, targetProj.x, targetProj.y - 12);

    // Mouse Hover guide if hovering over pitch
    if (cs.hoverTarget && !b.active) {
      const hProj = this.projectCricket3D(cs.hoverTarget.x, 0, cs.hoverTarget.z, w, h);
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.ellipse(hProj.x, hProj.y, 18 * hProj.scale, 6 * hProj.scale, 0, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.font = '8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillText(`CLICK TO PIN TARGET (${cs.hoverTarget.lengthMeters.toFixed(1)}m)`, hProj.x, hProj.y + 14);
    }

    // 8. Pre-Delivery Predictive Hawk-Eye Trajectory (Before Bowling)
    if (!b.active && cs.predictedTrajectory && cs.predictedTrajectory.length > 1) {
      // Projected turf ground path (shadow)
      this.ctx.beginPath();
      const p0S = this.projectCricket3D(cs.predictedTrajectory[0].x, 0, cs.predictedTrajectory[0].z, w, h);
      this.ctx.moveTo(p0S.x, p0S.y);
      for (let pt of cs.predictedTrajectory) {
        const pS = this.projectCricket3D(pt.x, 0, pt.z, w, h);
        this.ctx.lineTo(pS.x, pS.y);
      }
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Dotted in-air flight curve
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      const p0A = this.projectCricket3D(cs.predictedTrajectory[0].x, cs.predictedTrajectory[0].y, cs.predictedTrajectory[0].z, w, h);
      this.ctx.moveTo(p0A.x, p0A.y);
      for (let pt of cs.predictedTrajectory) {
        const pA = this.projectCricket3D(pt.x, pt.y, pt.z, w, h);
        this.ctx.lineTo(pA.x, pA.y);
      }
      this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.55)';
      this.ctx.lineWidth = 1.8;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Predicted arrival at stumps plane
      const lastPt = cs.predictedTrajectory[cs.predictedTrajectory.length - 1];
      if (lastPt) {
        const lastProj = this.projectCricket3D(lastPt.x, lastPt.y, lastPt.z, w, h);
        this.ctx.fillStyle = lastPt.y <= 0.74 && Math.abs(lastPt.x) <= 0.14 ? '#ef4444' : '#00f2fe';
        this.ctx.beginPath();
        this.ctx.arc(lastProj.x, lastProj.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.font = '8px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'center';
        const hitTxt = lastPt.y <= 0.74 && Math.abs(lastPt.x) <= 0.14 ? 'PROJECTED: HITTING STUMPS' : `PASSING HEIGHT: ${lastPt.y.toFixed(2)}m`;
        this.ctx.fillText(hitTxt, lastProj.x, lastProj.y - 8);
      }
    }

    // 9. Full Persistent Hawk-Eye 3D Trajectory Ribbon (Actual Flight Path)
    if (b.trail && b.trail.length > 1) {
      // Ground Shadow Ribbon on turf (y = 0)
      this.ctx.beginPath();
      const p0Shadow = this.projectCricket3D(b.trail[0].x, 0, b.trail[0].z, w, h);
      this.ctx.moveTo(p0Shadow.x, p0Shadow.y);
      for (let pt of b.trail) {
        const pShadow = this.projectCricket3D(pt.x, 0, pt.z, w, h);
        this.ctx.lineTo(pShadow.x, pShadow.y);
      }
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Multi-Segment Color-Coded Flight Ribbon
      for (let i = 0; i < b.trail.length - 1; i++) {
        const pt1 = b.trail[i];
        const pt2 = b.trail[i + 1];
        const pr1 = this.projectCricket3D(pt1.x, pt1.y, pt1.z, w, h);
        const pr2 = this.projectCricket3D(pt2.x, pt2.y, pt2.z, w, h);

        this.ctx.beginPath();
        this.ctx.moveTo(pr1.x, pr1.y);
        this.ctx.lineTo(pr2.x, pr2.y);

        // Color coding by speed & trajectory phase
        if (pt1.bounced) {
          this.ctx.strokeStyle = '#facc15'; // Golden amber post bounce
        } else if (pt1.speed > 138) {
          this.ctx.strokeStyle = '#00f2fe'; // Express cyan
        } else {
          this.ctx.strokeStyle = '#38bdf8'; // Sky blue
        }
        this.ctx.lineWidth = Math.max(1.8, 4.0 * pr2.scale);
        this.ctx.stroke();
      }
    }

    // Bounce impact ring mark on pitch
    if (b.bounced) {
      const bBounceProj = this.projectCricket3D(b.bounceX, 0, b.bounceZ, w, h);
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.ellipse(bBounceProj.x, bBounceProj.y, 18 * bBounceProj.scale, 6 * bBounceProj.scale, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
      this.ctx.fill();

      this.ctx.font = 'bold 8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#facc15';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`PITCH: ${(22.0 - b.bounceZ).toFixed(1)}m • ${(cs.bounceSpeedKmph || 126).toFixed(1)} KM/H`, bBounceProj.x, bBounceProj.y + 12);
    }

    // 9. 3D Wickets (3 Stumps & 2 Bails)
    for (let s of cs.wickets.stumps) {
      const baseProj = this.projectCricket3D(s.x, s.y, s.z, w, h);
      const topProj  = this.projectCricket3D(s.x + Math.sin(s.rotZ) * 0.72, s.y + Math.cos(s.rotX) * 0.72, s.z + Math.sin(s.rotX) * 0.72, w, h);

      this.ctx.strokeStyle = '#fef08a';
      this.ctx.lineWidth = Math.max(2, 4 * baseProj.scale);
      this.ctx.beginPath();
      this.ctx.moveTo(baseProj.x, baseProj.y);
      this.ctx.lineTo(topProj.x, topProj.y);
      this.ctx.stroke();
    }

    for (let bail of cs.wickets.bails) {
      const bailProj = this.projectCricket3D(bail.x, bail.y, bail.z, w, h);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.save();
      this.ctx.translate(bailProj.x, bailProj.y);
      this.ctx.rotate(bail.rot);
      this.ctx.fillRect(-5 * bailProj.scale, -2 * bailProj.scale, 10 * bailProj.scale, 3 * bailProj.scale);
      this.ctx.restore();
    }

    // 10. 3D Cricket Batsman (Sachin-Style Athlete Model)
    const batZ = cs.batsman.z;
    const batX = cs.batsman.x;
    const batsmanBase = this.projectCricket3D(batX, 0, batZ, w, h);
    const batsmanHead = this.projectCricket3D(batX, 1.75, batZ, w, h);
    const batsmanTorso = this.projectCricket3D(batX, 1.05, batZ, w, h);
    const bScale = batsmanBase.scale;

    // Batting Pads (White)
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(batsmanBase.x - 7 * bScale, batsmanBase.y - 32 * bScale, 6 * bScale, 32 * bScale);
    this.ctx.fillRect(batsmanBase.x + 1 * bScale, batsmanBase.y - 32 * bScale, 6 * bScale, 32 * bScale);

    // Jersey Torso (India Blue)
    this.ctx.fillStyle = '#0284c7';
    this.ctx.beginPath();
    this.ctx.roundRect(batsmanTorso.x - 10 * bScale, batsmanTorso.y - 20 * bScale, 20 * bScale, 26 * bScale, 3 * bScale);
    this.ctx.fill();

    // Helmet with grill (Dark Blue)
    this.ctx.fillStyle = '#0c4a6e';
    this.ctx.beginPath();
    this.ctx.arc(batsmanHead.x, batsmanHead.y, 8 * bScale, 0, Math.PI * 2);
    this.ctx.fill();

    // Face grill
    this.ctx.strokeStyle = '#94a3b8';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(batsmanHead.x - 4 * bScale, batsmanHead.y + 2 * bScale);
    this.ctx.lineTo(batsmanHead.x + 6 * bScale, batsmanHead.y + 2 * bScale);
    this.ctx.stroke();

    // 3D Cricket Bat (Animated Stroke or Stance)
    this.ctx.save();
    const batHandleX = batsmanTorso.x - 4 * bScale;
    const batHandleY = batsmanTorso.y + 4 * bScale;
    this.ctx.translate(batHandleX, batHandleY);

    // Rotation angle during swing
    let batAngle = 0.55; // Default stance angled back
    if (cs.batsman.isSwinging) {
      // Swing arc from back to follow-through
      batAngle = 0.55 - cs.batsman.swingProgress * 2.2;
    }
    this.ctx.rotate(batAngle);

    // Wooden Willow Blade
    this.ctx.fillStyle = '#d97706';
    this.ctx.fillRect(-2 * bScale, 0, 5 * bScale, 34 * bScale);
    this.ctx.strokeStyle = '#78350f';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(-2 * bScale, 0, 5 * bScale, 34 * bScale);

    // Bat Grip
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-1.5 * bScale, -12 * bScale, 3 * bScale, 12 * bScale);

    this.ctx.restore();

    // 11. 3D Cricket Ball (with Ground Shadow)
    if (b.active) {
      // Ground Shadow projected strictly at y = 0
      const shadowProj = this.projectCricket3D(b.x, 0, b.z, w, h);
      const shadowRadius = Math.max(2, (10 - b.y * 2.5) * shadowProj.scale);
      const shadowAlpha = Math.max(0.12, 0.45 - (b.y / 4.0));

      this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(shadowProj.x, shadowProj.y, shadowRadius * 1.6, shadowRadius * 0.6, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // The 3D Ball
      const ballProj = this.projectCricket3D(b.x, b.y, b.z, w, h);
      const ballRadius = Math.max(3, 8 * ballProj.scale);

      // Red Leather Sphere with Radial 3D Shading
      const ballGrad = this.ctx.createRadialGradient(
        ballProj.x - ballRadius * 0.3, ballProj.y - ballRadius * 0.3, 1,
        ballProj.x, ballProj.y, ballRadius
      );
      ballGrad.addColorStop(0, '#f87171');
      ballGrad.addColorStop(0.5, '#dc2626');
      ballGrad.addColorStop(1, '#7f1d1d');

      this.ctx.fillStyle = ballGrad;
      this.ctx.beginPath();
      this.ctx.arc(ballProj.x, ballProj.y, ballRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // White Seam
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = Math.max(1, 1.8 * ballProj.scale);
      this.ctx.beginPath();
      this.ctx.arc(ballProj.x, ballProj.y, ballRadius, 0.2, Math.PI * 0.9);
      this.ctx.stroke();
    }

    // 12. Timing Feedback Bar (when ball is approaching the crease)
    if (b.active && b.z >= 16.0 && b.z <= 22.5 && !cs.batsman.connected) {
      const approachNorm = (b.z - 16.0) / 5.5;
      const meterW = 200;
      const meterX = w * 0.5 - meterW * 0.5;
      const meterY = h * 0.86;

      this.ctx.fillStyle = 'rgba(8, 14, 24, 0.85)';
      this.ctx.fillRect(meterX, meterY, meterW, 14);
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.strokeRect(meterX, meterY, meterW, 14);

      // Sweet spot green zone in middle
      this.ctx.fillStyle = 'rgba(0, 240, 144, 0.35)';
      this.ctx.fillRect(meterX + meterW * 0.42, meterY, meterW * 0.16, 14);

      // Traveling timing cursor
      const cursorX = meterX + approachNorm * meterW;
      this.ctx.fillStyle = '#ffb800';
      this.ctx.fillRect(cursorX - 3, meterY - 2, 6, 18);

      this.ctx.font = 'bold 9px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('TIMING WINDOW // PRESS [SPACE] TO STRIKE', w * 0.5, meterY - 6);
    }

    // 13. Hawk-Eye Comprehensive Ballistics Telemetry Box (Top Left)
    this.ctx.fillStyle = 'rgba(6, 12, 22, 0.90)';
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 1;
    this.ctx.roundRect(16, 52, 220, 72, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('HAWK-EYE 3D BALL TRACKING RADAR', 24, 66);

    this.ctx.font = 'bold 15px "Rajdhani", sans-serif';
    this.ctx.fillStyle = '#00f2fe';
    this.ctx.fillText(`REL: ${(cs.speedKmph || 145.4).toFixed(1)} KM/H`, 24, 85);

    this.ctx.font = 'bold 13px "Rajdhani", sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(`PITCH: ${(cs.bounceSpeedKmph || 125.8).toFixed(1)} KM/H`, 130, 85);

    this.ctx.font = '9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#93c5fd';
    const swingTxt = b.swingAccumX ? `SWING: ${b.swingAccumX > 0 ? '+' : ''}${b.swingAccumX.toFixed(1)}cm` : 'SWING: +28.4cm';
    const seamTxt = b.seamCutAccumX ? `SEAM: ${b.seamCutAccumX > 0 ? '+' : ''}${b.seamCutAccumX.toFixed(1)}cm` : 'SEAM: +12.5cm';
    this.ctx.fillText(`${swingTxt} • ${seamTxt}`, 24, 102);

    this.ctx.font = '8.5px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText(`DELIVERY: ${cs.deliveryType.toUpperCase()} • LENGTH: ${(cs.pitchLengthMeters || 6.5).toFixed(1)}m`, 24, 116);

    // Replay Watermark Badge (Top Right)
    if (cs.isReplaying) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 1.5;
      this.ctx.roundRect(w - 260, 52, 244, 28, 4);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = 'bold 10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#ef4444';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('● REC // HAWK-EYE 3D SLOW-MO REPLAY', w - 138, 70);
      this.ctx.restore();
    }

    // 14. TV Broadcast Match Graphics Banner (Six / Four / Bowled / LBW)
    if (b.hitResult) {
      this.ctx.save();
      const bannerY = h * 0.42;

      // Banner background
      const isSix = b.hitResult.includes('SIX');
      const isBowled = b.hitResult.includes('BOWLED');
      const bannerColor = isSix ? '#facc15' : (isBowled ? '#ef4444' : '#38bdf8');

      this.ctx.fillStyle = 'rgba(4, 9, 18, 0.92)';
      this.ctx.strokeStyle = bannerColor;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.roundRect(w * 0.5 - 240, bannerY - 32, 480, 64, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = '800 24px "Rajdhani", sans-serif';
      this.ctx.fillStyle = bannerColor;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(b.hitResult, w * 0.5, bannerY - 4);

      this.ctx.font = '600 11px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText(b.hitSubtext || 'HAWK-EYE TRACKING CONFIRMED', w * 0.5, bannerY + 18);
      this.ctx.restore();
    }
  }

  /* --- Render Netcode Replication --- */
  renderNetcode(w, h) {
    const ns = this.netcodeState;
    if (!ns || !ns.server) return;

    // Tactical dark canvas
    this.ctx.fillStyle = '#070b12';
    this.ctx.fillRect(0, 0, w, h);

    // Dual Grid background
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Minor coordinate markers
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('+ [0,0]', 8, 14);
    this.ctx.fillText(`+ [${Math.floor(w)},${Math.floor(h)}]`, w - 70, h - 8);

    // Draw trails
    const dots = [
      ['s', ns.server, '#ffb800', 14],
      ['r', ns.raw, '#ef4444', 10],
      ['p', ns.pred, '#00f2fe', 11]
    ];

    for (const [k, p, col, radius] of dots) {
      const tr = ns.trail[k];
      if (tr && tr.length > 1) {
        this.ctx.strokeStyle = col + '55';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        tr.forEach((pt, idx) => {
          if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
          else this.ctx.lineTo(pt.x, pt.y);
        });
        this.ctx.stroke();
      }

      // Draw Craft / Entity
      this.ctx.save();
      this.ctx.translate(p.x, p.y);

      if (k === 's') {
        // Authoritative Server: Radar ping circle + Diamond core
        this.ctx.strokeStyle = col;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = col;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -radius);
        this.ctx.lineTo(radius, 0);
        this.ctx.lineTo(0, radius);
        this.ctx.lineTo(-radius, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Crosshairs
        this.ctx.strokeStyle = 'rgba(255, 184, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(-radius - 8, 0);
        this.ctx.lineTo(radius + 8, 0);
        this.ctx.moveTo(0, -radius - 8);
        this.ctx.lineTo(0, radius + 8);
        this.ctx.stroke();
      } else if (k === 'r') {
        // Raw Unpredicted: Crimson drone
        this.ctx.fillStyle = col;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      } else {
        // Predicted Client: Cyan Interceptor Ship
        this.ctx.fillStyle = col;
        this.ctx.shadowColor = col;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
      this.ctx.restore();
    }

    // On-Canvas HUD Legend (Top Left)
    this.ctx.fillStyle = 'rgba(5, 10, 18, 0.85)';
    this.ctx.fillRect(14, 14, 340, 68);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.strokeRect(14, 14, 340, 68);

    const legendItems = [
      { col: '#ffb800', label: 'SERVER (AUTHORITATIVE TRUTH)' },
      { col: '#ef4444', label: 'CLIENT (RAW UNPREDICTED - LAGGY)' },
      { col: '#00f2fe', label: 'CLIENT (PREDICTION + RECONCILIATION)' }
    ];
    this.ctx.font = '10px monospace';
    legendItems.forEach((item, idx) => {
      const y = 32 + (idx * 18);
      this.ctx.fillStyle = item.col;
      this.ctx.beginPath();
      this.ctx.arc(28, y - 3, 4.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#c4d7ec';
      this.ctx.fillText(item.label, 40, y);
    });

    // Telemetry Footer
    const driftPx = Math.hypot(ns.raw.x - ns.pred.x, ns.raw.y - ns.pred.y).toFixed(0);
    this.ctx.fillStyle = '#8b96a3';
    this.ctx.font = '11px monospace';
    this.ctx.fillText(
      `UNACKED INPUTS: ${ns.pending.length}   |   DRIFT (NO PREDICTION): ${driftPx} px   |   RTT: ${this.simulatedPing}ms   |   LOSS: ${this.packetLoss}%`,
      16,
      h - 14
    );
  }

  /* --- Render Ragdoll --- */
  renderRagdoll(w, h) {
    const groundY = 380;

    this.ctx.fillStyle = '#060a12';
    this.ctx.fillRect(0, 0, w, h);

    // Ground plane
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(w, groundY);
    this.ctx.stroke();

    // Grid floor
    this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // Draw Ragdolls
    for (let r of this.ragdollState.ragdolls) {
      // Bones
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      for (let c of r.constraints) {
        this.ctx.moveTo(r.nodes[c[0]].x, r.nodes[c[0]].y);
        this.ctx.lineTo(r.nodes[c[1]].x, r.nodes[c[1]].y);
      }
      this.ctx.stroke();

      // Joints
      for (let n of r.nodes) {
        this.ctx.fillStyle = n === this.ragdollState.draggedNode ? '#ffb800' : '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
  }

  /* ==========================================================================
     TELEMETRY & MINI SPARKLINES
     ========================================================================== */
  updateTelemetry(frameTimeMs) {
    this.frameHistory.shift();
    this.frameHistory.push(frameTimeMs);

    if (this.deltaReadout) this.deltaReadout.textContent = `${frameTimeMs.toFixed(1)} ms`;

    this.drawSparkline(this.graphFrametimeCanvas, this.frameHistory, '#00f2fe', 0, 40);
    this.drawSparkline(this.graphDriftCanvas, this.driftHistory, '#ffb800', 0, 10);
    this.drawSparkline(this.graphAllocCanvas, [0, 0, 0, 0.05, 0, 0], '#00f090', 0, 1);
  }

  drawSparkline(canvas, data, strokeColor, minVal, maxVal) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();

    const step = w / (data.length - 1);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const normY = h - ((val - minVal) / (maxVal - minVal || 1)) * (h - 8) - 4;
      const x = i * step;

      if (i === 0) ctx.moveTo(x, normY);
      else ctx.lineTo(x, normY);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.physicsSandbox = new PhysicsSandboxEngine('sandbox-canvas');
});
