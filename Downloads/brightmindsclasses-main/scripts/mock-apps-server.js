const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/collect', (req, res) => {
  const body = req.body || req.fields || req;
  const log = { time: new Date().toISOString(), body };
  console.log('[MOCK] Received POST:', JSON.stringify(log));
  fs.appendFileSync('mock_server_log.json', JSON.stringify(log) + '\n');
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Mock Apps server listening on http://localhost:${port}`));
