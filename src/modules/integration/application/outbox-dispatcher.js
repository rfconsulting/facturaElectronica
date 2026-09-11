function createOutboxDispatcher({repository,consumers={},workerId=`outbox-${process.pid}`,maxAttempts=8}){
  const backoff=attempt=>Math.min(3600,Math.max(5,5*(2**Math.max(0,attempt-1))));

  return{
    async runOnce({batchSize=25}={}){
      const events=await repository.claim({workerId,batchSize});
      const summary={claimed:events.length,delivered:0,retried:0,deadLettered:0};
      for(const event of events){
        try{
          const handlers=[...(consumers['*']||[]),...(consumers[event.eventType]||[])];
          for(const consumer of handlers)await repository.consumeOnce({consumerName:consumer.name,event,handler:consumer.handle});
          await repository.markDelivered(event.id,workerId);
          summary.delivered+=1;
        }catch(error){
          if(event.attempts>=maxAttempts){
            await repository.markDeadLetter({id:event.id,workerId,error});
            summary.deadLettered+=1;
          }else{
            await repository.markRetry({id:event.id,workerId,error,delaySeconds:backoff(event.attempts)});
            summary.retried+=1;
          }
        }
      }
      return summary;
    }
  };
}

module.exports={createOutboxDispatcher};
