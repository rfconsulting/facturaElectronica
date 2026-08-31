const test=require('node:test');
const assert=require('node:assert/strict');
const {createIssueInvoice}=require('../src/modules/invoicing/application/issue-invoice');
const {createListInvoices}=require('../src/modules/invoicing/application/list-invoices');
const {createRefreshInvoiceStatus}=require('../src/modules/invoicing/application/refresh-invoice-status');

const input={customerType:'02',paymentMethod:'02',items:[{description:'Servicio',quantity:1,unitPrice:100,taxCode:'01'}]};
test('emite mediante dependencias simuladas sin Express ni MySQL',async()=>{const calls=[];const repository={findByIdempotencyKey:async()=>null,clientExists:async()=>true,reserve:async()=>({id:9,fiscalNumber:'0000000009',document:{documento:'fiscal'}}),saveProviderResult:async(...args)=>calls.push(['result',...args]),recordAuthorizedActivity:async()=>calls.push(['activity'])},hka={send:async()=>({codigo:'200',cufe:'CUFE-9',qr:'QR-9'})},useCase=createIssueInvoice({repository,hka,getConfiguration:async()=>({configured:true})}),result=await useCase.execute({companyId:2,userId:3,idempotencyKey:'invoice-test-key-0001',input});assert.equal(result.status,201);assert.equal(result.body.invoice.cufe,'CUFE-9');assert.equal(calls[0][0],'result');});

test('rechaza una clave idempotente inválida con ApplicationError',async()=>{const useCase=createIssueInvoice({repository:{},hka:{},getConfiguration:async()=>({})});await assert.rejects(()=>useCase.execute({companyId:1,userId:1,idempotencyKey:'corta',input}),error=>error.code==='INVALID_IDEMPOTENCY_KEY'&&error.status===400);});

test('lista facturas mediante un repositorio inyectado',async()=>{const useCase=createListInvoices({repository:{list:async companyId=>[{id:companyId}]}});assert.deepEqual(await useCase.execute({companyId:7}),{invoices:[{id:7}]});});

test('actualiza estado mediante HKA y repositorio simulados',async()=>{let saved;const repository={findStatusTarget:async()=>({id:4,branch_code:'0001',billing_point:'001',document_type:'01',fiscal_number:'0000000004'}),saveRefreshedStatus:async(...args)=>{saved=args;}},useCase=createRefreshInvoiceStatus({repository,hka:{status:async()=>({estatusDocumento:'Autorizado',codigo:'200'})}}),result=await useCase.execute({companyId:2,invoiceId:4});assert.equal(result.body.status,'authorized');assert.deepEqual(saved.slice(0,3),[2,4,'authorized']);});
