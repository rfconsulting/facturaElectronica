const express = require('express');
const multer = require('multer');
const pool = require('../config/database');
const { requireAuth, requireMfa, requireAdministrator, verifyCsrf } = require('../middleware/security');
const { validateArticle } = require('../validation/article');
const { parseZohoArticleFile } = require('../services/zoho-article-import');
const audit = require('../services/audit');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
router.use(requireAuth, requireMfa);
const columns = 'id,zoho_item_id AS zohoItemId,sku,name,description,item_type AS itemType,status,available_in_pos AS availableInPos,unit,sale_price AS salePrice,currency,tax_code AS taxCode,tax_name AS taxName,cpbs_code AS cpbsCode,profit,created_at AS createdAt,updated_at AS updatedAt';

router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    const type = ['product', 'service'].includes(req.query.type) ? req.query.type : null;
    const pos = req.query.pos === 'true'; const like = `%${search}%`;
    const [articles] = await pool.execute(`SELECT ${columns} FROM articles WHERE company_id=? AND status='active' AND (?=FALSE OR available_in_pos=TRUE) AND (? IS NULL OR item_type=?) AND (?='' OR name LIKE ? OR sku LIKE ?) ORDER BY name LIMIT 300`, [req.company.id, pos, type, type, search, like, like]);
    return res.json({ articles });
  } catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT ${columns} FROM articles WHERE id=? AND company_id=? LIMIT 1`, [req.params.id, req.company.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Artículo no encontrado.' });
    return res.json({ article: rows[0] });
  } catch (error) { return next(error); }
});

async function save(req, res, next, id) {
  const validation = validateArticle(req.body);
  if (validation.errors) return res.status(422).json({ error: 'Revisa el artículo.', details: validation.errors });
  const v = validation.value;
  try {
    let articleId = id;
    if (id) {
      const [result] = await pool.execute('UPDATE articles SET zoho_item_id=?,sku=?,name=?,description=?,item_type=?,status=?,available_in_pos=?,unit=?,sale_price=?,currency=?,tax_code=?,tax_name=?,cpbs_code=?,profit=?,updated_by=? WHERE id=? AND company_id=?', [v.zohoItemId,v.sku,v.name,v.description,v.itemType,v.status,v.availableInPos,v.unit,v.salePrice,v.currency,v.taxCode,v.taxName,v.cpbsCode,v.profit,req.authUser.id,id,req.company.id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Artículo no encontrado.' });
    } else {
      const [result] = await pool.execute('INSERT INTO articles (company_id,zoho_item_id,sku,name,description,item_type,status,available_in_pos,unit,sale_price,currency,tax_code,tax_name,cpbs_code,profit,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.company.id,v.zohoItemId,v.sku,v.name,v.description,v.itemType,v.status,v.availableInPos,v.unit,v.salePrice,v.currency,v.taxCode,v.taxName,v.cpbsCode,v.profit,req.authUser.id,req.authUser.id]);
      articleId = result.insertId;
    }
    await audit(req, id ? 'article.updated' : 'article.created', 'article', articleId);
    return res.status(id ? 200 : 201).json({ message: id ? 'Artículo actualizado.' : 'Artículo creado.', id: articleId });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El SKU o identificador Zoho ya existe en esta empresa.' }); return next(error); }
}

router.post('/', verifyCsrf, (req, res, next) => save(req, res, next, null));
router.put('/:id', verifyCsrf, (req, res, next) => save(req, res, next, req.params.id));

router.post('/import/zoho', requireAdministrator, verifyCsrf, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(422).json({ error: 'Selecciona el archivo de artículos exportado por Zoho.' });
  try {
    const parsed = parseZohoArticleFile(req.file), valid = [], invalid = [];
    for (const item of parsed) { const validation = validateArticle(item.article); if (validation.errors) invalid.push({ row: item.sourceRow, name: item.article.name || 'Sin nombre', errors: validation.errors }); else valid.push({ ...item, article: validation.value }); }
    const ids = valid.map((x) => x.article.zohoItemId).filter(Boolean), skus = valid.map((x) => x.article.sku).filter(Boolean);
    const [existing] = await pool.query('SELECT id,zoho_item_id AS zohoItemId,sku FROM articles WHERE company_id=? AND (zoho_item_id IN (?) OR sku IN (?))', [req.company.id, ids.length ? ids : [''], skus.length ? skus : ['']]);
    const duplicateOf = (article) => existing.find((x) => (article.zohoItemId && x.zohoItemId === article.zohoItemId) || (article.sku && x.sku === article.sku));
    const duplicates = valid.filter((x) => duplicateOf(x.article)).map((x) => ({ row: x.sourceRow, name: x.article.name, existingId: duplicateOf(x.article).id }));
    const ready = valid.filter((x) => !duplicateOf(x.article));
    if (req.body.confirm !== 'true') return res.json({ summary: { total: parsed.length, ready: ready.length, products: ready.filter((x) => x.article.itemType === 'product').length, services: ready.filter((x) => x.article.itemType === 'service').length, duplicates: duplicates.length, invalid: invalid.length }, preview: ready.slice(0, 100).map((x) => ({ row: x.sourceRow, name: x.article.name, sku: x.article.sku, itemType: x.article.itemType, salePrice: x.article.salePrice })), duplicates: duplicates.slice(0, 50), invalid: invalid.slice(0, 50) });
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { article: v } of ready) await connection.execute('INSERT INTO articles (company_id,zoho_item_id,sku,name,description,item_type,status,unit,sale_price,currency,tax_code,tax_name,cpbs_code,profit,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.company.id,v.zohoItemId,v.sku,v.name,v.description,v.itemType,v.status,v.unit,v.salePrice,v.currency,v.taxCode,v.taxName,v.cpbsCode,v.profit,req.authUser.id,req.authUser.id]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    await audit(req, 'articles.zoho_imported', 'article_import', null);
    return res.status(201).json({ message: `${ready.length} artículos importados.`, summary: { imported: ready.length, products: ready.filter((x) => x.article.itemType === 'product').length, services: ready.filter((x) => x.article.itemType === 'service').length, duplicates: duplicates.length, invalid: invalid.length } });
  } catch (error) { if (/archivo|artículos|exportación/i.test(error.message)) return res.status(422).json({ error: error.message }); return next(error); }
});

module.exports = router;
