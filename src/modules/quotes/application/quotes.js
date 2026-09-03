const {validateQuote}=require('./quote-validation');
const ApplicationError=require('../../../shared/errors/application-error');
const statuses=['draft','pending_approval','approved','sent','viewed','accepted','converted','rejected','expired','cancelled'];
function createQuoteUseCases({repository}){const validate=input=>{const result=validateQuote(input);if(result.errors)throw new ApplicationError('Revisa la cotización.',{status:422,code:'INVALID_QUOTE',details:result.errors});return result.value;};return{
  list:({companyId,query={}})=>repository.list(companyId,{status:statuses.includes(query.status)?query.status:'',search:String(query.search||'').trim().slice(0,100)}),
  async get({companyId,quoteId}){const quote=await repository.get(companyId,quoteId);if(!quote)throw new ApplicationError('Cotización no encontrada.',{status:404,code:'QUOTE_NOT_FOUND'});return quote;},
  create:args=>repository.create({...args,quote:validate(args.input)}),update:args=>repository.update({...args,quote:validate(args.input)}),
  transition(args){const status=String(args.input.status||'');if(!statuses.includes(status)||status==='converted')throw new ApplicationError('Estado de cotización inválido.',{status:422,code:'INVALID_QUOTE_STATUS'});return repository.transition({...args,toStatus:status,reason:String(args.input.reason||'').trim().slice(0,500)});},
  duplicate:args=>repository.duplicate(args),revise:args=>repository.revise(args),convert:args=>repository.convert(args),invoiceDraft:({companyId,quoteId})=>repository.getInvoiceDraft(companyId,quoteId)
};}
module.exports={createQuoteUseCases};
