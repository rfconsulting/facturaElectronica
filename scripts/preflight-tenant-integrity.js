const pool = require('../src/config/database');

const RELATIONS = [
  ['client_contacts','client_id','clients'],
  ['electronic_invoices','customer_id','clients'],
  ['electronic_invoices','source_quote_id','crm_quotes'],
  ['electronic_invoices','opportunity_id','crm_opportunities'],
  ['crm_leads','client_id','clients'],
  ['crm_opportunities','lead_id','crm_leads'],
  ['crm_opportunities','client_id','clients'],
  ['crm_opportunities','contact_id','client_contacts'],
  ['crm_activities','client_id','clients'],
  ['crm_activities','contact_id','client_contacts'],
  ['crm_activities','lead_id','crm_leads'],
  ['crm_activities','opportunity_id','crm_opportunities'],
  ['crm_activities','invoice_id','electronic_invoices'],
  ['crm_tasks','client_id','clients'],
  ['crm_tasks','lead_id','crm_leads'],
  ['crm_tasks','contact_id','client_contacts'],
  ['crm_tasks','opportunity_id','crm_opportunities'],
  ['crm_quotes','opportunity_id','crm_opportunities'],
  ['crm_quotes','client_id','clients'],
  ['crm_quotes','contact_id','client_contacts'],
  ['crm_quotes','revision_of_id','crm_quotes'],
  ['crm_quote_status_history','quote_id','crm_quotes'],
  ['sales_orders','source_quote_id','crm_quotes'],
  ['sales_orders','client_id','clients'],
  ['sales_orders','contact_id','client_contacts'],
  ['sales_orders','opportunity_id','crm_opportunities'],
  ['accounts_receivable','client_id','clients'],
  ['accounts_receivable','opportunity_id','crm_opportunities'],
  ['accounts_receivable','quote_id','crm_quotes'],
  ['accounts_receivable','invoice_id','electronic_invoices'],
  ['receivable_payments','receivable_id','accounts_receivable']
];

async function inspectTenantIntegrity(connection = pool) {
  const violations = [];
  for (const [childTable, childColumn, parentTable] of RELATIONS) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM ${childTable} child LEFT JOIN ${parentTable} parent ON parent.id=child.${childColumn} WHERE child.${childColumn} IS NOT NULL AND (parent.id IS NULL OR parent.company_id<>child.company_id)`);
    if (Number(row.total)) violations.push({ childTable, childColumn, parentTable, total: Number(row.total) });
  }
  return violations;
}

async function assertTenantIntegrity(connection = pool) {
  const violations = await inspectTenantIntegrity(connection);
  if (violations.length) {
    const error = new Error(`Preflight multiempresa bloqueado: ${violations.reduce((sum,item)=>sum+item.total,0)} referencia(s) huérfana(s) o cruzada(s).`);
    error.code = 'TENANT_INTEGRITY_VIOLATIONS';
    error.violations = violations;
    throw error;
  }
  return { ok: true, relations: RELATIONS.length };
}

if (require.main === module) {
  assertTenantIntegrity().then(result => {
    console.log(`Preflight multiempresa correcto: ${result.relations} relaciones verificadas.`);
  }).catch(error => {
    console.error(error.message);
    if (error.violations) console.table(error.violations);
    process.exitCode = 1;
  }).finally(() => pool.end());
}

module.exports = { RELATIONS, inspectTenantIntegrity, assertTenantIntegrity };
