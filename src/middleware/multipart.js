const Busboy = require('busboy');

function multipartError(message, status = 422) {
  return Object.assign(new Error(message), { status, expose: true });
}

function singleMemoryFile(fieldName, options = {}) {
  const fileSize = options.fileSize || 5 * 1024 * 1024;
  const maxFields = options.fields || 20;

  return (req, _res, next) => {
    if (!req.is('multipart/form-data')) return next(multipartError('Se esperaba un formulario multipart.'));

    let parser;
    try {
      parser = Busboy({
        headers: req.headers,
        limits: { fileSize, files: 1, fields: maxFields, parts: maxFields + 1 }
      });
    } catch {
      return next(multipartError('El formulario multipart no es válido.'));
    }

    const body = Object.create(null);
    let file = null;
    let failure = null;
    let finished = false;
    const fail = (error) => { if (!failure) failure = error; };

    parser.on('field', (name, value) => { body[name] = value; });
    parser.on('file', (name, stream, info) => {
      if (name !== fieldName || file) {
        fail(multipartError(`Solo se admite el archivo del campo ${fieldName}.`));
        stream.resume();
        return;
      }

      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => fail(multipartError(`El archivo supera el límite de ${Math.floor(fileSize / 1024 / 1024)} MB.`, 413)));
      stream.on('end', () => {
        if (!failure) file = {
          fieldname: name,
          originalname: info.filename,
          encoding: info.encoding,
          mimetype: info.mimeType,
          buffer: Buffer.concat(chunks)
        };
      });
    });
    parser.on('filesLimit', () => fail(multipartError('Solo se admite un archivo.')));
    parser.on('fieldsLimit', () => fail(multipartError('El formulario contiene demasiados campos.')));
    parser.on('partsLimit', () => fail(multipartError('El formulario contiene demasiadas partes.')));
    parser.on('error', () => fail(multipartError('No se pudo procesar el formulario multipart.')));
    parser.on('close', () => {
      if (finished) return;
      finished = true;
      if (failure) return next(failure);
      req.body = body;
      req.file = file;
      return next();
    });
    req.on('aborted', () => {
      if (!finished) {
        finished = true;
        parser.destroy(multipartError('La carga fue interrumpida.', 400));
      }
    });
    req.pipe(parser);
  };
}

module.exports = { singleMemoryFile };
