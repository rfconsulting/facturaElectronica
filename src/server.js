const env=require('./config/env');
const pool=require('./config/database');
const {createApp}=require('./app');

const app=createApp();
const server=app.listen(env.port,()=>console.log(`Factura Electrónica disponible en ${env.appPublicUrl}`));
async function shutdown(){server.close(async()=>{await pool.end();process.exit(0);});}
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
