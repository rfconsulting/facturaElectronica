const repository=require('./infrastructure/quote.repository');
const {createQuoteUseCases}=require('./application/quotes');
const {createQuotesController}=require('./quotes.controller');
const audit=require('../clients/infrastructure/client-audit');
module.exports=createQuotesController({quotes:createQuoteUseCases({repository}),audit:audit.write});
