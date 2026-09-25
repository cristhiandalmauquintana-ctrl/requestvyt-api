const http = require('http');

const INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
  'https://invidious.jing.rocks',
  'https://iv.melmac.space'
];

async function tryInstances(path) {
  const attempts = INSTANCES.map(base =>
    fetch(base + path, { signal: AbortSignal.timeout(8000) }).then(async res => {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    })
  );
  return Promise.any(attempts);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, 'http://x');

  try {
    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const data = await tryInstances('/api/v1/search?q=' + encodeURIComponent(q) + '&type=video');
      res.end(JSON.stringify(data));
    } else if (url.pathname.startsWith('/api/video/')) {
      const id = url.pathname.split('/').pop();
      const data = await tryInstances('/api/v1/videos/' + encodeURIComponent(id));
      res.end(JSON.stringify(data));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not found' }));
    }
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'todas las instancias fallaron' }));
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('listening on ' + port));
