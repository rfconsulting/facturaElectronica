const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createIssueInvoice}=require('../src/modules/invoicing/application/issue-invoice');
const {createRefreshInvoiceStatus,classify}=require('../src/modules/invoicing/application/refresh-invoice-status');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

const target={id:9,status:'uncertain',created_by:2,customer_id:3,source_quote_id:4,opportunity_id:5,total:10,branch_code:'0001',billing_point:'001',document_type:'01',fiscal_number:'0000000009'};
const repository=overrides=>({findStatusTarget:async()=>target,beginReconciliation:async()=>true,saveRefreshedStatus:async()=>{},markFailure:async()=>{},recordAuthorizedActivity:async()=>{},createReceivable:async()=>{},...overrides});

test('clasifica respuestas terminales y ambiguas',()=>{
  assert.equal(classify({estatusDocumento:'Autorizado'}),'authorized');
  assert.equal(classify({estatusDocumento:'Rechazado'}),'rejected');
  assert.equal(classify({estatusDocumento:'En proceso'}),'uncertain');
  assert.equal(classify({}),'uncertain');
});

test('un estado desconocido persiste uncertain y fuerza reintento',async()=>{
  let saved;
  const useCase=createRefreshInvoiceStatus({repository:repository({saveRefreshedStatus:async(...args)=>{saved=args;}}),hka:{status:async()=>({estatusDocumento:'En proceso'})}});
  await assert.rejects(()=>useCase.execute({companyId:1,invoiceId:9}),error=>error.code==='INVOICE_STILL_UNCERTAIN'&&error.status===502);
  assert.equal(saved[2],'uncertain');
});

test('un fallo de consulta conserva uncertain y no llama Enviar',async()=>{
  let failure;
  const hka={status:async()=>{throw new Error('timeout');},send:async()=>{throw new Error('no debe llamarse');}};
  const useCase=createRefreshInvoiceStatus({repository:repository({markFailure:async(...args)=>{failure=args;}}),hka});
  await assert.rejects(()=>useCase.execute({companyId:1,invoiceId:9}),error=>error.code==='INVOICE_STILL_UNCERTAIN');
  assert.equal(failure[2],'uncertain');
});

test('una factura terminal se devuelve sin consultar HKA',async()=>{
  let calls=0;
  const useCase=createRefreshInvoiceStatus({repository:repository({findStatusTarget:async()=>({...target,status:'authorized'})}),hka:{status:async()=>{calls+=1;}}});
  const result=await useCase.execute({companyId:1,invoiceId:9});
  assert.equal(result.body.replayed,true);
  assert.equal(calls,0);
});

test('una emisión nueva se bloquea si el origen tiene factura sin resolver',async()=>{
  const input={customerType:'02',sourceQuoteId:4,items:[{description:'Servicio',quantity:1,unitPrice:10,taxCode:'00'}]};
  const repo={findByIdempotencyKey:async()=>null,clientExists:async()=>true,acceptedQuoteExists:async()=>true,findUnresolvedByOrigin:async()=>({id:9,fiscalNumber:'0000000009',status:'uncertain'})};
  const useCase=createIssueInvoice({repository:repo,hka:{send:async()=>{throw new Error('no debe llamarse');}},getConfiguration:async()=>({configured:true})});
  await assert.rejects(()=>useCase.execute({companyId:1,userId:2,idempotencyKey:'invoice-retry-block-0001',input}),error=>error.code==='INVOICE_RECONCILIATION_REQUIRED'&&error.status===409);
});

test('schema y repositorio conservan evidencia mínima de reconciliación',()=>{
  const schema=read('database/schema.sql'),repo=read('src/modules/invoicing/infrastructure/invoice.repository.js'),integration=read('src/modules/integration/integration.composition.js');
  for(const field of ['attempt_count','last_attempt_at','external_identifier','authorized_at','normalized_response','reconciliation_locked_at','reconciliation_locked_by'])assert.match(schema,new RegExp(field));
  assert.match(repo,/InvoiceReconciliationRequested/);
  assert.match(repo,/status IN \('reserved','uncertain'\)/);
  assert.match(repo,/reconciliation_locked_at<DATE_SUB/);
  assert.match(integration,/invoice-reconciliation/);
  assert.doesNotMatch(integration,/\.send\(/);
});
