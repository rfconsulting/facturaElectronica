export function installFormClosures() {
  function closeCrmDrawer() {
    const drawer = document.querySelector('#crm-drawer');
    const backdrop = document.querySelector('#crm-drawer-backdrop');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('open');
    document.body.classList.remove('crm-drawer-open');
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-crm-close]') || target.id === 'crm-drawer-backdrop') {
      event.preventDefault();
      event.stopPropagation();
      closeCrmDrawer();
      return;
    }
    const erpClose = target.closest('[data-erp-close]');
    if (erpClose) {
      event.preventDefault();
      event.stopPropagation();
      erpClose.closest('dialog')?.close();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.querySelector('#crm-drawer')?.classList.contains('open')) closeCrmDrawer();
  });
}
