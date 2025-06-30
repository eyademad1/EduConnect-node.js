const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server running');
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  console.error('Error code:', err.code);
  console.error('Error stack:', err.stack);
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
  console.log('Server URL: http://localhost:3000');
  console.log('Server is listening on:', server.address());
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});