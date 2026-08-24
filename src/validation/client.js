const { validEmail } = require('./auth');

function clean(value, max) { return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max); }

function validateClient(input) {
  const errors = [];
  const value = {
    code: clean(input.code, 30) || null,
    status: input.status === 'inactive' ? 'inactive' : 'active',
    customerType: clean(input.customerType, 2),
    contributorType: clean(input.contributorType, 1) || null,
    ruc: clean(input.ruc, 20) || null, dv: clean(input.dv, 2) || null,
    legalName: clean(input.legalName, 200), tradeName: clean(input.tradeName, 200) || null,
    email: clean(input.email, 254).toLowerCase() || null,
    secondaryEmail: clean(input.secondaryEmail, 254).toLowerCase() || null,
    phone: clean(input.phone, 16) || null, secondaryPhone: clean(input.secondaryPhone, 16) || null,
    address: clean(input.address, 100) || null, locationCode: clean(input.locationCode, 8) || null,
    province: clean(input.province, 50) || null, district: clean(input.district, 50) || null,
    township: clean(input.township, 50) || null, countryCode: clean(input.countryCode || 'PA', 2).toUpperCase(),
    countryOther: clean(input.countryOther, 50) || null, foreignIdType: clean(input.foreignIdType, 2) || null,
    foreignIdNumber: clean(input.foreignIdNumber, 50) || null, foreignCountry: clean(input.foreignCountry, 50) || null,
    notes: clean(input.notes, 2000) || null,
    customFields: input.customFields && typeof input.customFields === 'object' && !Array.isArray(input.customFields) ? input.customFields : {}
  };
  if (!['01', '02', '03', '04'].includes(value.customerType)) errors.push('Selecciona un tipo de receptor válido.');
  if (value.legalName.length < 2) errors.push('El nombre o razón social es obligatorio.');
  if (value.email && !validEmail(value.email)) errors.push('El correo principal no es válido.');
  if (value.secondaryEmail && !validEmail(value.secondaryEmail)) errors.push('El correo secundario no es válido.');
  if (!/^[A-Z]{2}$/.test(value.countryCode)) errors.push('El país debe usar un código ISO de dos letras.');
  if (['01', '03'].includes(value.customerType)) {
    if (!['1', '2'].includes(value.contributorType)) errors.push('Indica si el contribuyente es persona natural o jurídica.');
    if (!value.ruc || !value.dv) errors.push('El RUC y el dígito verificador son obligatorios.');
    if (!value.address || !value.locationCode || !value.province || !value.district || !value.township) errors.push('Completa la dirección fiscal, código de ubicación, provincia, distrito y corregimiento.');
    value.countryCode = 'PA'; value.foreignIdType = null; value.foreignIdNumber = null; value.foreignCountry = null;
  }
  if (value.customerType === '04') {
    if (!['01', '02', '99'].includes(value.foreignIdType)) errors.push('Selecciona el tipo de identificación extranjera.');
    if (!value.foreignIdNumber) errors.push('La identificación extranjera es obligatoria.');
    if (value.countryCode === 'PA') errors.push('El receptor extranjero debe indicar un país distinto de Panamá.');
    value.contributorType = null; value.ruc = null; value.dv = null; value.locationCode = null;
  }
  if (value.countryCode === 'ZZ' && !value.countryOther) errors.push('Especifica el país cuando seleccionas “Otro”.');
  return errors.length ? { errors } : { value };
}

module.exports = { validateClient };
