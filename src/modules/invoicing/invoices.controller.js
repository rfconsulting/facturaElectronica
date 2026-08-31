const issueInvoice=require('./application/issue-invoice');
const refreshInvoiceStatus=require('./application/refresh-invoice-status');
const listInvoices=require('./application/list-invoices');
const safeAudit=require('../../services/safe-audit');
const {idempotentResponse}=require('../../services/invoice-idempotency');
async function create(req,res,next){try{const result=await issueInvoice.execute({companyId:req.company.id,userId:req.authUser.id,idempotencyKey:req.get('idempotency-key'),input:req.body});if(result.kind==='replay')return idempotentResponse(res,result.invoice);if(result.audit)await safeAudit(req,result.audit,'invoice',result.invoiceId);return res.status(result.status).json(result.body);}catch(error){if(error.expose)return res.status(error.status).json({error:error.message,code:error.code,details:error.details});return next(error);}}
async function list(req,res,next){try{return res.json(await listInvoices.execute({companyId:req.company.id}));}catch(error){return next(error);}}
async function refresh(req,res,next){try{const result=await refreshInvoiceStatus.execute({companyId:req.company.id,invoiceId:req.params.id});if(result.audit)await safeAudit(req,result.audit,'invoice',result.invoiceId);return res.status(result.status).json(result.body);}catch(error){if(error.expose)return res.status(error.status).json({error:error.message,code:error.code});return next(error);}}
module.exports={create,list,refresh};
