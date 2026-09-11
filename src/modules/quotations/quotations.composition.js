const repository=require('./infrastructure/legacy-crm-quotes.repository');
const {createQuoteUseCases}=require('./application/quotations');
const {createQuotesController}=require('./quotations.controller');
const audit=require('../clients/infrastructure/client-audit');
module.exports=createQuotesController({quotes:createQuoteUseCases({repository}),audit:audit.write});
