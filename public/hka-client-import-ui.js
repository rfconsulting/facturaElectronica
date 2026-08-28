document.addEventListener('DOMContentLoaded',()=>{
  const dialog=document.querySelector('#zoho-import-dialog'),title=dialog.querySelector('h2'),description=dialog.querySelector('.import-heading + p'),label=dialog.querySelector('label[for="zoho-file"]'),file=dialog.querySelector('#zoho-file');
  const setMode=mode=>{const hka=mode==='hka';title.textContent=hka?'Importar clientes de The Factory HKA':'Importar clientes de Zoho Invoice';description.innerHTML=hka?'Selecciona el <strong>CSV sin encabezados separado por punto y coma</strong> exportado desde The Factory HKA. Se comparará el RUC normalizado y los duplicados no se cargarán.':'Selecciona el archivo <strong>.xlsx o .csv</strong> exportado desde Zoho Invoice. Primero se mostrará una vista previa; duplicados y filas inválidas no se importan.';label.textContent=hka?'Archivo CSV de The Factory HKA':'Archivo de clientes';file.accept=hka?'.csv':'.xlsx,.csv';};
  document.querySelector('#import-hka-clients').addEventListener('click',()=>{setMode('hka');dialog.showModal();});
  document.querySelector('#import-clients').addEventListener('click',()=>setMode('zoho'));
});
