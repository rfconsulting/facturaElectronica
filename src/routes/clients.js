const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireMfa, requireAdministrator, verifyCsrf } = require('../middleware/security');
const { validateClient } = require('../validation/client');
const audit = require('../services/audit');
const multer = require('multer');
const { parseZohoFile } = require('../services/zoho-import');

const router = express.Router();
router.use(requireAuth, requireMfa);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const columns = `id,code,status,customer_type AS customerType,contributor_type AS contributorType,ruc,dv,
 legal_name AS legalName,trade_name AS tradeName,email,secondary_email AS secondaryEmail,phone,
 secondary_phone AS secondaryPhone,address,location_code AS locationCode,province,district,township,
 country_code AS countryCode,country_other AS countryOther,foreign_id_type AS foreignIdType,
 foreign_id_number AS foreignIdNumber,foreign_country AS foreignCountry,notes,created_at AS createdAt,updated_at AS updatedAt`;

router.get('/custom-fields', async (req, res, next) => {
  try {
    const [fields] = await pool.execute('SELECT id,field_key AS fieldKey,label,field_type AS fieldType,is_required AS isRequired,is_active AS isActive FROM client_custom_field_definitions WHERE company_id=? AND is_active=TRUE ORDER BY label', [req.company.id]);
    return res.json({ fields });
  } catch (error) { return next(error); }
});

router.post('/custom-fields', requireAdministrator, verifyCsrf, async (req, res, next) => {
  const label = String(req.body.label || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const fieldType = String(req.body.fieldType || 'text');
  const fieldKey = String(req.body.fieldKey || label).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
  if (label.length < 2 || !fieldKey || !['text', 'number', 'date', 'boolean'].includes(fieldType)) return res.status(422).json({ error: 'La definición del campo personalizado no es válida.' });
  try {
    const [result] = await pool.execute('INSERT INTO client_custom_field_definitions (company_id,field_key,label,field_type,is_required,created_by) VALUES (?,?,?,?,?,?)', [req.company.id, fieldKey, label, fieldType, Boolean(req.body.isRequired), req.authUser.id]);
    await audit(req, 'client_custom_field.created', 'client_custom_field', result.insertId);
    return res.status(201).json({ message: 'Campo personalizado creado.', id: result.insertId });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un campo con esa clave.' }); return next(error); }
});

router.get('/', async (req, res, next) => {
  const search = String(req.query.search || '').trim().slice(0, 100);
  const status = req.query.status === 'inactive' ? 'inactive' : 'active';
  try {
    const like = `%${search}%`;
    const [clients] = await pool.execute(`SELECT id,code,status,customer_type AS customerType,legal_name AS legalName,trade_name AS tradeName,ruc,dv,email,phone,updated_at AS updatedAt FROM clients WHERE company_id=? AND status=? AND (?='' OR legal_name LIKE ? OR trade_name LIKE ? OR ruc LIKE ? OR code LIKE ?) ORDER BY legal_name LIMIT 200`, [req.company.id, status, search, like, like, like, like]);
    return res.json({ clients });
  } catch (error) { return next(error); }
});

router.post('/import/zoho', requireAdministrator, verifyCsrf, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(422).json({ error: 'Selecciona el archivo exportado por Zoho Invoice.' });
  try {
    const parsed = parseZohoFile(req.file); const valid = []; const invalid = [];
    for (const item of parsed) { const validation = validateClient(item.client); if (validation.errors) invalid.push({ row: item.sourceRow, name: item.client.legalName || 'Sin nombre', errors: validation.errors }); else valid.push({ ...item, client: validation.value }); }
    const codes = valid.map((item) => item.client.code).filter(Boolean); const emails = valid.map((item) => item.client.email).filter(Boolean); const rucs = valid.map((item) => item.client.ruc).filter(Boolean);
    const [existing] = await pool.query('SELECT id,code,email,ruc FROM clients WHERE company_id=? AND (code IN (?) OR email IN (?) OR ruc IN (?))', [req.company.id, codes.length ? codes : [''], emails.length ? emails : [''], rucs.length ? rucs : ['']]);
    const duplicateOf = (client) => existing.find((row) => (client.code && row.code === client.code) || (client.email && row.email === client.email) || (client.ruc && row.ruc === client.ruc));
    const duplicates = valid.filter((item) => duplicateOf(item.client)).map((item) => ({ row: item.sourceRow, name: item.client.legalName, existingId: duplicateOf(item.client).id }));
    const ready = valid.filter((item) => !duplicateOf(item.client));
    const preview = req.body.confirm !== 'true';
    if (preview) return res.json({ summary: { total: parsed.length, ready: ready.length, duplicates: duplicates.length, invalid: invalid.length, warnings: parsed.filter((item) => item.warnings.length).length }, preview: ready.slice(0, 100).map((item) => ({ row: item.sourceRow, name: item.client.legalName, email: item.client.email, ruc: item.client.ruc, customerType: item.client.customerType, warnings: item.warnings })), duplicates: duplicates.slice(0, 50), invalid: invalid.slice(0, 50) });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of ready) { const v = item.client; await connection.execute('INSERT INTO clients (company_id,code,status,customer_type,contributor_type,ruc,dv,legal_name,trade_name,email,secondary_email,phone,secondary_phone,address,location_code,province,district,township,country_code,country_other,foreign_id_type,foreign_id_number,foreign_country,notes,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.company.id,v.code,v.status,v.customerType,v.contributorType,v.ruc,v.dv,v.legalName,v.tradeName,v.email,v.secondaryEmail,v.phone,v.secondaryPhone,v.address,v.locationCode,v.province,v.district,v.township,v.countryCode,v.countryOther,v.foreignIdType,v.foreignIdNumber,v.foreignCountry,v.notes,req.authUser.id,req.authUser.id]); }
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    await audit(req, 'clients.zoho_imported', 'client_import', null);
    return res.status(201).json({ message: `${ready.length} clientes importados.`, summary: { imported: ready.length, duplicates: duplicates.length, invalid: invalid.length } });
  } catch (error) { if (/archivo|libro|hoja|clientes/i.test(error.message)) return res.status(422).json({ error: error.message }); return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT ${columns} FROM clients WHERE id=? AND company_id=? LIMIT 1`, [req.params.id, req.company.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Cliente no encontrado.' });
    const [values] = await pool.execute('SELECT field_definition_id AS fieldId,field_value AS value FROM client_custom_field_values WHERE client_id=?', [req.params.id]);
    rows[0].customFields = Object.fromEntries(values.map((item) => [item.fieldId, item.value]));
    return res.json({ client: rows[0] });
  } catch (error) { return next(error); }
});

async function saveClient(req, res, next, id) {
  const validation = validateClient(req.body);
  if (validation.errors) return res.status(422).json({ error: 'Revisa la ficha del cliente.', details: validation.errors });
  const v = validation.value;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const params = [v.code,v.status,v.customerType,v.contributorType,v.ruc,v.dv,v.legalName,v.tradeName,v.email,v.secondaryEmail,v.phone,v.secondaryPhone,v.address,v.locationCode,v.province,v.district,v.township,v.countryCode,v.countryOther,v.foreignIdType,v.foreignIdNumber,v.foreignCountry,v.notes,req.authUser.id];
    let clientId = id;
    if (id) {
      const [result] = await connection.execute('UPDATE clients SET code=?,status=?,customer_type=?,contributor_type=?,ruc=?,dv=?,legal_name=?,trade_name=?,email=?,secondary_email=?,phone=?,secondary_phone=?,address=?,location_code=?,province=?,district=?,township=?,country_code=?,country_other=?,foreign_id_type=?,foreign_id_number=?,foreign_country=?,notes=?,updated_by=? WHERE id=? AND company_id=?', [...params, id, req.company.id]);
      if (!result.affectedRows) { await connection.rollback(); return res.status(404).json({ error: 'Cliente no encontrado.' }); }
    } else {
      const [result] = await connection.execute('INSERT INTO clients (company_id,code,status,customer_type,contributor_type,ruc,dv,legal_name,trade_name,email,secondary_email,phone,secondary_phone,address,location_code,province,district,township,country_code,country_other,foreign_id_type,foreign_id_number,foreign_country,notes,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.company.id, ...params.slice(0, -1), req.authUser.id, req.authUser.id]);
      clientId = result.insertId;
    }
    const [definitions] = await connection.execute('SELECT id,is_required AS isRequired FROM client_custom_field_definitions WHERE company_id=? AND is_active=TRUE', [req.company.id]);
    for (const definition of definitions) {
      const raw = v.customFields[definition.id] ?? v.customFields[String(definition.id)];
      const fieldValue = raw === undefined || raw === null ? '' : String(raw).trim().slice(0, 2000);
      if (definition.isRequired && !fieldValue) { const error = new Error('Completa los campos personalizados obligatorios.'); error.statusCode = 422; throw error; }
      if (fieldValue) await connection.execute('INSERT INTO client_custom_field_values (client_id,field_definition_id,field_value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE field_value=VALUES(field_value)', [clientId, definition.id, fieldValue]);
      else await connection.execute('DELETE FROM client_custom_field_values WHERE client_id=? AND field_definition_id=?', [clientId, definition.id]);
    }
    await connection.commit();
    await audit(req, id ? 'client.updated' : 'client.created', 'client', clientId);
    return res.status(id ? 200 : 201).json({ message: id ? 'Ficha actualizada.' : 'Cliente creado.', id: clientId });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El código de cliente ya está en uso.' });
    if (error.statusCode === 422) return res.status(422).json({ error: error.message });
    return next(error);
  } finally { connection.release(); }
}

router.post('/', verifyCsrf, (req, res, next) => saveClient(req, res, next, null));
router.put('/:id', verifyCsrf, (req, res, next) => saveClient(req, res, next, req.params.id));

module.exports = router;
