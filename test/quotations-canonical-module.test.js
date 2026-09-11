const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('quotations contiene la implementación y no depende del módulo quotes',()=>{
  const files=['application/quotations.js','application/quotation-validation.js','infrastructure/legacy-crm-quotes.repository.js','quotations.controller.js','quotations.composition.js','quotations.routes.js'];
  for(const file of files){
    const source=read(`src/modules/quotations/${file}`);
    assert.doesNotMatch(source,/modules\/quotes|\.\.\/quotes|\.\.\/\.\.\/quotes/);
  }
});

test('quotes solo contiene adaptadores hacia quotations',()=>{
  const adapters=['application/quotes.js','application/quote-validation.js','infrastructure/quote.repository.js','quotes.controller.js','quotes.composition.js','quotes.routes.js'];
  for(const file of adapters)assert.match(read(`src/modules/quotes/${file}`),/quotations/);
});
