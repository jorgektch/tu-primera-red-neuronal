/**
 * Context-aware navigation toolbar.
 * Controls stay keyboard-focusable even while visually hidden; the slide
 * counter is deliberately independent and never hidden by this controller.
 */

/** The reveal region is the lower-right area occupied by the toolbar. */
export function isPointerInRevealZone(point, rect, viewport, zonePx = 90) {
  if (!point || !rect || !viewport || rect.width <= 0 || rect.height <= 0) return false;
  const left = Math.max(0, rect.left - Math.min(zonePx / 2, 40));
  const top = Math.max(0, viewport.height - zonePx);
  return point.x >= left && point.x <= viewport.width &&
    point.y >= top && point.y <= viewport.height;
}

/** @returns {() => void} cleanup function */
export function setupNavigationVisibility({
  nav, trigger, enabled = true, mode = 'auto',
  hideDelayMs = 3000, revealZonePx = 90,
  win = window, doc = document
}) {
  if (!nav || !trigger) throw Error('Navigation and mobile trigger are required');
  const actualMode = ['auto','always','hidden'].includes(mode) ? mode : 'auto';
  let timer = null;
  let touchOpen = false;
  let disposed = false;
  const cleanups = [];
  const on = (target, event, callback, options) => {
    target.addEventListener(event, callback, options);
    cleanups.push(() => target.removeEventListener(event, callback, options));
  };
  const clearHide = () => {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
  };
  const isOpen = () => nav.classList.contains('is-visible');
  const setVisible = visible => {
    if (disposed) return;
    nav.classList.toggle('is-visible', visible);
    trigger.setAttribute('aria-expanded', String(visible));
    const label = visible ? 'Ocultar controles de navegación' : 'Mostrar controles de navegación';
    trigger.setAttribute('aria-label', label);
    trigger.title = label;
  };
  const hide = () => {
    clearHide();
    if (touchOpen || nav.contains(doc.activeElement) || nav.matches(':hover')) return;
    setVisible(false);
  };
  const scheduleHide = () => {
    clearHide();
    if (touchOpen || nav.contains(doc.activeElement) || nav.matches(':hover')) return;
    timer = win.setTimeout(hide, hideDelayMs);
  };
  const show = (hold = false) => {
    clearHide();
    setVisible(true);
    if (!hold) scheduleHide();
  };

  nav.classList.remove('nav-auto', 'is-visible');
  nav.hidden = !enabled || actualMode === 'hidden';
  trigger.hidden = !enabled || actualMode !== 'auto';
  trigger.setAttribute('aria-expanded', 'false');
  if (nav.hidden) return () => {};
  if (actualMode === 'always') {
    setVisible(true);
    return () => {};
  }

  nav.classList.add('nav-auto');
  show(); // demonstrate that controls exist when someone first opens the deck

  const pointerMove = event => {
    if (event.pointerType === 'touch') return;
    const nearby = isPointerInRevealZone(
      {x:event.clientX, y:event.clientY}, nav.getBoundingClientRect(),
      {width:win.innerWidth, height:win.innerHeight}, revealZonePx
    );
    if (nearby) {
      if (nav.matches(':hover')) show(true);
      else show();
    } else if (isOpen() && !touchOpen) scheduleHide();
  };
  on(win, 'pointermove', pointerMove, {passive:true});
  on(nav, 'pointerenter', () => show(true));
  on(nav, 'pointerleave', () => { if (!touchOpen) scheduleHide(); });
  on(nav, 'focusin', () => show(true));
  on(nav, 'focusout', () => {
    // Focus moves after focusout; defer the check so Tab works normally.
    win.setTimeout(() => { if (!nav.contains(doc.activeElement)) scheduleHide(); }, 0);
  });
  on(nav, 'click', event => {
    // Mouse clicks often focus buttons. Release that pointer-created focus so
    // the toolbar can still auto-hide; keyboard clicks (detail=0) keep focus.
    if (event.detail > 0) win.setTimeout(() => {
      if (nav.contains(doc.activeElement)) doc.activeElement.blur();
      if (!touchOpen) scheduleHide();
    }, 0);
  });
  on(trigger, 'click', () => {
    if (touchOpen || isOpen()) {
      touchOpen = false;
      clearHide();
      setVisible(false);
    } else {
      touchOpen = true;
      show(true);
    }
  });
  on(doc, 'pointerdown', event => {
    if (touchOpen && !nav.contains(event.target) && !trigger.contains(event.target)) {
      touchOpen = false;
      setVisible(false);
    }
  });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden && !touchOpen) {
      clearHide();
      setVisible(false);
    }
  });

  return () => {
    disposed = true;
    clearHide();
    cleanups.forEach(remove => remove());
  };
}
