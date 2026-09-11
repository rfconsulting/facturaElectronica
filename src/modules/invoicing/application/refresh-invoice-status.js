const ApplicationError=require('../../../shared/errors/application-error');
const crypto=require('node:crypto');

const classify=response=>{const value=String(response?.estatusDocumento??response?.estado??response?.mensajeDocumento??'').toLowerCase();if(value.includes('autoriz'))return'authorized';if(value.includes('rechaz')||value.includes('anulad'))return'rejected';return'uncertain';};
const publicProvider=response=>({code:String(response?.codigo??response?.Codigo??'').slice(0,30)||null,message:String(response?.mensajeDocumento??response?.mensaje??response?.Mensaje??'').slice(0,1000)||null});

function createRefreshInvoiceStatus({repository,hka}){return{
  async execute({companyId,invoiceId}){
    const invoice=await repository.findStatusTarget(companyId,invoiceId);
    if(!invoice)throw new ApplicationError('Factura no encontrada.',{status:404,code:'INVOICE_NOT_FOUND'});
    if(['authorized','rejected'].includes(invoice.status))return{status:200,audit:'invoice.reconciliation_replayed',invoiceId:invoice.id,body:{message:'La factura ya tiene un estado terminal.',status:invoice.status,replayed:true}};
    if(!['reserved','uncertain'].includes(invoice.status))throw new ApplicationError('La factura no admite reconciliación en su estado actual.',{status:409,code:'INVOICE_NOT_RECONCILABLE'});
    const reconciliationId=crypto.randomUUID();
    if(!await repository.beginReconciliation(companyId,invoice.id,reconciliationId))throw new ApplicationError('La factura cambió de estado o ya está siendo reconciliada.',{status:409,code:'INVOICE_RECONCILIATION_CONFLICT'});
    let response;
    try{response=await hka.status(companyId,{codigoSucursalEmisor:invoice.branch_code,numeroDocumentoFiscal:invoice.fiscal_number,puntoFacturacionFiscal:invoice.billing_point,tipoDocumento:invoice.document_type,tipoEmision:'01'});}
    catch(error){await repository.markFailure(companyId,invoice.id,'uncertain',error,reconciliationId);throw new ApplicationError('HKA no permitió confirmar el resultado; la factura continúa incierta.',{status:502,code:'INVOICE_STILL_UNCERTAIN'});}
    const status=classify(response);
    await repository.saveRefreshedStatus(companyId,invoice.id,status,response,reconciliationId);
    if(status==='authorized'){
      await repository.recordAuthorizedActivity({companyId,clientId:invoice.customer_id,invoiceId:invoice.id,fiscalNumber:invoice.fiscal_number,total:Number(invoice.total),userId:invoice.created_by});
      if(invoice.source_quote_id||invoice.opportunity_id)await repository.createReceivable({companyId,clientId:invoice.customer_id,invoiceId:invoice.id,quoteId:invoice.source_quote_id,opportunityId:invoice.opportunity_id,total:Number(invoice.total)});
    }
    if(status==='uncertain')throw new ApplicationError('HKA aún no reporta un resultado terminal; la factura continúa incierta.',{status:502,code:'INVOICE_STILL_UNCERTAIN'});
    return{status:200,audit:'invoice.status_reconciled',invoiceId:invoice.id,body:{message:'Estado reconciliado.',status,provider:publicProvider(response)}};
  }
};}

module.exports={createRefreshInvoiceStatus,classify};
