const env = require('../src/config/env');
const { assertTenantIntegrity } = require('./preflight-tenant-integrity');

const PARENTS = ['clients','client_contacts','articles','electronic_invoices','crm_leads','crm_opportunities','crm_quotes','sales_orders','accounts_receivable'];
const CONSTRAINTS = [
  ['client_contacts','fk_client_contact_client','client_id','clients','CASCADE'],
  ['electronic_invoices','fk_invoice_customer','customer_id','clients','RESTRICT'],
  ['electronic_invoices','fk_invoice_source_quote','source_quote_id','crm_quotes','RESTRICT'],
  ['electronic_invoices','fk_invoice_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['crm_leads','fk_crm_lead_client','client_id','clients','RESTRICT'],
  ['crm_opportunities','fk_crm_opportunity_lead','lead_id','crm_leads','RESTRICT'],
  ['crm_opportunities','fk_crm_opportunity_client','client_id','clients','RESTRICT'],
  ['crm_opportunities','fk_crm_opportunity_contact','contact_id','client_contacts','RESTRICT'],
  ['crm_activities','fk_crm_activity_client','client_id','clients','RESTRICT'],
  ['crm_activities','fk_crm_activity_contact','contact_id','client_contacts','RESTRICT'],
  ['crm_activities','fk_crm_activity_lead','lead_id','crm_leads','RESTRICT'],
  ['crm_activities','fk_crm_activity_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['crm_activities','fk_crm_activity_invoice','invoice_id','electronic_invoices','RESTRICT'],
  ['crm_tasks','fk_crm_task_client','client_id','clients','RESTRICT'],
  ['crm_tasks','fk_crm_task_lead','lead_id','crm_leads','RESTRICT'],
  ['crm_tasks','fk_crm_task_contact','contact_id','client_contacts','RESTRICT'],
  ['crm_tasks','fk_crm_task_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['crm_quotes','fk_crm_quote_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['crm_quotes','fk_crm_quote_client','client_id','clients','RESTRICT'],
  ['crm_quotes','fk_crm_quote_contact','contact_id','client_contacts','RESTRICT'],
  ['crm_quotes','fk_crm_quote_revision','revision_of_id','crm_quotes','RESTRICT'],
  ['crm_quote_status_history','fk_quote_history_quote','quote_id','crm_quotes','CASCADE'],
  ['sales_orders','fk_sales_order_quote','source_quote_id','crm_quotes','RESTRICT'],
  ['sales_orders','fk_sales_order_client','client_id','clients','RESTRICT'],
  ['sales_orders','fk_sales_order_contact','contact_id','client_contacts','RESTRICT'],
  ['sales_orders','fk_sales_order_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['accounts_receivable','fk_receivable_client','client_id','clients','RESTRICT'],
  ['accounts_receivable','fk_receivable_opportunity','opportunity_id','crm_opportunities','RESTRICT'],
  ['accounts_receivable','fk_receivable_quote','quote_id','crm_quotes','RESTRICT'],
  ['accounts_receivable','fk_receivable_invoice','invoice_id','electronic_invoices','RESTRICT'],
  ['receivable_payments','fk_payment_receivable','receivable_id','accounts_receivable','RESTRICT']
];

async function indexExists(connection, table, name) {
  const [rows] = await connection.query('SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?', [env.db.database,table,name]);
  return rows.length > 0;
}
async function constraintColumns(connection, table, name) {
  const [rows] = await connection.query('SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME=? ORDER BY ORDINAL_POSITION',[env.db.database,table,name]);
  return rows.map(row=>row.COLUMN_NAME).join(',');
}
async function migrateTenantIntegrity(connection) {
  await assertTenantIntegrity(connection);
  for (const table of PARENTS) {
    const name=`uq_${table}_company_id`;
    if (!await indexExists(connection,table,name)) await connection.query(`ALTER TABLE ${table} ADD UNIQUE KEY ${name} (company_id,id)`);
  }
  for (const [table,name,column,parent,onDelete] of CONSTRAINTS) {
    if (await constraintColumns(connection,table,name) === `company_id,${column}`) continue;
    if (await constraintColumns(connection,table,name)) await connection.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${name}`);
    // InnoDB conserva a veces el índice auxiliar de la FK eliminada. Su nombre
    // colisionaría con la nueva constraint compuesta aunque ya no exista la FK.
    if (await indexExists(connection,table,name)) await connection.query(`ALTER TABLE ${table} DROP INDEX ${name}`);
    await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} FOREIGN KEY (company_id,${column}) REFERENCES ${parent}(company_id,id) ON DELETE ${onDelete}`);
  }
  return { relations: CONSTRAINTS.length };
}

module.exports = { PARENTS, CONSTRAINTS, migrateTenantIntegrity };
