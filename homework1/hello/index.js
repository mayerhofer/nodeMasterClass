const http = require('http');
const url = require('url');

const usePort = process.env.PORT || 4444;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  if (trimmedPath === 'hello') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({message: 'Hello World'}));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({message: 'Not Found'}));
  }
});

// Start the server, and have it listen on port 3000
server.listen(usePort, () => {
  console.log(`The hello server is listening on port ${usePort} now.`);
});
