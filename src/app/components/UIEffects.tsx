/**
 * Arthmize — UI Effects Engine (React port of ui-effects.js)
 * ─────────────────────────────────────────────────────────────
 * Feature flags at the top — flip any to false to kill that effect.
 * Mounts once, cleans up all listeners on unmount.
 * Auto-disables custom cursor on touch/mobile devices.
 *
 * Auth-awareness: reads auth state via useAuth() and publishes
 * 'az:open-auth-modal' custom event to request login modal.
 */
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

const FEATURES = {
  CUSTOM_CURSOR:      true,   // Glossy indigo cursor + glow trail
  CUSTOM_RIGHT_CLICK: true,   // Branded dark context menu
  TEXT_SELECT_EFFECT: true,   // Copy/share/search toolbar on selection
  LINK_HOVER_EFFECT:  true,   // Magnetic pull on buttons & links
  INSPECT_DISABLE:    false,  // Block DevTools & inspect element
};

const C = {
  primary:     '#6366F1',
  primaryGlow: 'rgba(99,102,241,0.35)',
  success:     '#10B981',
  navyLight:   '#1E293B',
  white:       '#FFFFFF',
};

function injectStyles() {
  if (document.getElementById('arthmize-fx-styles')) return;
  const style = document.createElement('style');
  style.id = 'arthmize-fx-styles';
  style.textContent = `
    /* ── Hide default cursor ── */
    .arthmize-cursor-active *, .arthmize-cursor-active { cursor: none !important; }

    /* ── Cursor ring ── */
    #az-cursor-ring {
      position: fixed; top: 0; left: 0;
      width: 36px; height: 36px; border-radius: 50%;
      border: 1.5px solid ${C.primary}; pointer-events: none;
      z-index: 999999; transform: translate(-50%,-50%);
      transition: width .2s ease, height .2s ease, border-color .2s ease,
                  opacity .2s ease, background .2s ease;
      will-change: transform;
    }
    /* ── Cursor dot ── */
    #az-cursor-dot {
      position: fixed; top: 0; left: 0;
      width: 7px; height: 7px; border-radius: 50%;
      background: ${C.primary}; pointer-events: none;
      z-index: 999999; transform: translate(-50%,-50%);
      transition: width .05s ease, height .05s ease, background .05s ease, opacity .05s ease;
      will-change: transform;
      box-shadow: 0 0 10px ${C.primaryGlow}, 0 0 20px ${C.primaryGlow};
    }
    #az-cursor-ring.hovered { width: 52px; height: 52px; background: ${C.primaryGlow}; border-color: transparent; }
    #az-cursor-dot.hovered  { width: 5px; height: 5px; background: ${C.white}; }
    #az-cursor-ring.clicked { width: 28px; height: 28px; background: rgba(99,102,241,.2); }
    #az-cursor-dot.clicked  { transform: translate(-50%,-50%) scale(0.6); }

    /* ── Trail ── */
    .az-trail {
      position: fixed; width: 5px; height: 5px; border-radius: 50%;
      background: ${C.primary}; pointer-events: none; z-index: 999990;
      transform: translate(-50%,-50%); opacity: 0;
      animation: az-trail-fade .5s ease forwards;
    }
    @keyframes az-trail-fade {
      0%   { opacity: .5; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0;  transform: translate(-50%,-50%) scale(.2); }
    }

    /* ── Context menu ── */
    #az-ctx-menu {
      position: fixed; z-index: 999998;
      background: ${C.navyLight};
      border: 1px solid rgba(99,102,241,.3); border-radius: 12px;
      padding: 6px; min-width: 210px;
      box-shadow: 0 20px 60px rgba(0,0,0,.4), 0 0 0 1px rgba(99,102,241,.1),
                  inset 0 1px 0 rgba(255,255,255,.05);
      backdrop-filter: blur(20px);
      opacity: 0; pointer-events: none;
      transform: scale(.92) translateY(-4px); transform-origin: top left;
      transition: opacity .15s ease, transform .15s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #az-ctx-menu.visible { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }
    .az-menu-header {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px 10px;
      border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: 4px;
    }
    .az-menu-logo {
      width: 20px; height: 20px; background: ${C.primary};
      border-radius: 6px; display: flex; align-items: center;
      justify-content: center; font-size: 10px; color: white; font-weight: 700;
    }
    .az-menu-brand { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.5); }
    .az-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 8px; cursor: pointer;
      color: rgba(255,255,255,.8); font-size: 13px;
      transition: background .1s ease, color .1s ease; user-select: none;
    }
    .az-menu-item:hover { background: rgba(99,102,241,.2); color: #fff; }
    .az-menu-item:active { background: rgba(99,102,241,.35); }
    .az-menu-item .az-icon { width: 15px; height: 15px; opacity: .6; flex-shrink: 0; }
    .az-menu-item:hover .az-icon { opacity: 1; }
    .az-menu-item .az-shortcut { margin-left: auto; font-size: 11px; color: rgba(255,255,255,.25); font-family: monospace; }
    .az-menu-divider { height: 1px; background: rgba(255,255,255,.06); margin: 4px 0; }
    .az-menu-item.danger { color: #F87171; }
    .az-menu-item.danger:hover { background: rgba(239,68,68,.15); color: #FCA5A5; }
    .az-menu-item.primary-item { color: ${C.primary}; }
    .az-menu-item.primary-item:hover { background: rgba(99,102,241,.2); color: #A5B4FC; }
    .az-menu-item.locked { color: rgba(255,255,255,.3); cursor: not-allowed; }
    .az-menu-item.locked:hover { background: transparent; color: rgba(255,255,255,.3); }
    .az-menu-item.locked .az-lock-badge {
      margin-left: auto;
      font-size: 10px; padding: 1px 6px; border-radius: 4px;
      background: rgba(99,102,241,.2); color: #A5B4FC;
    }

    /* ── In-page search bar ── */
    #az-search-bar {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      z-index: 999998; background: ${C.navyLight};
      border: 1px solid rgba(99,102,241,.4); border-radius: 12px;
      padding: 10px 14px; display: flex; align-items: center; gap-8px;
      gap: 10px; min-width: 340px; max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0,0,0,.4);
      opacity: 0; pointer-events: none;
      transition: opacity .2s ease, transform .2s ease;
      transform: translateX(-50%) translateY(-8px);
      font-family: 'Inter', system-ui, sans-serif;
    }
    #az-search-bar.visible {
      opacity: 1; pointer-events: all;
      transform: translateX(-50%) translateY(0);
    }
    #az-search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #fff; font-size: 14px; font-family: 'Inter', system-ui, sans-serif;
    }
    #az-search-input::placeholder { color: rgba(255,255,255,.35); }
    #az-search-count {
      font-size: 12px; color: rgba(255,255,255,.4); white-space: nowrap;
    }
    #az-search-close {
      background: none; border: none; color: rgba(255,255,255,.4);
      cursor: pointer; padding: 2px; font-size: 16px; line-height: 1;
    }
    #az-search-close:hover { color: #fff; }
    .az-search-highlight {
      background: rgba(99,102,241,.4) !important;
      border-radius: 2px;
      outline: 2px solid #6366F1;
    }

    /* ── Text selection ── */
    ::selection     { background: rgba(99,102,241,.25) !important; color: ${C.white} !important; }
    ::-moz-selection{ background: rgba(99,102,241,.25) !important; color: ${C.white} !important; }

    /* ── Selection toolbar ── */
    #az-sel-toast {
      position: fixed; z-index: 999997;
      background: ${C.navyLight}; border: 1px solid rgba(99,102,241,.4);
      border-radius: 8px; padding: 6px 4px; display: flex; gap: 2px;
      opacity: 0; transform: translateY(4px) scale(.95);
      transition: opacity .15s ease, transform .15s ease;
      pointer-events: none; box-shadow: 0 8px 32px rgba(0,0,0,.3);
    }
    #az-sel-toast.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    .az-sel-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 10px; border-radius: 5px; border: none;
      background: transparent; color: rgba(255,255,255,.7);
      font-size: 12px; font-weight: 500; cursor: pointer;
      transition: background .1s, color .1s; white-space: nowrap;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .az-sel-btn:hover { background: rgba(99,102,241,.25); color: white; }
    .az-sel-btn svg { width: 13px; height: 13px; opacity: .7; }

    /* ── Copy flash ── */
    #az-copy-flash {
      position: fixed; bottom: 24px; left: 50%;
      transform: translateX(-50%) translateY(8px);
      background: ${C.navyLight}; border: 1px solid rgba(16,185,129,.4);
      color: ${C.success}; font-size: 13px; font-weight: 500;
      padding: 10px 18px; border-radius: 10px; z-index: 999999;
      opacity: 0; transition: opacity .2s ease, transform .2s ease;
      pointer-events: none; font-family: 'Inter', system-ui, sans-serif;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,.3);
    }
    #az-copy-flash.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* ── Magnetic links ── */
    .az-magnetic { transition: transform .25s cubic-bezier(.23,1,.32,1); }
  `;
  document.head.appendChild(style);
}

// ── In-page search engine ──────────────────────────────────────────────────
let searchMatches: HTMLElement[] = [];
let searchIndex = 0;

function clearSearchHighlights() {
  document.querySelectorAll('.az-search-highlight').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
      parent.normalize();
    }
  });
  searchMatches = [];
  searchIndex = 0;
}

function runSearch(term: string): number {
  clearSearchHighlights();
  if (!term || term.length < 2) return 0;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT','STYLE','NOSCRIPT','#az-search-bar','#az-ctx-menu'].some(t => parent.closest(t))) return NodeFilter.FILTER_REJECT;
      return node.textContent?.toLowerCase().includes(term.toLowerCase())
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node as Text);

  nodes.forEach(textNode => {
    const text = textNode.textContent ?? '';
    const lower = text.toLowerCase();
    const termLower = term.toLowerCase();
    let idx = lower.indexOf(termLower);
    if (idx < 0) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    while (idx >= 0) {
      frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = 'az-search-highlight';
      mark.textContent = text.slice(idx, idx + term.length);
      searchMatches.push(mark);
      frag.appendChild(mark);
      last = idx + term.length;
      idx = lower.indexOf(termLower, last);
    }
    frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode?.replaceChild(frag, textNode);
  });

  if (searchMatches.length > 0) {
    searchMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return searchMatches.length;
}

function navigateSearch(dir: 1 | -1, countEl: HTMLElement) {
  if (searchMatches.length === 0) return;
  searchMatches[searchIndex]?.classList.remove('az-search-highlight');
  searchMatches[searchIndex]?.style && (searchMatches[searchIndex].style.outline = '2px solid #6366F1');
  searchIndex = (searchIndex + dir + searchMatches.length) % searchMatches.length;
  const cur = searchMatches[searchIndex];
  if (cur) {
    cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
    cur.style.outline = '3px solid #F59E0B';
  }
  countEl.textContent = `${searchIndex + 1} / ${searchMatches.length}`;
}

export function UIEffects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isTouchOnly = window.matchMedia('(hover: none)').matches;
    const cleanups: (() => void)[] = [];

    injectStyles();

    /* ─────────────────────────────────────────────
       1. CUSTOM CURSOR (desktop only)
    ───────────────────────────────────────────── */
    if (FEATURES.CUSTOM_CURSOR && !isTouchOnly) {
      document.body.classList.add('arthmize-cursor-active');

      const ring = document.createElement('div'); ring.id = 'az-cursor-ring';
      const dot  = document.createElement('div'); dot.id  = 'az-cursor-dot';
      document.body.appendChild(ring);
      document.body.appendChild(dot);

      let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
      let rafId: number;

      const animateRing = () => {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px';
        ring.style.top  = ringY + 'px';
        rafId = requestAnimationFrame(animateRing);
      };
      animateRing();

      const onMove = (e: MouseEvent) => {
        mouseX = e.clientX; mouseY = e.clientY;
        dot.style.left = e.clientX + 'px';
        dot.style.top  = e.clientY + 'px';
        spawnTrail(e.clientX, e.clientY);
      };

      const clickables = 'a,button,[role="button"],input,textarea,select,label,[onclick]';
      const onOver = (e: MouseEvent) => {
        if ((e.target as Element).closest(clickables)) {
          ring.classList.add('hovered'); dot.classList.add('hovered');
        }
      };
      const onOut = (e: MouseEvent) => {
        if ((e.target as Element).closest(clickables)) {
          ring.classList.remove('hovered'); dot.classList.remove('hovered');
        }
      };
      const onDown = () => { ring.classList.add('clicked'); dot.classList.add('clicked'); };
      const onUp   = () => { ring.classList.remove('clicked'); dot.classList.remove('clicked'); };
      const onLeave = () => { ring.style.opacity = '0'; dot.style.opacity = '0'; };
      const onEnter = () => { ring.style.opacity = '1'; dot.style.opacity = '1'; };

      document.addEventListener('mousemove',  onMove);
      document.addEventListener('mouseover',  onOver);
      document.addEventListener('mouseout',   onOut);
      document.addEventListener('mousedown',  onDown);
      document.addEventListener('mouseup',    onUp);
      document.addEventListener('mouseleave', onLeave);
      document.addEventListener('mouseenter', onEnter);

      let trailBusy = false;
      function spawnTrail(x: number, y: number) {
        if (trailBusy) return;
        trailBusy = true;
        setTimeout(() => { trailBusy = false; }, 40);
        const t = document.createElement('div');
        t.className = 'az-trail';
        t.style.left = x + 'px'; t.style.top = y + 'px';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 500);
      }

      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        document.body.classList.remove('arthmize-cursor-active');
        ring.remove(); dot.remove();
        document.removeEventListener('mousemove',  onMove);
        document.removeEventListener('mouseover',  onOver);
        document.removeEventListener('mouseout',   onOut);
        document.removeEventListener('mousedown',  onDown);
        document.removeEventListener('mouseup',    onUp);
        document.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('mouseenter', onEnter);
      });
    }

    /* ─────────────────────────────────────────────
       2. BRANDED RIGHT-CLICK CONTEXT MENU
    ───────────────────────────────────────────── */
    if (FEATURES.CUSTOM_RIGHT_CLICK) {
      // Helper to request auth modal from any component listening
      const requestAuth = () => document.dispatchEvent(new CustomEvent('az:open-auth-modal'));

      const menu = document.createElement('div');
      menu.id = 'az-ctx-menu';
      menu.innerHTML = `
        <div class="az-menu-header">
          <div class="az-menu-logo">A</div>
          <span class="az-menu-brand">Arthmize</span>
        </div>
        <div class="az-menu-item primary-item" data-action="home">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Go to Dashboard
        </div>
        <div class="az-menu-item" data-action="copy">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy <span class="az-shortcut">⌘C</span>
        </div>
        <div class="az-menu-item" data-action="search">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          Search on page <span class="az-shortcut">Ctrl+F</span>
        </div>
        <div class="az-menu-divider"></div>
        <div class="az-menu-item ${isLoggedIn ? '' : 'locked'}" data-action="tax">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Tax Optimizer ${!isLoggedIn ? '<span class="az-lock-badge">🔒 Login</span>' : ''}
        </div>
        <div class="az-menu-item ${isLoggedIn ? '' : 'locked'}" data-action="fire">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
          </svg>
          FIRE Planner ${!isLoggedIn ? '<span class="az-lock-badge">🔒 Login</span>' : ''}
        </div>
        <div class="az-menu-divider"></div>
        <div class="az-menu-item" data-action="reload">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Reload page <span class="az-shortcut">⌘R</span>
        </div>
        ${FEATURES.INSPECT_DISABLE ? `
        <div class="az-menu-item danger" data-action="inspect-block">
          <svg class="az-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          Inspect disabled
        </div>
        ` : ''}
      `;
      document.body.appendChild(menu);

      const showMenu = (x: number, y: number) => {
        menu.classList.remove('visible');
        const W = window.innerWidth, H = window.innerHeight;
        const mW = 220, mH = 330;
        menu.style.left = (x + mW > W ? x - mW : x) + 'px';
        menu.style.top  = (y + mH > H ? y - mH : y) + 'px';
        requestAnimationFrame(() => menu.classList.add('visible'));
      };
      const hideMenu = () => menu.classList.remove('visible');

      const onCtx = (e: MouseEvent) => { e.preventDefault(); showMenu(e.clientX, e.clientY); };
      const onClickOutside = () => hideMenu();
      const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { hideMenu(); closeSearch(); }
        // Ctrl+F / Cmd+F → open in-page search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          openSearch();
        }
        if (FEATURES.INSPECT_DISABLE) {
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            showCopyFlash('DevTools are disabled', false);
          }
        }
      };

      const onMenuClick = (e: MouseEvent) => {
        const item = (e.target as Element).closest<HTMLElement>('.az-menu-item');
        if (!item) return;
        hideMenu();
        switch (item.dataset.action) {
          case 'home':  navigate('/'); break;
          case 'copy':  document.execCommand('copy'); showCopyFlash('Copied!'); break;
          case 'search': openSearch(); break;
          case 'tax':
            if (isLoggedIn) navigate('/tax');
            else { requestAuth(); showCopyFlash('Please log in to access Tax Optimizer', false); }
            break;
          case 'fire':
            if (isLoggedIn) navigate('/fire');
            else { requestAuth(); showCopyFlash('Please log in to access FIRE Planner', false); }
            break;
          case 'reload': window.location.reload(); break;
          case 'inspect-block': showCopyFlash('DevTools disabled on this page', false); break;
        }
      };

      document.addEventListener('contextmenu', onCtx);
      document.addEventListener('click', onClickOutside);
      document.addEventListener('keydown', onKeydown);
      menu.addEventListener('click', onMenuClick);

      cleanups.push(() => {
        menu.remove();
        document.removeEventListener('contextmenu', onCtx);
        document.removeEventListener('click', onClickOutside);
        document.removeEventListener('keydown', onKeydown);
      });
    }

    /* ─────────────────────────────────────────────
       3. IN-PAGE SEARCH BAR
    ───────────────────────────────────────────── */
    const searchBar = document.createElement('div');
    searchBar.id = 'az-search-bar';
    searchBar.innerHTML = `
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.5)" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input id="az-search-input" type="text" placeholder="Search on this page…" autocomplete="off" />
      <span id="az-search-count"></span>
      <button id="az-search-prev" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:2px 4px;font-size:14px">▲</button>
      <button id="az-search-next" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:2px 4px;font-size:14px">▼</button>
      <button id="az-search-close">✕</button>
    `;
    document.body.appendChild(searchBar);

    const searchInput = searchBar.querySelector<HTMLInputElement>('#az-search-input')!;
    const searchCount = searchBar.querySelector<HTMLElement>('#az-search-count')!;

    const openSearch = () => {
      searchBar.classList.add('visible');
      searchInput.focus();
      searchInput.select();
    };
    const closeSearch = () => {
      searchBar.classList.remove('visible');
      clearSearchHighlights();
      searchInput.value = '';
      searchCount.textContent = '';
    };

    searchInput.addEventListener('input', () => {
      const count = runSearch(searchInput.value);
      searchCount.textContent = count > 0 ? `${Math.min(searchIndex + 1, count)} / ${count}` : (searchInput.value.length >= 2 ? '0 results' : '');
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateSearch(e.shiftKey ? -1 : 1, searchCount);
      }
      if (e.key === 'Escape') closeSearch();
    });
    searchBar.querySelector('#az-search-prev')?.addEventListener('click', () => navigateSearch(-1, searchCount));
    searchBar.querySelector('#az-search-next')?.addEventListener('click', () => navigateSearch(1, searchCount));
    searchBar.querySelector('#az-search-close')?.addEventListener('click', closeSearch);

    cleanups.push(() => { searchBar.remove(); clearSearchHighlights(); });

    /* ─────────────────────────────────────────────
       4. TEXT SELECTION MINI-TOOLBAR
    ───────────────────────────────────────────── */
    if (FEATURES.TEXT_SELECT_EFFECT) {
      const toast = document.createElement('div');
      toast.id = 'az-sel-toast';
      toast.innerHTML = `
        <button class="az-sel-btn" data-sel="copy">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy
        </button>
        <button class="az-sel-btn" data-sel="share">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          Share
        </button>
        <button class="az-sel-btn" data-sel="search">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          Search
        </button>
      `;
      document.body.appendChild(toast);

      let hideTimer: ReturnType<typeof setTimeout>;

      const onMouseUp = () => {
        clearTimeout(hideTimer);
        setTimeout(() => {
          const sel  = window.getSelection();
          const text = sel?.toString().trim() ?? '';
          if (!text || text.length < 3) { toast.classList.remove('visible'); return; }
          const range = sel!.getRangeAt(0);
          const rect  = range.getBoundingClientRect();
          const tW = 220;
          let x = rect.left + rect.width / 2 - tW / 2 + window.scrollX;
          let y = rect.top - 52 + window.scrollY;
          x = Math.max(8, Math.min(x, window.innerWidth - tW - 8));
          if (y < 8) y = rect.bottom + window.scrollY + 8;
          toast.style.left = x + 'px';
          toast.style.top  = y + 'px';
          toast.classList.add('visible');
        }, 10);
      };

      const onMouseDown = (e: MouseEvent) => {
        if (!toast.contains(e.target as Node)) hideTimer = setTimeout(() => toast.classList.remove('visible'), 150);
      };

      const onToastClick = (e: MouseEvent) => {
        const btn = (e.target as Element).closest<HTMLElement>('[data-sel]');
        if (!btn) return;
        const text = window.getSelection()?.toString().trim() ?? '';
        switch (btn.dataset.sel) {
          case 'copy':
            navigator.clipboard.writeText(text).then(() => showCopyFlash(`Copied "${text.slice(0,30)}${text.length>30?'…':''}"`));
            break;
          case 'share':
            if (navigator.share) navigator.share({ text, url: window.location.href });
            else { navigator.clipboard.writeText(`${text} — ${window.location.href}`); showCopyFlash('Link + text copied!'); }
            break;
          case 'search':
            openSearch();
            searchInput.value = text.slice(0, 60);
            const count = runSearch(searchInput.value);
            searchCount.textContent = count > 0 ? `1 / ${count}` : '0 results';
            break;
        }
        toast.classList.remove('visible');
      };

      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousedown', onMouseDown);
      toast.addEventListener('click', onToastClick);

      cleanups.push(() => {
        toast.remove();
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousedown', onMouseDown);
      });
    }

    /* ─────────────────────────────────────────────
       5. MAGNETIC LINK/BUTTON HOVER
    ───────────────────────────────────────────── */
    if (FEATURES.LINK_HOVER_EFFECT && !isTouchOnly) {
      const applyMagnetic = () => {
        document.querySelectorAll<HTMLElement>('a:not(.az-magnetic), button:not(.az-magnetic)').forEach(el => {
          el.classList.add('az-magnetic');
          const onMM = (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width  / 2)) * 0.2;
            const dy = (e.clientY - (r.top  + r.height / 2)) * 0.2;
            el.style.transform = `translate(${dx}px,${dy}px)`;
          };
          const onML = () => { el.style.transform = 'translate(0,0)'; };
          el.addEventListener('mousemove', onMM);
          el.addEventListener('mouseleave', onML);
        });
      };
      applyMagnetic();

      const origPush = history.pushState.bind(history);
      history.pushState = (...args) => { origPush(...args); setTimeout(applyMagnetic, 350); };
    }

    /* ─────────────────────────────────────────────
       Console signature
    ───────────────────────────────────────────── */
    console.log(
      '%c Arthmize ',
      'background:#6366F1;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold',
      '— UI Effects Active ✦'
    );

    return () => { cleanups.forEach(fn => fn()); };
  }, [isLoggedIn, navigate]);  // Re-run when auth state changes to update context menu

  return null;
}

/* ── Shared flash notification ── */
let flashTimer: ReturnType<typeof setTimeout>;
function showCopyFlash(message: string, isSuccess = true) {
  let flash = document.getElementById('az-copy-flash') as HTMLDivElement | null;
  if (!flash) {
    flash = document.createElement('div') as HTMLDivElement;
    flash.id = 'az-copy-flash';
    document.body.appendChild(flash);
  }
  flash.style.borderColor = isSuccess ? 'rgba(16,185,129,.4)' : 'rgba(99,102,241,.4)';
  flash.style.color = isSuccess ? '#10B981' : '#6366F1';
  flash.innerHTML = `
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      ${isSuccess
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
    </svg>
    ${message}
  `;
  flash.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => flash?.classList.remove('show'), 2500);
}
