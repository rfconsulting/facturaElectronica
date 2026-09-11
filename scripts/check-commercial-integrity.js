const pool=require('../src/config/database');
const CHECKS=[
 ['negative_or_excess_receivable',"SELECT COUNT(*) total FROM accounts_receivable WHERE balance<0 OR paid_amount<0 OR paid_amount>original_amount OR ABS(balance-(original_amount-paid_amount))>0.009"],
 ['receivable_without_authorized_invoice',"SELECT COUNT(*) total FROM accounts_receivable ar JOIN electronic_invoices i ON i.id=ar.invoice_id AND i.company_id=ar.company_id WHERE i.status<>'authorized'"],
 ['cross_company_payment',"SELECT COUNT(*) total FROM receivable_payments p JOIN accounts_receivable ar ON ar.id=p.receivable_id WHERE p.company_id<>ar.company_id"],
 ['open_invoice_duplicate_origin',"SELECT COUNT(*) total FROM (SELECT company_id,COALESCE(source_quote_id,0) quote_id,COALESCE(opportunity_id,0) opportunity_id,COUNT(*) amount FROM electronic_invoices WHERE status IN ('reserved','uncertain') AND (source_quote_id IS NOT NULL OR opportunity_id IS NOT NULL) GROUP BY company_id,quote_id,opportunity_id HAVING COUNT(*)>1) duplicates"],
 ['outbox_dead_or_stale',"SELECT COUNT(*) total FROM integration_outbox WHERE status='dead_letter' OR (status IN ('pending','processing') AND created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE))"]
];
async function checkCommercialIntegrity(connection=pool){const results=[];for(const [name,sql] of CHECKS){const [[row]]=await connection.query(sql);results.push({name,ok:Number(row.total)===0,total:Number(row.total)});}return{ok:results.every(x=>x.ok),results};}
if(require.main===module)checkCommercialIntegrity().then(result=>{console.log(JSON.stringify({event:'commercial_integrity_check',...result},null,2));if(!result.ok)process.exitCode=1;}).catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>pool.end());
module.exports={CHECKS,checkCommercialIntegrity};
