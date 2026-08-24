const test = require('node:test');
const assert = require('node:assert/strict');
const { mapArticleRows, money, taxCode } = require('../src/services/zoho-article-import');

test('conserva goods como producto y service como servicio', () => {
  const headers=['Item ID','Item Name','SKU','Description','Rate','Tax1 Name','Tax1 Percentage','Product Type','Status','Usage unit','CF.Profit','CF.CPBS'];
  const rows=mapArticleRows([headers,['1','Equipo','EQ-1','Equipo físico','USD 100.00','ITBMS','7','goods','Active','und','20','4321'],['2','Consultoría','CONS','Servicio','USD 50.00','Exento','0','service','Active','hora','','8111']]);
  assert.equal(rows[0].article.itemType,'product'); assert.equal(rows[1].article.itemType,'service');
  assert.equal(rows[0].article.taxCode,'01'); assert.equal(rows[1].article.taxCode,'00');
});

test('normaliza importes y tasas de Zoho',()=>{assert.equal(money('USD 1,250.75'),1250.75);assert.equal(taxCode('15.000000'),'03');});
