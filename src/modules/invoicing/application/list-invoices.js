const defaultRepository=require('../infrastructure/invoice.repository');
function createListInvoices({repository=defaultRepository}={}){return{async execute({companyId}){return{invoices:await repository.list(companyId)};}};}
module.exports={createListInvoices,execute:(input)=>createListInvoices().execute(input)};
