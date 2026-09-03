const {validateInvoice}=require('../../../validation/invoice');
const {validateIdempotencyKey,fingerprintInvoice}=require('../../../services/invoice-idempotency');
const ApplicationError=require('../../../shared/errors/application-error');

function createIssueInvoice({repository,hka,getConfiguration}){
  return{async execute({companyId,userId,idempotencyKey:rawKey,input}){
    const idempotencyKey=validateIdempotencyKey(rawKey);
    if(!idempotencyKey)throw new ApplicationError('Envía una cabecera Idempotency-Key válida de 16 a 128 caracteres.',{status:400,code:'INVALID_IDEMPOTENCY_KEY'});
    const requestHash=fingerprintInvoice(input),previous=await repository.findByIdempotencyKey(companyId,idempotencyKey);
    if(previous){if(previous.request_hash!==requestHash)throw new ApplicationError('La clave de idempotencia ya fue utilizada con una factura diferente.',{status:409,code:'IDEMPOTENCY_CONFLICT'});return{kind:'replay',invoice:previous};}
    const ids=[...new Set((Array.isArray(input.items)?input.items:[]).map(item=>Number(item.articleId)).filter(id=>Number.isSafeInteger(id)&&id>0))];
    if(ids.length){const articles=await repository.findPosArticles(companyId,ids),byId=new Map(articles.map(article=>[Number(article.id),article]));if(byId.size!==ids.length)throw new ApplicationError('Uno o más artículos ya no están disponibles en POS.',{status:422,code:'POS_ARTICLE_UNAVAILABLE'});input={...input,items:input.items.map(item=>{const article=byId.get(Number(item.articleId));return article?{description:article.description||article.name,code:article.sku||'',quantity:item.quantity,unitPrice:article.salePrice,taxCode:article.taxCode}:item;})};}
    const validation=validateInvoice(input);
    if(validation.errors)throw new ApplicationError('Revisa los datos de la factura.',{status:422,code:'INVALID_INVOICE',details:validation.errors});
    if(!await repository.clientExists(companyId,validation.value.customer.id))throw new ApplicationError('El cliente no pertenece a la empresa activa.',{status:422,code:'INVALID_CUSTOMER'});
    if(validation.value.sourceQuoteId&&!await repository.acceptedQuoteExists(companyId,validation.value.sourceQuoteId,validation.value.customer.id))throw new ApplicationError('La cotización de origen no está aceptada o no pertenece al cliente.',{status:422,code:'INVALID_SOURCE_QUOTE'});
    const provider=await getConfiguration(companyId);
    if(!provider.configured)throw new ApplicationError('Configura las credenciales de The Factory HKA antes de emitir.',{status:503,code:'HKA_NOT_CONFIGURED'});
    let reserved;
    try{
      reserved=await repository.reserve({companyId,userId,invoice:validation.value,provider,idempotencyKey,requestHash});
      if(reserved.replayed){if(reserved.invoice.request_hash!==requestHash)throw new ApplicationError('La clave de idempotencia ya fue utilizada con una factura diferente.',{status:409,code:'IDEMPOTENCY_CONFLICT'});return{kind:'replay',invoice:reserved.invoice};}
      const response=await hka.send(companyId,reserved.document),code=String(response.codigo??response.Codigo??''),authorized=code==='200'||code==='0';
      await repository.saveProviderResult(companyId,reserved.id,response,authorized);
      if(authorized){await repository.recordAuthorizedActivity({companyId,clientId:validation.value.customer.id,invoiceId:reserved.id,fiscalNumber:reserved.fiscalNumber,total:validation.value.total,userId}).catch(()=>{});if(repository.createReceivable&&(validation.value.sourceQuoteId||validation.value.opportunityId||validation.value.paymentMethod==='01'))await repository.createReceivable({companyId,clientId:validation.value.customer.id,invoiceId:reserved.id,quoteId:validation.value.sourceQuoteId,opportunityId:validation.value.opportunityId,total:validation.value.total}).catch(()=>{});}
      if(!authorized)return{status:422,audit:'invoice.rejected',invoiceId:reserved.id,body:{error:response.mensaje||response.Mensaje||'The Factory HKA rechazó el documento.',invoiceId:reserved.id,fiscalNumber:reserved.fiscalNumber,providerCode:code}};
      return{status:201,audit:'invoice.authorized',invoiceId:reserved.id,body:{message:'Factura electrónica autorizada.',invoice:{id:reserved.id,fiscalNumber:reserved.fiscalNumber,cufe:response.cufe||response.Cufe,qr:response.qr||response.Qr,protocol:response.numeroProtocoloAutorizacion||null}}};
    }catch(error){if(!reserved||error instanceof ApplicationError)throw error;const status=error.uncertain||!error.providerResponse?'uncertain':'rejected';await repository.markFailure(companyId,reserved.id,status,error);return{status:status==='uncertain'?502:422,audit:status==='uncertain'?'invoice.uncertain':'invoice.rejected',invoiceId:reserved.id,body:{error:status==='uncertain'?'No se pudo confirmar el resultado con HKA. Consulta el estado antes de reintentar.':error.message,invoiceId:reserved.id,fiscalNumber:reserved.fiscalNumber,status}};}
  }};
}
module.exports={createIssueInvoice};
