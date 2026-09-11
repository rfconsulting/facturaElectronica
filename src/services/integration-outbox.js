const crypto=require('node:crypto');

const clean=(value,max)=>String(value??'').trim().slice(0,max);

function eventEnvelope({eventId=crypto.randomUUID(),eventType,eventVersion=1,companyId,aggregateType,aggregateId,correlationId=null,causationId=null,payload={},occurredAt=new Date()}){
  const envelope={eventId:clean(eventId,36),eventType:clean(eventType,100),eventVersion:Number(eventVersion),companyId:Number(companyId),aggregateType:clean(aggregateType,50),aggregateId:Number(aggregateId),correlationId:clean(correlationId,100)||null,causationId:clean(causationId,36)||null,payload,occurredAt};
  if(!/^[0-9a-f-]{36}$/i.test(envelope.eventId)||!envelope.eventType||!Number.isSafeInteger(envelope.eventVersion)||envelope.eventVersion<1||!Number.isSafeInteger(envelope.companyId)||envelope.companyId<1||!envelope.aggregateType||!Number.isSafeInteger(envelope.aggregateId)||envelope.aggregateId<1)throw new TypeError('El evento de integración no cumple el contrato requerido.');
  return envelope;
}

async function enqueueEvent(connection,input){
  const event=eventEnvelope(input);
  await connection.execute(`INSERT INTO integration_outbox (event_id,company_id,event_type,event_version,aggregate_type,aggregate_id,correlation_id,causation_id,payload,occurred_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,[event.eventId,event.companyId,event.eventType,event.eventVersion,event.aggregateType,event.aggregateId,event.correlationId,event.causationId,JSON.stringify(event.payload),event.occurredAt]);
  return event;
}

// Compatibilidad para productores existentes mientras adoptan nombres de dominio.
function enqueue(connection,companyId,eventType,aggregateType,aggregateId,payload={},metadata={}){
  return enqueueEvent(connection,{companyId,eventType,aggregateType,aggregateId,payload,...metadata});
}

module.exports={eventEnvelope,enqueueEvent,enqueue};
