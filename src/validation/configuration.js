const EBI_DEMO_URL = 'https://demointegracion.ebi-pac.com/ws/obj/v1.0/Service.svc';

function validateFiscalConfiguration(input = {}) {
  const provider = String(input.provider || 'hka').trim().toLowerCase();
  const value = {
    provider,
    environment: String(input.environment || '').trim().toLowerCase(),
    username: String(input.username || input.tokenEmpresa || '').trim(),
    password: String(input.password || input.tokenPassword || ''),
    serviceUrl: String(input.serviceUrl || (provider === 'ebi' && input.environment === 'demo' ? EBI_DEMO_URL : '')).trim(),
    branchCode: String(input.branchCode || '').trim(), branchType: String(input.branchType || '').trim(),
    billingPoint: String(input.billingPoint || '').trim(), timeoutMs: Number(input.timeoutMs)
  };
  const errors = [];
  if (!['hka', 'ebi'].includes(value.provider)) errors.push('El proveedor fiscal debe ser HKA o EBI.');
  if (!['demo', 'production'].includes(value.environment)) errors.push('El ambiente debe ser demo o production.');
  if (!value.username || value.username.length > 200) errors.push(value.provider === 'ebi' ? 'El tokenEmpresa de EBI es obligatorio y no puede exceder 200 caracteres.' : 'El usuario HKA es obligatorio y no puede exceder 200 caracteres.');
  if (!value.password || value.password.length > 500) errors.push(value.provider === 'ebi' ? 'El tokenPassword de EBI es obligatorio y no puede exceder 500 caracteres.' : 'La contraseña HKA es obligatoria y no puede exceder 500 caracteres.');
  if (value.provider === 'ebi') {
    try {
      const serviceUrl = new URL(value.serviceUrl);
      if (serviceUrl.protocol !== 'https:') errors.push('La URL del servicio EBI debe usar HTTPS.');
      if (value.environment === 'production' && serviceUrl.hostname === 'demointegracion.ebi-pac.com') errors.push('Producción EBI requiere la URL contractual de producción, no el servicio demo.');
    }
    catch { errors.push('La URL del servicio SOAP de EBI no es válida.'); }
  }
  if (!/^[A-Za-z0-9]{4}$/.test(value.branchCode)) errors.push('La sucursal debe contener exactamente 4 caracteres alfanuméricos.');
  if (!['1', '2'].includes(value.branchType)) errors.push('El tipo de sucursal debe ser 1 o 2.');
  if (!/^\d{3}$/.test(value.billingPoint) || value.billingPoint === '000') errors.push('El punto de facturación debe tener 3 dígitos y no puede ser 000.');
  if (!Number.isInteger(value.timeoutMs) || value.timeoutMs < 1000 || value.timeoutMs > 120000) errors.push('El timeout debe estar entre 1000 y 120000 ms.');
  return errors.length ? { errors } : { value };
}

function validateHkaConfiguration(input) { return validateFiscalConfiguration({ ...input, provider: 'hka' }); }
module.exports = { validateFiscalConfiguration, validateHkaConfiguration, EBI_DEMO_URL };
