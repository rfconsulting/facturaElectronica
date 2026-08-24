function validateHkaConfiguration(input) {
  const value = {
    environment: String(input.environment || '').trim().toLowerCase(),
    username: String(input.username || '').trim(), password: String(input.password || ''),
    branchCode: String(input.branchCode || '').trim(), branchType: String(input.branchType || '').trim(),
    billingPoint: String(input.billingPoint || '').trim(), timeoutMs: Number(input.timeoutMs)
  };
  const errors = [];
  if (!['demo', 'production'].includes(value.environment)) errors.push('El ambiente debe ser demo o production.');
  if (!value.username || value.username.length > 200) errors.push('El usuario HKA es obligatorio y no puede exceder 200 caracteres.');
  if (!value.password || value.password.length > 500) errors.push('La contraseña HKA es obligatoria y no puede exceder 500 caracteres.');
  if (!/^[A-Za-z0-9]{4}$/.test(value.branchCode)) errors.push('La sucursal debe contener exactamente 4 caracteres alfanuméricos.');
  if (!['1', '2'].includes(value.branchType)) errors.push('El tipo de sucursal debe ser 1 o 2.');
  if (!/^\d{3}$/.test(value.billingPoint) || value.billingPoint === '000') errors.push('El punto de facturación debe tener 3 dígitos y no puede ser 000.');
  if (!Number.isInteger(value.timeoutMs) || value.timeoutMs < 1000 || value.timeoutMs > 120000) errors.push('El timeout debe estar entre 1000 y 120000 ms.');
  return errors.length ? { errors } : { value };
}
module.exports = { validateHkaConfiguration };
