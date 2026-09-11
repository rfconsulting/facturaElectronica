const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('la navegación lateral agrupa ERP, CRM y Administración en desplegables accesibles',()=>{const html=read('public/dashboard.html');for(const group of ['erp','crm','administration']){assert.match(html,new RegExp(`data-nav-group="${group}"`));assert.match(html,new RegExp(`data-module-toggle="${group}"[^>]+aria-expanded=`));assert.match(html,new RegExp(`aria-controls="${group}-navigation"`));assert.match(html,new RegExp(`id="${group}-navigation"`));}});

test('el menú mantiene un solo grupo abierto y respeta movimiento reducido',()=>{const js=read('public/dashboard.js'),css=read('public/nav-modules.css');assert.match(js,/function setOpenNavGroup/);assert.match(js,/querySelectorAll\('\[data-nav-group\]'\)/);assert.match(css,/\.nav-group\.open>\.nav-submenu/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);});

test('los accesos del CRM seleccionan su vista interna',()=>{const html=read('public/dashboard.html'),js=read('public/dashboard.js');for(const tab of ['summary','leads','contacts','opportunities','pipeline','activities','receivables'])assert.match(html,new RegExp(`data-crm-tab="${tab}"`));assert.match(js,/button\.dataset\.crmTab/);});
