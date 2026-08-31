class ApplicationError extends Error{
  constructor(message,{status=400,code='APPLICATION_ERROR',details}={}){super(message);this.name='ApplicationError';this.status=status;this.code=code;this.details=details;this.expose=true;}
}
module.exports=ApplicationError;
