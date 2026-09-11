require('dotenv').config();
const mysql=require('mysql2/promise');
const env=require('../src/config/env');

async function constraintExists(connection,name){const [rows]=await connection.execute('SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? AND CONSTRAINT_NAME=?',[env.db.database,name]);return Boolean(rows[0]);}
async function columnExists(connection,table,column){const [rows]=await connection.execute('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',[env.db.database,table,column]);return Boolean(rows[0]);}
async function indexExists(connection,table,index){const [rows]=await connection.execute('SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?',[env.db.database,table,index]);return Boolean(rows[0]);}

(async()=>{const connection=await mysql.createConnection(env.db);try{
  await connection.query(`CREATE TABLE IF NOT EXISTS payment_receipt_sequences (company_id BIGINT UNSIGNED NOT NULL,next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,PRIMARY KEY (company_id),CONSTRAINT fk_payment_receipt_sequence_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,CONSTRAINT chk_payment_receipt_next_number CHECK (next_number BETWEEN 1 AND 10000000000)) ENGINE=InnoDB`);
  for(const [table,constraint] of [['crm_quote_sequences','chk_crm_quote_next_number'],['sales_order_sequences','chk_sales_order_next_number']])if(!await constraintExists(connection,constraint))await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraint} CHECK (next_number BETWEEN 1 AND 10000000000)`);
  if(!await columnExists(connection,'receivable_payments','receipt_number'))await connection.query('ALTER TABLE receivable_payments ADD COLUMN receipt_number VARCHAR(30) NULL AFTER receivable_id');
  const [payments]=await connection.query('SELECT id,company_id FROM receivable_payments WHERE receipt_number IS NULL ORDER BY company_id,paid_at,id');
  const counters=new Map();for(const payment of payments){const next=(counters.get(payment.company_id)||0)+1;counters.set(payment.company_id,next);await connection.execute('UPDATE receivable_payments SET receipt_number=? WHERE id=? AND company_id=?',[`REC-${String(next).padStart(10,'0')}`,payment.id,payment.company_id]);}
  await connection.query(`INSERT INTO payment_receipt_sequences (company_id,next_number) SELECT company_id,COALESCE(MAX(CAST(SUBSTRING_INDEX(receipt_number,'-',-1) AS UNSIGNED)),0)+1 FROM receivable_payments GROUP BY company_id ON DUPLICATE KEY UPDATE next_number=GREATEST(next_number,VALUES(next_number))`);
  await connection.query('ALTER TABLE receivable_payments MODIFY receipt_number VARCHAR(30) NOT NULL');
  if(!await indexExists(connection,'receivable_payments','uq_payment_receipt_number'))await connection.query('ALTER TABLE receivable_payments ADD UNIQUE KEY uq_payment_receipt_number (company_id,receipt_number)');
  console.log(`Correlativos migrados; ${payments.length} pagos históricos numerados.`);
}finally{await connection.end();}})().catch(error=>{console.error(error.message);process.exitCode=1;});
