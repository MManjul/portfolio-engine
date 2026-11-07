/**
 * Mayank Manjul Portfolio - Dedicated Mobile Runtime Engine
 * Executes ONLY on mobile viewports (<= 768px).
 * Desktop PC mode is 100% isolated and unaffected.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth > 768) return; // Completely disabled on Desktop PC

  initMobileDeck();
  initMobileBanners();
  initMobileNetcodeUI();
});

function initMobileNetcodeUI() {
  const fireBtnText = document.getElementById('btn-fire-text');
  if (fireBtnText) fireBtnText.textContent = 'TAP CANVAS TO STEER';

  const instructionsText = document.getElementById('sandbox-instructions-text');
  if (instructionsText) {
    instructionsText.innerHTML = '<strong>Touch Controls:</strong> Tap anywhere on the canvas to steer the ship • Adjust Ping (RTT) &amp; Packet Loss below to stress reconciliation!';
  }

  const keyboardIcon = document.querySelector('.keyboard-icon');
  if (keyboardIcon) keyboardIcon.textContent = '👆';

  const autoLabel = document.getElementById('netcode-auto-label');
  if (autoLabel) autoLabel.textContent = 'AUTO-PILOT ACTIVE';
}

function initMobileDeck() {
  const sections = document.querySelectorAll('.hud-section');
  if (!sections || sections.length === 0) return;

  const sectionMeta = {
    'hero': { index: '01', title: 'COMMAND_CENTER' },
    'about': { index: '02', title: 'ARCHITECT_PROFILE' },
    'sandbox': { index: '03', title: 'NETCODE_LAB', badge: 'LIVE' },
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

    // All sections are expanded by default on mobile
    btn.classList.add('active');
    sec.classList.remove('mobile-collapsed');

    const badgeClass = meta.badge === 'LIVE' ? 'deck-badge-live' : 'deck-badge-offline';
    const badgeHtml = meta.badge ? `<span class="${badgeClass}">${meta.badge}</span>` : '';

    btn.innerHTML = `
      <div class="deck-header-left">
        <span class="deck-header-index">${meta.index}</span>
        <span class="deck-header-title">${meta.title}</span>
        ${badgeHtml}
      </div>
      <span class="deck-header-chevron">▴</span>
    `;

    sec.insertBefore(btn, sec.firstChild);

    btn.addEventListener('click', () => {
      const isCollapsed = sec.classList.contains('mobile-collapsed');
      const chev = btn.querySelector('.deck-header-chevron');

      if (isCollapsed) {
        // Expand this section
        sec.classList.remove('mobile-collapsed');
        btn.classList.add('active');
        if (chev) chev.textContent = '▴';
        requestAnimationFrame(() => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        // Collapse this section
        sec.classList.add('mobile-collapsed');
        btn.classList.remove('active');
        if (chev) chev.textContent = '▾';
      }

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
          if (targetSec.classList.contains('mobile-collapsed')) {
            targetSec.classList.remove('mobile-collapsed');
            btn.classList.add('active');
            const chev = btn.querySelector('.deck-header-chevron');
            if (chev) chev.textContent = '▴';
          }
          requestAnimationFrame(() => {
            btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      }
    });
  });
}

function initMobileBanners() {
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
          Swipe horizontally across the viewport below to inspect the full UE5 StateTree schema.
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
