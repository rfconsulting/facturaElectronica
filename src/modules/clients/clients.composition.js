const repository=require('./infrastructure/client.repository');
const fileParser=require('./infrastructure/zoho-client-file-parser');
const audit=require('./infrastructure/client-audit').write;
const {createClientUseCases}=require('./application/clients');
const {createManageCustomFields}=require('./application/manage-custom-fields');
const {createClientImport}=require('./application/client-import');
const {createClientsController}=require('./clients.controller');
module.exports=createClientsController({clients:createClientUseCases({repository,audit}),customFields:createManageCustomFields({repository,audit}),clientImport:createClientImport({repository,fileParser,audit})});
