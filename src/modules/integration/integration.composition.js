const {createOutboxRepository}=require('./infrastructure/outbox.repository');
const {createOutboxDispatcher}=require('./application/outbox-dispatcher');
const invoiceRepository=require('../invoicing/infrastructure/invoice.repository');
const hka=require('../../services/hka-client');
const {createRefreshInvoiceStatus}=require('../invoicing/application/refresh-invoice-status');

// Consumers are explicit and receive a transaction-scoped connection. New
// side effects must be registered here, never discovered dynamically.
const reconcileInvoice=createRefreshInvoiceStatus({repository:invoiceRepository,hka});
const consumers=Object.freeze({
  '*':[{name:'event-journal',handle:async()=>{}}],
  InvoiceReconciliationRequested:[{name:'invoice-reconciliation',handle:async(_connection,event)=>reconcileInvoice.execute({companyId:event.companyId,invoiceId:event.aggregateId})}]
});

module.exports=createOutboxDispatcher({repository:createOutboxRepository(),consumers});
