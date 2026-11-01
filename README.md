# Mayank Manjul — Principal Gameplay Engineer & Lead Game Developer Portfolio

A dynamic, interactive, AAA game-dev HUD portfolio website crafted specifically for **Mayank Manjul** (Principal Gameplay Engineer & Lead Game Developer with 12+ years of experience across Unreal Engine 5, Modern C++, Unity, Multiplayer Replication, and Low-Level Optimization).

---

## 🎮 Key Interactive Features & Engine Aesthetics

1. **AAA Engine Viewport & Cyberpunk HUD Aesthetic**:
   - Dark sci-fi engine frame inspired by Unreal Engine 5, Cyberpunk 2077 HUD, and Death Stranding UI.
   - Interactive 4-Slide Tactical Carousel in the hero section:
     - Slide 1: **SYSTEM_DIAGNOSTICS // AGENT_CARD** (Live tactical radar, verified credentials, holographic MM badge).
     - Slide 2: **TECHNICAL_RADAR // ATTRIBUTE POLAR GRAPH** (Real-time canvas-drawn 6-axis competency radar with vertex glows).
     - Slide 3: **RUNTIME_PROFILING // ECRICKET BENCHMARK METRICS** (Tick scheduling, GC-free memory alloc, 120 FPS target lock).
     - Slide 4: **COMMERCIAL_TRACK // SHIPPED HIGHLIGHTS** (Direct spotlight on ECricket, Sachin Saga, Disney BYJU'S, and Dhoom 3).
     - Previous / Next arrow navigation, interactive pagination dots, and auto-rotation with hover pause.
   - CRT scanline grid, telemetry pills, live uptime timer, real-time FPS counter, and simulated memory pool.
   - 4 Dynamic HUD Palette Themes: **UE5 Slate & Cyan**, **ECricket Amber Gold**, **Matrix Zenject Green**, and **Overdrive Crimson**.

2. **Interactive Gameplay Simulator & Physics Engine (`#sandbox`)**:
   - **Hydrodynamics & Wave Buoyancy Simulator (Dhoom 3 Jet Speed)**: Real-time Gerstner wave displacement, multi-point Archimedes hull draft calculations, dynamic wave crest leaps, spray wake particles, engine throttle (<kbd>W</kbd> / <kbd>↑</kbd>), and buoyant floating cargo crates.
   - **Cricket Ballistics & Trajectory (Sachin Saga)**: 3D-angled shaded turf cricket pitch with seam angle, Magnus aerodynamic swing, pitch bounce wear, bat timing sweet-spot collision ("BOUNDARY FOUR / SIX!"), and authentic 3D wickets with bails that fly off when bowled.
   - **Server Replication & Lag Reconciliation**: Visualizes Server Authority, Raw Unpredicted Client, and Client-Side Prediction with adjustable ping (RTT 0 to 350ms), simulated packet loss, and Hermite rollback reconciliation.
   - **Articulated Verlet Ragdoll & IK Dynamics**: Interactive cyber-mannequin with clickable, draggable limbs, constraint relaxation, kinetic impulse blasts, and collision sparks.
   - **Real-Time Telemetry Graphs**: Frame Delta Time (ms), Server RPC Sync Drift, and Heap Allocation churn.

3. **Google Drive Resume Download & TDD Spec Sheet**:
   - Direct **"DOWNLOAD RESUME (PDF)"** buttons in the Hero Action Deck, Top Engine Bar, and Resume Modal.
   - Direct integration with Google Drive share links, allowing instant 1-click downloads or custom URL updates.
   - Integrated clean print / PDF stylesheet formatted for standard letter/A4 paper.

3. **Unreal Engine 5 StateTree & Gameplay Tag Node Graph (`#statetree`)**:
   - Interactive SVG node graph visualizing Mayank's decoupled character locomotion and ability architecture.
   - Live switching between `Idle`, `Sprint`, `Dodge Roll`, and `Cast Ability` states with active animated cable flows and synchronized C++20 code snippet inspection (`TDD/ECRICKET-7884`).

4. **In-Engine Developer Console / Quake Terminal (`[~]`)**:
   - Dropdown debugger console toggled with the `~` key or HUD header button.
   - Supported commands: `help`, `skills`, `projects`, `experience`, `statetree [state]`, `benchmark`, `resume`, `contact`, `color [palette]`, `matrix`, `godmode`, `clear`, `exit`.

5. **Procedural Web Audio Synthesizer**:
   - 100% synthesized sound effects generated in real-time via the HTML5 Web Audio API (no external MP3/WAV assets needed!).
   - Sound toggling, hover blips, laser chimes, launch whooshes, and keyboard typing sounds.

6. **Technical Blueprint Modals & Printable TDD Resume**:
   - Deep-dive architectural case studies for *ECricket*, *Sachin Saga Cricket Champions*, *Disney • BYJU'S Early Learn*, *M56 Multiplayer*, and *Dhoom 3 Jet Speed*.
   - One-click print / PDF export formatted for clean, professional paper printouts.

---

## 🚀 How to Run Locally

Because this project is built using zero-dependency, modern standard web technologies (HTML5, CSS3, ES6+ JavaScript, Canvas 2D, SVG, Web Audio API), **it requires no build steps or package managers**!

### Option 1: Direct File Opening
Double-click `index.html` or drag it into any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Optional)
If you have any web server installed:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# VS Code
Install "Live Server" extension and click "Go Live"
```
Then visit `http://localhost:8000`.

---

## 🌐 How to Host Properly (Free & Production-Ready)

### 1. GitHub Pages (Recommended)
1. Initialize a Git repository in this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mayank Manjul Game Developer Portfolio"
   ```
2. Create a new repository on GitHub (e.g. `mayankmanjul.github.io` or `game-dev-portfolio`).
3. Push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
4. On GitHub, go to **Settings > Pages > Branch: `main` / `root` > Save**.
5. Your portfolio is now live at `https://<your-username>.github.io/<repo-name>/`!

### 2. Netlify (Drag & Drop in 30 Seconds)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the folder containing `index.html` directly onto the Netlify dashboard.
3. Your site is instantly deployed with global CDN, custom domain options, and free SSL!

### 3. Vercel
1. Install Vercel CLI: `npm i -g vercel` or import the GitHub repo on [vercel.com](https://vercel.com).
2. Run `vercel` in this directory and accept defaults.

---

## 📁 Project Architecture

```
├── index.html                   # Core single-page application & semantic layout
├── README.md                    # Project documentation & deployment guide
├── styles/
│   ├── main.css                 # CSS variables, typography, reset, grid layouts
│   ├── hud-theme.css            # AAA Engine HUD styling, color themes, scanlines, telemetry
│   └── components.css           # Interactive sandbox, StateTree, modals, timeline, terminal
└── scripts/
    ├── sound-fx.js              # Synthesized procedural Web Audio API SFX engine
    ├── background-canvas.js     # Responsive particle matrix & interactive cursor raycast
    ├── physics-sandbox.js       # Trajectory physics, server replication, & ragdoll sandbox
    ├── statetree-visualizer.js  # Interactive UE5 StateTree node graph controller
    ├── terminal.js              # Quake-style in-engine developer console ([~])
    └── main.js                  # Telemetry orchestrator, modals, filters, and comms link
```

---

## 📬 Contact & Credentials
- **Mayank Manjul**
- **Role**: Principal Gameplay Engineer / Lead Game Developer
- **Email**: [mayankmanjul@live.com](mailto:mayankmanjul@live.com)
- **Phone**: +91-7066845227
- **LinkedIn**: [linkedin.com/in/mayankmanjul](https://www.linkedin.com/in/mayankmanjul)
- **Community**: Founder of *Unity Developers India*
