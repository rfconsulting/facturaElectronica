const express = require('express');
const crypto = require('node:crypto');
const pool = require('../config/database');
const { requireAuth, requireMfa, requireAdministrator, verifyCsrf } = require('../middleware/security');
const { singleMemoryFile } = require('../middleware/multipart');
const { validateArticle } = require('../validation/article');
const { parseZohoArticleFile } = require('../services/zoho-article-import');
const audit = require('../services/audit');

const router = express.Router();
const uploadZohoFile = singleMemoryFile('file', { fileSize: 5 * 1024 * 1024 });
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

router.post('/import/zoho', requireAdministrator, verifyCsrf, uploadZohoFile, async (req, res, next) => {
  if (!req.file) return res.status(422).json({ error: 'Selecciona el archivo de artículos exportado por Zoho.' });
  try {
    const parsed = parseZohoArticleFile(req.file), valid = [], invalid = [];
    for (const item of parsed) { const validation = validateArticle(item.article); if (validation.errors) invalid.push({ row: item.sourceRow, name: item.article.name || 'Sin nombre', errors: validation.errors }); else valid.push({ ...item, article: validation.value }); }
    const ids = valid.map((x) => x.article.zohoItemId).filter(Boolean), skus = valid.map((x) => x.article.sku).filter(Boolean);
    const [existing] = await pool.query('SELECT id,zoho_item_id AS zohoItemId,sku FROM articles WHERE company_id=? AND (zoho_item_id IN (?) OR sku IN (?))', [req.company.id, ids.length ? ids : [''], skus.length ? skus : ['']]);
    const duplicateOf = (article) => existing.find((x) => (article.zohoItemId && x.zohoItemId === article.zohoItemId) || (article.sku && x.sku === article.sku));
    const duplicates = valid.filter((x) => duplicateOf(x.article)).map((x) => ({ row: x.sourceRow, name: x.article.name, existingId: duplicateOf(x.article).id }));
    const ready = valid.filter((x) => !duplicateOf(x.article));
    const summary={total:parsed.length,ready:ready.length,products:ready.filter((x)=>x.article.itemType==='product').length,services:ready.filter((x)=>x.article.itemType==='service').length,duplicates:duplicates.length,invalid:invalid.length},fileHash=crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    if (req.body.confirm !== 'true') {const importJobId=crypto.randomUUID();await pool.execute("INSERT INTO import_jobs (id,company_id,created_by,import_type,file_hash,rules_version,mapping_version,summary,idempotency_key,expires_at) VALUES (?,?,?,'zoho_articles',?,'articles-v1','zoho-articles-v1',?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))",[importJobId,req.company.id,req.authUser.id,fileHash,JSON.stringify(summary),importJobId]);return res.json({importJobId,expiresInSeconds:1800,summary,preview: ready.slice(0, 100).map((x) => ({ row: x.sourceRow, name: x.article.name, sku: x.article.sku, itemType: x.article.itemType, salePrice: x.article.salePrice })), duplicates: duplicates.slice(0, 50), invalid: invalid.slice(0, 50) });}
    const importJobId=String(req.body.importJobId||'');
    if(!/^[0-9a-f-]{36}$/i.test(importJobId))return res.status(422).json({error:'La confirmación requiere el import_job_id de la vista previa.',code:'IMPORT_JOB_REQUIRED'});
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[job]]=await connection.execute("SELECT status,file_hash,rules_version,summary,result,expires_at FROM import_jobs WHERE id=? AND company_id=? AND created_by=? AND import_type='zoho_articles' FOR UPDATE",[importJobId,req.company.id,req.authUser.id]);
      if(!job){await connection.rollback();return res.status(404).json({error:'La vista previa no pertenece al usuario o empresa activa.',code:'IMPORT_JOB_NOT_FOUND'});}
      if(job.status==='completed'){await connection.commit();const result=typeof job.result==='string'?JSON.parse(job.result):job.result;return res.json({message:`${result.imported} artículos importados.`,replayed:true,summary:result});}
      if(job.status!=='previewed'||new Date(job.expires_at)<=new Date()){await connection.execute("UPDATE import_jobs SET status='expired' WHERE id=?",[importJobId]);await connection.commit();return res.status(409).json({error:'La vista previa expiró; analiza nuevamente el archivo.',code:'IMPORT_JOB_EXPIRED'});}
      const original=typeof job.summary==='string'?JSON.parse(job.summary):job.summary;
      if(job.file_hash!==fileHash||job.rules_version!=='articles-v1'||JSON.stringify(original)!==JSON.stringify(summary)){await connection.rollback();return res.status(409).json({error:'El archivo, las reglas o el resultado cambiaron desde la vista previa.',code:'IMPORT_PREVIEW_CHANGED'});}
      await connection.execute("UPDATE import_jobs SET status='processing' WHERE id=?",[importJobId]);
      for (const { article: v } of ready) await connection.execute('INSERT INTO articles (company_id,zoho_item_id,sku,name,description,item_type,status,unit,sale_price,currency,tax_code,tax_name,cpbs_code,profit,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.company.id,v.zohoItemId,v.sku,v.name,v.description,v.itemType,v.status,v.unit,v.salePrice,v.currency,v.taxCode,v.taxName,v.cpbsCode,v.profit,req.authUser.id,req.authUser.id]);
      const result={imported:ready.length,products:summary.products,services:summary.services,duplicates:summary.duplicates,invalid:summary.invalid};
      await connection.execute("UPDATE import_jobs SET status='completed',result=?,completed_at=UTC_TIMESTAMP() WHERE id=?",[JSON.stringify(result),importJobId]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    await audit(req, 'articles.zoho_imported', 'import_job', null);
    return res.status(201).json({ message: `${ready.length} artículos importados.`, summary: { imported: ready.length, products: ready.filter((x) => x.article.itemType === 'product').length, services: ready.filter((x) => x.article.itemType === 'service').length, duplicates: duplicates.length, invalid: invalid.length } });
  } catch (error) { if (/archivo|artículos|exportación/i.test(error.message)) return res.status(422).json({ error: error.message }); return next(error); }
});

module.exports = router;
