import { getCsrfToken, request } from '../core/runtime.js';

const EBI_DEMO_URL = 'https://demointegracion.ebi-pac.com/ws/obj/v1.0/Service.svc';
async function stepUpMfa(code) { return request('/api/auth/mfa/step-up', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify({ code }) }); }
export async function secureConfigAction(action, form) {
  try { return await action(); } catch (error) {
    if (error.code !== 'MFA_RECENT_REQUIRED') throw error;
    const code = form.elements.mfaCode.value.trim();
    if (!/^\d{6}$/.test(code)) { form.querySelector('.config-mfa').hidden = false; form.elements.mfaCode.focus(); throw new Error('Introduce tu código MFA actual para autorizar esta operación.'); }
    await stepUpMfa(code); form.elements.mfaCode.value = ''; form.querySelector('.config-mfa').hidden = true; return action();
  }
}

function configurationMarkup() {
  return `<section id="fiscal-config" class="configuration-panel">
    <div class="config-heading"><div><span class="eyebrow">Zero Trust</span><h2>Integración fiscal multi-PAC</h2><p>Selecciona The Factory HKA o Electronic Business Intelligence (EBI) para esta empresa.</p></div><span id="config-status" class="config-status">Consultando…</span></div>
    <form id="fiscal-config-form" autocomplete="off">
      <div class="form-grid">
        <div class="field"><label for="config-provider">Proveedor autorizado</label><select id="config-provider" name="provider"><option value="hka">The Factory HKA</option><option value="ebi">Electronic Business Intelligence (EBI)</option></select></div>
        <div class="field"><label for="config-environment">Ambiente</label><select id="config-environment" name="environment"><option value="demo">Demo · sin validez fiscal</option><option value="production">Producción · documentos fiscales válidos</option></select></div>
        <div class="field" id="config-service-url-field" hidden><label for="config-service-url">URL del servicio SOAP EBI</label><input id="config-service-url" name="serviceUrl" type="url" maxlength="500" placeholder="${EBI_DEMO_URL}"></div>
        <div class="field"><label for="config-branch">Sucursal</label><input id="config-branch" name="branchCode" maxlength="4" value="0000" required></div>
        <div class="field"><label for="config-branch-type">Tipo de sucursal</label><select id="config-branch-type" name="branchType"><option value="1">1 · Venta al detal</option><option value="2">2 · Venta al por mayor</option></select></div>
        <div class="field"><label for="config-point">Punto de facturación</label><input id="config-point" name="billingPoint" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" value="001" required></div>
        <div class="field"><label for="config-timeout">Timeout (ms)</label><input id="config-timeout" name="timeoutMs" type="number" min="1000" max="120000" value="30000" required></div>
      </div>
      <div class="config-secret-box"><div><strong>Credenciales del ambiente seleccionado</strong><p>Se cifran, se reemplazan juntas y nunca se recuperan desde el navegador.</p></div><div class="form-grid">
        <div class="field"><label id="config-username-label" for="config-username">Usuario de servicios web HKA</label><input id="config-username" name="username" maxlength="200" autocomplete="off" required></div>
        <div class="field"><label id="config-password-label" for="config-password">Contraseña de servicios web HKA</label><input id="config-password" name="password" type="password" maxlength="500" autocomplete="new-password" required></div>
      </div></div>
      <div class="config-mfa" hidden><label for="config-mfa-code">Confirmación MFA</label><input id="config-mfa-code" name="mfaCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000"></div>
      <p class="form-message" role="alert" aria-live="polite"></p>
      <div class="config-actions"><button id="test-fiscal-config" class="small-button" type="button">Probar configuración guardada</button><button class="submit-button" type="submit">Guardar proveedor y credenciales</button></div>
    </form>
  </section>`;
}

function updateProviderFields(form) {
  const isEbi = form.elements.provider.value === 'ebi';
  document.querySelector('#config-service-url-field').hidden = !isEbi;
  form.elements.serviceUrl.required = isEbi;
  document.querySelector('#config-username-label').textContent = isEbi ? 'tokenEmpresa de EBI' : 'Usuario de servicios web HKA';
  document.querySelector('#config-password-label').textContent = isEbi ? 'tokenPassword de EBI' : 'Contraseña de servicios web HKA';
  if (isEbi && form.elements.environment.value === 'demo' && !form.elements.serviceUrl.value) form.elements.serviceUrl.value = EBI_DEMO_URL;
  if (isEbi && form.elements.environment.value === 'production' && form.elements.serviceUrl.value === EBI_DEMO_URL) form.elements.serviceUrl.value = '';
}
async function loadConfiguration(form) {
  const status = await request('/api/config/fiscal-api');
  for (const name of ['provider', 'environment', 'serviceUrl', 'branchCode', 'branchType', 'billingPoint', 'timeoutMs']) if (status[name] !== undefined) form.elements[name].value = status[name];
  updateProviderFields(form);
  const badge = document.querySelector('#config-status');
  badge.textContent = `${status.provider?.toUpperCase() || 'HKA'} · ${status.configured ? 'Configurado' : 'No configurado'}`;
  badge.className = `config-status ${status.configured ? 'configured' : ''}`;
}

export async function mountConfiguration() {
  document.querySelector('#configuration-host').innerHTML = configurationMarkup();
  const form = document.querySelector('#fiscal-config-form'), message = form.querySelector('.form-message');
  const show = (kind, value) => { message.className = `form-message ${kind}`; message.textContent = value; };
  form.elements.provider.addEventListener('change', () => updateProviderFields(form));
  form.elements.environment.addEventListener('change', () => updateProviderFields(form));
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]'); button.disabled = true; show('', '');
    try {
      const payload = Object.fromEntries(new FormData(form)); delete payload.mfaCode;
      const action = () => request('/api/config/fiscal-api', { method: 'PUT', headers: { 'content-type': 'application/json', 'x-csrf-token': getCsrfToken() }, body: JSON.stringify(payload) });
      await secureConfigAction(action, form); form.elements.username.value = ''; form.elements.password.value = ''; show('success', 'Proveedor y credenciales cifradas actualizados.'); await loadConfiguration(form);
    } catch (error) { show('error', [error.message, ...(error.details || [])].join(' ')); } finally { button.disabled = false; }
  });
  document.querySelector('#test-fiscal-config').addEventListener('click', async event => {
    event.currentTarget.disabled = true; show('', '');
    try { const action = () => request('/api/config/fiscal-api/test', { method: 'POST', headers: { 'x-csrf-token': getCsrfToken() } }); const result = await secureConfigAction(action, form); show('success', result.message); }
    catch (error) { show('error', error.message); } finally { event.currentTarget.disabled = false; }
  });
  await loadConfiguration(form);
}
