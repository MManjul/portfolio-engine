/**
 * Mayank Manjul Portfolio - Dedicated Mobile Runtime Engine
 * Executes ONLY on mobile viewports (<= 768px).
 * Desktop PC mode is 100% isolated and unaffected.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth > 768) return; // Completely disabled on Desktop PC

  initMobileDeck();
  initMobileBanners();
});

function initMobileDeck() {
  const sections = document.querySelectorAll('.hud-section');
  if (!sections || sections.length === 0) return;

  const sectionMeta = {
    'hero': { index: '01', title: 'COMMAND_CENTER' },
    'about': { index: '02', title: 'ARCHITECT_PROFILE' },
    'sandbox': { index: '03', title: 'PLAYGROUND', badge: 'COMING SOON' },
    'projects': { index: '04', title: 'TITLES_&_SYSTEMS' },
    'statetree': { index: '05', title: 'STATETREE_NODE_GRAPH' },
    'experience': { index: '06', title: 'CAREER_XP_LOG' },
    'skills': { index: '07', title: 'TECH_LOADOUT' },
    'contact': { index: '08', title: 'COMMS_LINK' }
  };

  sections.forEach((sec, idx) => {
    const secId = sec.getAttribute('id');
    const meta = sectionMeta[secId] || { index: String(idx + 1).padStart(2, '0'), title: secId.toUpperCase() };

    // Create deck header button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mobile-deck-header';
    btn.dataset.section = secId;

    const isHero = secId === 'hero';
    if (isHero) {
      btn.classList.add('active');
    } else {
      sec.classList.add('mobile-collapsed');
    }

    const badgeHtml = meta.badge ? `<span class="deck-badge-offline">${meta.badge}</span>` : '';

    btn.innerHTML = `
      <div class="deck-header-left">
        <span class="deck-header-index">${meta.index}</span>
        <span class="deck-header-title">${meta.title}</span>
        ${badgeHtml}
      </div>
      <span class="deck-header-chevron">${isHero ? '▴' : '▾'}</span>
    `;

    sec.insertBefore(btn, sec.firstChild);

    btn.addEventListener('click', () => {
      const isAlreadyOpen = !sec.classList.contains('mobile-collapsed') && btn.classList.contains('active');

      if (isAlreadyOpen) {
        // One item is always open: keep active section open and re-align smoothly if tapped
        requestAnimationFrame(() => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }

      // Close all other sections
      sections.forEach(s => {
        s.classList.add('mobile-collapsed');
        const b = s.querySelector('.mobile-deck-header');
        if (b) {
          b.classList.remove('active');
          const chev = b.querySelector('.deck-header-chevron');
          if (chev) chev.textContent = '▾';
        }
      });

      // Open this section
      sec.classList.remove('mobile-collapsed');
      btn.classList.add('active');
      const chev = btn.querySelector('.deck-header-chevron');
      if (chev) chev.textContent = '▴';

      // Position this section header smoothly at top under fixed engine header (48px)
      requestAnimationFrame(() => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      if (window.soundFX && window.soundFX.playClick) {
        window.soundFX.playClick();
      }
    });
  });

  // Intercept anchor links on mobile (e.g. from hero buttons)
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      const targetId = link.getAttribute('href').substring(1);
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        const btn = targetSec.querySelector('.mobile-deck-header');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      }
    });
  });
}

function initMobileBanners() {
  const sandboxSec = document.getElementById('sandbox');
  if (sandboxSec) {
    const container = sandboxSec.querySelector('.section-container');
    if (container && !container.querySelector('.mobile-playground-coming-soon')) {
      const comingSoon = document.createElement('div');
      comingSoon.className = 'mobile-playground-coming-soon';
      comingSoon.innerHTML = `
        <div class="coming-soon-badge">◈ CALIBRATING RUNTIME // MOBILE OPTIMIZATION ACTIVE</div>
        <h3 class="coming-soon-title">PLAYGROUND OPTIMIZATION IN PROGRESS</h3>
        <p class="coming-soon-desc">
          The interactive Box2D / UE5 physics simulation (Hydrodynamic buoyancy, ballistics drag equations, client-side prediction, and articulated ragdolls) is currently undergoing GPU shader profiling & touch-gesture calibration for mobile devices.
        </p>
        
        <div class="coming-soon-card">
          <div class="cs-card-icon">🖥️</div>
          <div class="cs-card-content">
            <strong>EXPERIENCE THE FULL ENGINE ON PC</strong>
            <p>For live unthrottled 60 FPS physics simulation, real-time waveform slider tuning, and network telemetry graphs, kindly access Mayank's portfolio on a <strong>Desktop PC browser</strong>.</p>
          </div>
        </div>

        <div class="coming-soon-specs">
          <div class="spec-chip"><span>SUBSYSTEM:</span> 03 // PLAYGROUND</div>
          <div class="spec-chip"><span>MOBILE STATUS:</span> OPTIMIZING TOUCH HARNESS</div>
          <div class="spec-chip"><span>DESKTOP RUNTIME:</span> 100% OPERATIONAL (SHIPPING)</div>
        </div>
      `;

      const heading = container.querySelector('.section-heading');
      if (heading && heading.nextSibling) {
        container.insertBefore(comingSoon, heading.nextSibling);
      } else {
        container.appendChild(comingSoon);
      }
    }
  }

  const statetreeSec = document.getElementById('statetree');
  if (statetreeSec) {
    const container = statetreeSec.querySelector('.section-container');
    if (container && !container.querySelector('.mobile-demo-notice')) {
      const notice = document.createElement('div');
      notice.className = 'mobile-demo-notice';
      notice.innerHTML = `
        <span class="notice-icon">↔</span>
        <div class="notice-text">
          <strong>INTERACTIVE NODE GRAPH</strong>
          Swipe horizontally across the viewport below to inspect the full 960px UE5 StateTree schema.
        </div>
      `;
      const editorWin = container.querySelector('.statetree-editor-window');
      if (editorWin) {
        container.insertBefore(notice, editorWin);
      } else {
        container.insertBefore(notice, container.firstChild);
      }
    }
  }
}
