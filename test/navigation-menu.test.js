const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('la navegación lateral agrupa ERP, CRM y Administración en desplegables accesibles',()=>{const html=read('public/dashboard.html');for(const group of ['erp','crm','administration']){assert.match(html,new RegExp(`data-nav-group="${group}"`));assert.match(html,new RegExp(`data-module-toggle="${group}"[^>]+aria-expanded=`));assert.match(html,new RegExp(`aria-controls="${group}-navigation"`));assert.match(html,new RegExp(`id="${group}-navigation"`));}});

test('el menú mantiene un solo grupo abierto y respeta movimiento reducido',()=>{const js=read('public/js/core/navigation-bridge.js'),css=read('public/nav-modules.css');assert.match(js,/function setOpenNavGroup/);assert.match(js,/querySelectorAll\('\[data-nav-group\]'\)/);assert.match(css,/\.nav-group\.open>\.nav-submenu/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);});

test('el menú lateral se contrae en escritorio y conserva sólo iconos',()=>{const html=read('public/dashboard.html'),js=read('public/js/core/navigation-bridge.js'),css=read('public/sidebar-compact.css');assert.match(html,/id="sidebar-collapse"/);assert.match(html,/sidebar-compact\.css/);assert.match(js,/function setSidebarCompact/);assert.match(js,/localStorage\.setItem\('sidebarCompact'/);assert.match(css,/\.app-shell\.sidebar-compact/);assert.match(css,/\.sidebar-compact \.nav-link span/);assert.match(css,/@media \(min-width: 901px\)/);});

test('la interfaz usa los tokens visuales de RF Consulting',()=>{const html=read('public/dashboard.html'),css=read('public/rf-brand-theme.css');assert.match(html,/rf-brand-theme\.css/);for(const color of ['#071b33','#0b2748','#0868ac','#087f78','#f4b942'])assert.match(css,new RegExp(color));assert.match(css,/--font-sans:Inter/);assert.match(css,/html\[data-theme="dark"\]/);});

test('la marca usa el logotipo oficial sin fabricar un isotipo',()=>{const html=read('public/dashboard.html'),css=read('public/rf-brand-theme.css');assert.match(html,/aria-label="RF Consulting/);assert.match(css,/logo-rf-consulting-white\.png/);assert.match(css,/\.sidebar-compact \.app-brand:before\{display:none\}/);});

test('la interfaz aplica una progresión responsive mobile-first',()=>{const html=read('public/dashboard.html'),css=read('public/responsive-system.css');assert.match(html,/responsive-system\.css/);for(const width of [480,768,1024,1280,1440])assert.match(css,new RegExp(`@media\\(min-width:${width}px\\)`));assert.match(css,/--viewport-gutter:20px/);assert.match(css,/--viewport-gutter:32px/);assert.match(css,/min-height:44px/);assert.match(css,/width:min\(100%,var\(--content-wide\)\)/);});

test('pipeline y carrito POS no desbordan en móvil',()=>{const css=read('public/responsive-system.css');assert.match(css,/\.crm-pipeline-row\{grid-template-columns:minmax\(0,1fr\) auto/);assert.match(css,/\.crm-pipeline-row>strong\{grid-column:1\/-1/);assert.match(css,/\.pos-cart-row\{grid-template-columns:minmax\(0,1fr\)/);assert.match(css,/\.pos-quantity\{grid-column:1;display:grid/);assert.match(css,/\.pos-line-total\{grid-column:1/);});

test('el tema se inicializa explícitamente y protege el contraste del POS',()=>{const init=read('public/theme-init.js'),css=read('public/responsive-system.css');assert.match(init,/dataset\.theme=localStorage\.getItem\('fe-theme'\)==='dark'\?'dark':'light'/);assert.match(init,/catch\{document\.documentElement\.dataset\.theme='light'/);for(const selector of ['pos-quantity span','pos-line-total','pos-cart-heading>button','pos-toolbar>input::placeholder'])assert.match(css,new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));});

test('los accesos del CRM seleccionan su vista interna',()=>{const html=read('public/dashboard.html'),js=read('public/js/core/navigation-bridge.js');for(const tab of ['summary','leads','contacts','opportunities','pipeline','activities','receivables'])assert.match(html,new RegExp(`data-crm-tab="${tab}"`));assert.match(js,/button\.dataset\.crmTab/);});

test('bootstrap importa navegación y selector de empresa desde el núcleo ES',()=>{const html=read('public/dashboard.html'),bootstrap=read('public/js/bootstrap.js'),navigation=read('public/js/core/navigation-bridge.js');assert.match(html,/type="module" src="js\/bootstrap\.js"/);assert.match(bootstrap,/from '\.\/core\/navigation-bridge\.js'/);for(const name of ['navigate','setupNavigation','setupSidebarCollapse','setupCompanySwitcher']){assert.match(navigation,new RegExp(`function ${name}`));assert.doesNotMatch(bootstrap,new RegExp(`function ${name}`));}});

test('el directorio de artículos conserva contraste completo en modo claro',()=>{const css=read('public/responsive-system.css');for(const selector of ['client-list-item strong','client-list-item span','client-list-item .article-kind','client-list-item:hover strong'])assert.ok(css.includes(`html[data-theme="light"] .${selector}`));assert.match(css,/\.article-kind\{color:#27535d!important;background:#e8f4f4!important/);});
