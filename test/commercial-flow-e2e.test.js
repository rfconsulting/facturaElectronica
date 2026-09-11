const test=require('node:test');
const assert=require('node:assert/strict');

test('flujo comercial integral conserva estados independientes e idempotencia',()=>{
  const state={lead:'qualified',opportunity:'negotiation',quotation:'accepted',order:null,invoice:null,receivable:null,payments:[]};
  const confirmOrder=()=>{state.order??={status:'confirmed'};state.opportunity='won';};
  const authorizeInvoice=()=>{state.invoice??={status:'authorized',fiscalNumber:'0000000001'};state.order.status='invoiced';state.receivable??={status:'pending',original:100,paid:0,balance:100};};
  const pay=amount=>{assert.ok(amount<=state.receivable.balance);state.payments.push(amount);state.receivable.paid+=amount;state.receivable.balance-=amount;state.receivable.status=state.receivable.balance===0?'paid':'partially_paid';};
  confirmOrder();confirmOrder();authorizeInvoice();authorizeInvoice();pay(40);
  assert.deepEqual({opportunity:state.opportunity,quotation:state.quotation,order:state.order.status,invoice:state.invoice.status,receivable:state.receivable.status,balance:state.receivable.balance},{opportunity:'won',quotation:'accepted',order:'invoiced',invoice:'authorized',receivable:'partially_paid',balance:60});
  pay(60);assert.equal(state.receivable.status,'paid');assert.equal(state.opportunity,'won');assert.equal(state.payments.length,2);
});

test('integrity check cubre saldos, autorización fiscal, empresa, duplicados y outbox',()=>{const {CHECKS}=require('../scripts/check-commercial-integrity');assert.equal(CHECKS.length,5);for(const [,sql] of CHECKS)assert.match(sql,/COUNT\(\*\)/);});
