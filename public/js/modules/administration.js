import { escapeHtml, getCsrfToken, request } from '../core/runtime.js';

function adminMessage(form, type, message) {
  const node = form.querySelector('.form-message');
  node.className = `form-message ${type || ''}`;
  node.textContent = message;
}

export async function loadAdministration() {
  const [companyData, memberData] = await Promise.all([
    request('/api/administration/companies'),
    request('/api/administration/memberships'),
  ]);
  document.querySelector('#company-count').textContent = companyData.companies.length;
  document.querySelector('#membership-count').textContent = memberData.memberships.length;
  document.querySelector('#membership-company-name').textContent = memberData.company.name;
  document.querySelector('#company-admin-list').innerHTML = companyData.companies.length
    ? companyData.companies.map((company) => `<div class="company-admin-row ${Number(company.id) === Number(companyData.activeCompanyId) ? 'active' : ''}"><div><strong>${escapeHtml(company.tradeName || company.legalName)}</strong><span>${escapeHtml(company.ruc ? `RUC ${company.ruc}${company.dv ? `-${company.dv}` : ''}` : 'Sin identificación fiscal')} · ${company.activeMembers} miembros activos</span></div>${Number(company.id) === Number(companyData.activeCompanyId) ? '<b>Activa</b>' : ''}</div>`).join('')
    : '<div class="admin-empty">No hay empresas registradas.</div>';
  const roles = { administrator: 'Administrador', accountant: 'Contador', operator: 'Operador' };
  const statuses = { active: 'Activo', suspended: 'Suspendido' };
  const host = document.querySelector('#membership-list');
  host.innerHTML = memberData.memberships.length
    ? memberData.memberships.map((member) => `<div class="membership-row" data-membership-user="${member.userId}"><div><strong>${escapeHtml(member.fullName)}</strong><span>${escapeHtml(member.email)}</span></div><select data-membership-role>${Object.entries(roles).map(([value, label]) => `<option value="${value}" ${member.role === value ? 'selected' : ''}>${label}</option>`).join('')}</select><select data-membership-status>${Object.entries(statuses).map(([value, label]) => `<option value="${value}" ${member.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select><button class="small-button" type="button" data-save-membership>Guardar</button></div>`).join('')
    : '<div class="admin-empty">No hay membresías.</div>';
  host.querySelectorAll('[data-save-membership]').forEach((button) => button.addEventListener('click', async () => {
    const row = button.closest('[data-membership-user]');
    button.disabled = true;
    try {
      await request(`/api/administration/memberships/${row.dataset.membershipUser}`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify({ role: row.querySelector('[data-membership-role]').value, status: row.querySelector('[data-membership-status]').value }) });
      location.reload();
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  }));
}

export function setupAdministration() {
  const companyForm = document.querySelector('#company-form');
  const membershipForm = document.querySelector('#membership-form');
  companyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = companyForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const result = await request('/api/administration/companies', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify(Object.fromEntries(new FormData(companyForm))) });
      adminMessage(companyForm, 'success', result.message);
      companyForm.reset();
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      adminMessage(companyForm, 'error', [error.message, ...(error.details || [])].join(' '));
      button.disabled = false;
    }
  });
  membershipForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = membershipForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const result = await request('/api/administration/memberships', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify(Object.fromEntries(new FormData(membershipForm))) });
      adminMessage(membershipForm, 'success', result.message);
      membershipForm.reset();
      await loadAdministration();
    } catch (error) {
      adminMessage(membershipForm, 'error', [error.message, ...(error.details || [])].join(' '));
    } finally {
      button.disabled = false;
    }
  });
}

export async function runUserAdminAction(action) {
  try { return await action(); }
  catch (error) {
    if (error.code !== 'MFA_RECENT_REQUIRED') throw error;
    const code = prompt('Introduce tu código MFA actual para autorizar esta operación:');
    if (!/^\d{6}$/.test(code || '')) throw new Error('Se requiere un código MFA válido.');
    await stepUpMfa(code);
    return action();
  }
}

export async function loadUsers() {
  const { users } = await request('/api/users');
  document.querySelector('#user-admin-count').textContent = users.length;
  const roles = { administrator: 'Administrador', accountant: 'Contador', operator: 'Operador' };
  const statuses = { active: 'Activo', suspended: 'Suspendido' };
  const host = document.querySelector('#user-admin-list');
  host.innerHTML = users.length ? users.map((user) => `<div class="managed-user" data-managed-user="${user.id}"><div class="managed-user-head"><div><strong>${escapeHtml(user.fullName)}</strong><span>${escapeHtml(user.email)}</span></div><span class="status ${user.accountStatus === 'pending' ? 'status-uncertain' : user.accessStatus === 'active' ? 'status-authorized' : 'status-rejected'}">${user.accountStatus === 'pending' ? 'Pendiente' : statuses[user.accessStatus]}</span></div><div class="form-grid"><div class="field"><label>Nombre</label><input data-user-name value="${escapeHtml(user.fullName)}" maxlength="120"></div><div class="field"><label>Correo</label><input data-user-email type="email" value="${escapeHtml(user.email)}" maxlength="254"></div><div class="field"><label>Rol</label><select data-user-role>${Object.entries(roles).map(([value, label]) => `<option value="${value}" ${user.role === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>Acceso</label><select data-user-status><option value="active" ${user.accessStatus === 'active' ? 'selected' : ''}>Activo</option><option value="suspended" ${user.accessStatus === 'suspended' ? 'selected' : ''}>Suspendido</option></select></div></div><div class="managed-user-actions"><button class="small-button" type="button" data-revoke-user>Revocar sesiones</button><button class="small-button" type="button" data-save-user>Guardar cambios</button></div></div>`).join('') : '<div class="admin-empty">No hay usuarios asociados.</div>';
  host.querySelectorAll('[data-save-user]').forEach((button) => button.addEventListener('click', async () => {
    const row = button.closest('[data-managed-user]');
    button.disabled = true;
    try {
      await runUserAdminAction(() => request(`/api/users/${row.dataset.managedUser}`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify({ fullName: row.querySelector('[data-user-name]').value, email: row.querySelector('[data-user-email]').value, role: row.querySelector('[data-user-role]').value, status: row.querySelector('[data-user-status]').value }) }));
      await loadUsers();
    } catch (error) { alert(error.message); }
    finally { button.disabled = false; }
  }));
  host.querySelectorAll('[data-revoke-user]').forEach((button) => button.addEventListener('click', async () => {
    const row = button.closest('[data-managed-user]');
    button.disabled = true;
    try {
      await runUserAdminAction(() => request(`/api/users/${row.dataset.managedUser}/revoke-sessions`, { method: 'POST', headers: { 'x-csrf-token': getCsrfToken() } }));
      alert('Sesiones revocadas.');
    } catch (error) { alert(error.message); }
    finally { button.disabled = false; }
  }));
}

export function setupUsers() {
  const form = document.querySelector('#user-invite-form');
  const result = document.querySelector('#invitation-result');
  const url = document.querySelector('#invitation-url');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const message = form.querySelector('.form-message');
    button.disabled = true;
    result.hidden = true;
    try {
      const data = await runUserAdminAction(() => request('/api/users/invite', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }));
      message.className = 'form-message success';
      message.textContent = data.message;
      if (data.invitationUrl) {
        url.value = data.invitationUrl;
        result.hidden = false;
      }
      form.reset();
      await loadUsers();
    } catch (error) {
      message.className = 'form-message error';
      message.textContent = [error.message, ...(error.details || [])].join(' ');
    } finally { button.disabled = false; }
  });
  document.querySelector('#copy-invitation').addEventListener('click', async () => {
    await navigator.clipboard.writeText(url.value);
    document.querySelector('#copy-invitation').textContent = 'Copiado';
  });
}

