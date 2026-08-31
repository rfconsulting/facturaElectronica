function createListInvoices({repository}){return{async execute({companyId}){return{invoices:await repository.list(companyId)};}};}
module.exports={createListInvoices};
