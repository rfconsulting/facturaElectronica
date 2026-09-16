import { getCsrfToken, request, setCsrfToken } from './core/runtime.js';
import {
  navigate,
  registerSectionLoader,
  setupCompanySwitcher,
  setupNavigation,
  setupSidebarCollapse,
} from './core/navigation-bridge.js';
import {
  loadClientFields,
  loadClients,
  setupClients,
  setupLocationAutocomplete,
  setupZohoImport,
} from './modules/clients.js';
import {
  configureArticleInvoiceActions,
  loadArticles,
  loadInvoiceArticleCatalog,
  setupArticles,
  setupPosAvailability,
  setupQuickArticle,
} from './modules/articles.js';
import { addItem, calculate, loadInvoices, setupInvoicing } from './modules/invoicing.js';
import {
  loadPosClients,
  loadPosProducts,
  preservePosCartLines,
  setupPos,
  setupPosEnhancements,
} from './modules/pos.js';
import { crmInstall, loadCrm } from '../crm-ui.js';
import { loadErpSection, setupErpWorkspace } from '../erp-ui.js';
import {
  loadAdministration,
  loadUsers,
  setupAdministration,
  setupUsers,
} from './modules/administration.js';
import { mountConfiguration } from './modules/fiscal-configuration.js';
import '../correlatives.js';

async function loadSession() {
  try {
    const [session, csrf] = await Promise.all([
      request('/api/auth/me'),
      request('/api/csrf-token'),
    ]);
    setCsrfToken(csrf.csrfToken);
    document.querySelector('#user-name').textContent = session.user.fullName;
    document.querySelector('#sidebar-user-name').textContent = session.user.fullName;
    document.querySelector('#user-initials').textContent = session.user.fullName
      .split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
    document.querySelector('#user-email').textContent = session.user.email;
    document.querySelector('#user-role').textContent = session.user.role;
    await setupCompanySwitcher();
    const canAdmin = session.user.role === 'administrator' || Boolean(session.user.isSuperuser);
    if (canAdmin) {
      document.querySelectorAll('.admin-navigation').forEach((element) => { element.hidden = false; });
      setupAdministration();
      await Promise.all([mountConfiguration(), loadAdministration()]);
    }
    await loadInvoices();
    navigate(location.hash.slice(1) || 'erpDashboard', false);
    return session;
  } catch {
    window.location.replace('/login.html');
    return null;
  }
}

document.querySelector('#logout').addEventListener('click', async () => {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': getCsrfToken() },
    });
  } finally {
    window.location.replace('/login.html');
  }
});

crmInstall();
setupErpWorkspace();
configureArticleInvoiceActions({ addItem, calculate });
registerSectionLoader('crm', loadCrm);
for (const section of ['erpDashboard', 'quotations', 'orders', 'invoice', 'documents', 'pos', 'clients', 'articles', 'receivables']) {
  registerSectionLoader(section, () => loadErpSection(section));
}
setupSidebarCollapse();
setupNavigation();
setupClients();
setupLocationAutocomplete();
setupZohoImport();
setupPosAvailability();
setupArticles();
setupQuickArticle();
setupInvoicing();
setupPos();
setupPosEnhancements();
preservePosCartLines();
setupUsers();

loadSession().then(async (session) => {
  if (!session) return;
  const superuser = Boolean(session.user.isSuperuser);
  const isAdministrator = session.user.role === 'administrator' || superuser;
  document.querySelector('#custom-field-admin').hidden = !isAdministrator;
  await Promise.all([
    loadClientFields(),
    loadClients(),
    loadArticles(),
    loadInvoiceArticleCatalog(),
    loadPosProducts(),
    loadPosClients(),
    ...(isAdministrator ? [loadUsers()] : []),
  ]);
  document.querySelectorAll('option[value="administrator"]').forEach((option) => {
    option.textContent = 'Administrador de empresa';
  });
  if (!superuser) {
    document.querySelectorAll('#user-invite-form option[value="administrator"],#membership-form option[value="administrator"]').forEach((option) => option.remove());
    document.querySelectorAll('[data-user-role],[data-membership-role]').forEach((select) => {
      if (select.value === 'administrator') select.disabled = true;
    });
  }
  if (superuser) document.querySelector('#user-role').textContent = 'Superusuario';
});
