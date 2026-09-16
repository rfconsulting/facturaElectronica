import { escapeHtml, getCsrfToken, request } from './runtime.js';

const sectionLabels = {
  erpDashboard: ['Operación', 'Resumen ERP'],
  quotations: ['Ventas', 'Cotizaciones'],
  orders: ['Ventas', 'Pedidos'],
  receivables: ['Finanzas', 'Cobros'],
  invoice: ['Operación', 'Nueva factura'],
  pos: ['Punto de venta', 'Venta rápida'],
  documents: ['Trazabilidad', 'Facturas'],
  clients: ['Directorio comercial', 'Clientes'],
  articles: ['Catálogo comercial', 'Artículos'],
  crm: ['Relaciones', 'CRM'],
  configuration: ['Administración', 'Configuración'],
  administration: ['Administración', 'Empresas y acceso'],
  users: ['Administración', 'Usuarios'],
};

const erpSections = ['erpDashboard', 'quotations', 'orders', 'invoice', 'documents', 'pos', 'clients', 'articles', 'receivables'];
const administrationSections = ['configuration', 'administration', 'users'];
const sectionLoaders = new Map();

export function registerSectionLoader(section, loader) {
  sectionLoaders.set(section, loader);
}

function setOpenNavGroup(name, persist = true) {
  document.querySelectorAll('[data-nav-group]').forEach((group) => {
    const open = group.dataset.navGroup === name;
    group.classList.toggle('open', open);
    group.classList.toggle('active', open);
    group.querySelector(':scope > [data-module-toggle]')?.setAttribute('aria-expanded', String(open));
  });
  if (persist) try { localStorage.setItem('openNavigationGroup', name); } catch {}
}

function closeMenu() {
  document.querySelector('#app-sidebar').classList.remove('open');
  document.querySelector('#sidebar-overlay').classList.remove('visible');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
}

export function navigate(section, updateHash = true) {
  const panel = document.querySelector(`[data-panel="${section}"]`);
  const link = document.querySelector(`[data-section="${section}"]`);
  if (!panel || !link || link.hidden) return navigate(document.querySelector('[data-panel="erpDashboard"]') ? 'erpDashboard' : 'invoice', updateHash);
  const area = erpSections.includes(section) ? 'erp' : administrationSections.includes(section) ? 'administration' : 'crm';
  document.querySelectorAll('.app-section').forEach((item) => {
    item.hidden = item !== panel;
    item.classList.toggle('active', item === panel);
  });
  document.querySelectorAll('[data-area-navigation]').forEach((nav) => { nav.hidden = nav.dataset.areaNavigation !== area; });
  document.querySelectorAll('[data-area-navigation] [data-section]').forEach((item) => {
    const active = item.dataset.section === section;
    item.classList.toggle('active', active);
    active ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current');
  });
  document.querySelectorAll('.app-nav [data-section]').forEach((item) => {
    const active = item.dataset.section === section && (!item.dataset.crmTab || item.dataset.crmTab === (globalThis.crmTab || 'summary'));
    item.classList.toggle('active', active);
    active ? item.setAttribute('aria-current', 'page') : item.removeAttribute('aria-current');
  });
  setOpenNavGroup(area);
  const [eyebrow, title] = sectionLabels[section];
  document.querySelector('#section-eyebrow').textContent = eyebrow;
  document.querySelector('#section-title').textContent = title;
  sectionLoaders.get(section)?.();
  if (updateHash) history.replaceState(null, '', `#${section}`);
  closeMenu();
}

function setSidebarCompact(compact) {
  const shell = document.querySelector('.app-shell');
  const button = document.querySelector('#sidebar-collapse');
  shell.classList.toggle('sidebar-compact', compact);
  button.setAttribute('aria-expanded', String(!compact));
  button.setAttribute('aria-label', compact ? 'Expandir menú' : 'Contraer menú');
  document.querySelectorAll('.app-sidebar button,.app-sidebar a').forEach((item) => {
    const label = item.querySelector('.nav-module-copy strong, span:last-child')?.textContent?.trim();
    if (compact && label) item.title = label;
    else item.removeAttribute('title');
  });
  try { localStorage.setItem('sidebarCompact', String(compact)); } catch {}
}

export function setupSidebarCollapse() {
  const button = document.querySelector('#sidebar-collapse');
  let compact = false;
  try { compact = localStorage.getItem('sidebarCompact') === 'true'; } catch {}
  setSidebarCompact(compact);
  button.addEventListener('click', () => setSidebarCompact(!document.querySelector('.app-shell').classList.contains('sidebar-compact')));
}

export function setupNavigation() {
  document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.crmTab && typeof renderCrm === 'function') {
      globalThis.crmTab = button.dataset.crmTab;
      crmTab = button.dataset.crmTab;
    }
    navigate(button.dataset.section);
    if (button.dataset.crmTab && typeof renderCrm === 'function') renderCrm();
  }));
  document.querySelectorAll('[data-module-toggle]').forEach((button) => button.addEventListener('click', () => {
    const group = button.closest('[data-nav-group]');
    if (!group.classList.contains('open')) setOpenNavGroup(group.dataset.navGroup);
    else {
      group.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  }));
  document.querySelectorAll('[data-navigation]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(link.dataset.navigation);
  }));
  document.querySelector('#menu-toggle').addEventListener('click', () => {
    const sidebar = document.querySelector('#app-sidebar');
    const open = sidebar.classList.toggle('open');
    document.querySelector('#sidebar-overlay').classList.toggle('visible', open);
    document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open));
  });
  document.querySelector('#sidebar-overlay').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
}

export async function setupCompanySwitcher() {
  const data = await request('/api/auth/companies');
  const select = document.querySelector('#active-company');
  select.innerHTML = data.companies.map((company) => `<option value="${company.id}">${escapeHtml(company.tradeName || company.legalName)}</option>`).join('');
  select.value = String(data.activeCompanyId);
  select.disabled = data.companies.length < 2;
  select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      await request('/api/auth/company', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify({ companyId: Number(select.value) }) });
      location.reload();
    } catch (error) {
      select.disabled = false;
      alert(error.message);
    }
  });
}
