const startedAt = Date.now();
const requests = new Map();
let inFlight = 0;

function observeRequest(req, res, next) {
  const start = process.hrtime.bigint();
  inFlight += 1;
  res.once('finish', () => {
    inFlight -= 1;
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const key = `${req.method}|${res.statusCode}`;
    const current = requests.get(key) || { count: 0, durationSeconds: 0 };
    current.count += 1;
    current.durationSeconds += durationSeconds;
    requests.set(key, current);
    console.log(JSON.stringify({ event: 'request_completed', requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(durationSeconds * 1000) }));
  });
  next();
}

function renderMetrics() {
  const lines = [
    '# HELP factura_process_uptime_seconds Process uptime in seconds.',
    '# TYPE factura_process_uptime_seconds gauge',
    `factura_process_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
    '# HELP factura_http_requests_in_flight Current HTTP requests.',
    '# TYPE factura_http_requests_in_flight gauge',
    `factura_http_requests_in_flight ${inFlight}`,
    '# HELP factura_http_requests_total Completed HTTP requests.',
    '# TYPE factura_http_requests_total counter',
    '# HELP factura_http_request_duration_seconds_total Accumulated HTTP request duration.',
    '# TYPE factura_http_request_duration_seconds_total counter'
  ];
  for (const [key, value] of [...requests.entries()].sort()) {
    const [method, status] = key.split('|');
    const labels = `{method="${method}",status="${status}"}`;
    lines.push(`factura_http_requests_total${labels} ${value.count}`);
    lines.push(`factura_http_request_duration_seconds_total${labels} ${value.durationSeconds.toFixed(6)}`);
  }
  return `${lines.join('\n')}\n`;
}

function resetMetrics() { requests.clear(); inFlight = 0; }

module.exports = { observeRequest, renderMetrics, resetMetrics };
