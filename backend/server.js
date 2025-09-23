// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fetch = global.fetch || require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = (process.env.AZURE_REGION || 'eastus').toLowerCase();
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY;
const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT;
const VOICE_NAME = process.env.AZURE_SPEECH_VOICE || 'en-US-JennyNeural';

if (!AZURE_SPEECH_KEY || !AZURE_REGION) {
  console.error('Missing AZURE_SPEECH_KEY or AZURE_REGION in .env');
  process.exit(1);
}
if (!AZURE_VISION_KEY || !AZURE_VISION_ENDPOINT) {
  console.error('Missing AZURE_VISION_KEY or AZURE_VISION_ENDPOINT in .env');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const UPLOADS = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOADS);

const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS: allow frontend origin (configure FRONTEND_ORIGIN in Azure), or allow all by default
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors(FRONTEND_ORIGIN ? { origin: FRONTEND_ORIGIN } : undefined));

// Serve job outputs from /jobs/<jobId>/out.wav
app.use('/jobs', express.static(UPLOADS));

// Optional: if you built frontend, the server can serve it automatically
const tryServeFrontend = () => {
  const candidates = [
    path.join(__dirname, '..', 'frontend', 'dist'), // Vite
    path.join(__dirname, '..', 'frontend', 'build'), // CRA
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      app.use(express.static(c));
      app.get('*', (req, res) => res.sendFile(path.join(c, 'index.html')));
      console.log('Serving frontend from', c);
      return;
    }
  }
  console.log('Frontend build not found — run frontend dev server separately in development.');
};
tryServeFrontend();

const upload = multer({ dest: UPLOADS, limits: { fileSize: 300 * 1024 * 1024 } }); // 300MB

// ----------------- Helpers -----------------

async function extractTextIfDigital(filePath, originalName) {
  const ext = (path.extname(originalName) || '').toLowerCase();
  try {
    if (ext === '.txt' || ext === '.text') {
      return await fs.readFile(filePath, 'utf8');
    } else if (ext === '.docx') {
      const r = await mammoth.extractRawText({ path: filePath });
      return r && r.value ? r.value : '';
    } else if (ext === '.pdf') {
      const data = await fs.readFile(filePath);
      const parsed = await pdfParse(data);
      return parsed && parsed.text ? parsed.text : '';
    }
  } catch (err) {
    console.warn('extractTextIfDigital error:', err.message);
    return '';
  }
  return '';
}

async function runAzureRead(filePath, timeoutMs = 180000) {
  const url = new URL('/vision/v3.2/read/analyze', AZURE_VISION_ENDPOINT).toString();
  const data = await fs.readFile(filePath);
  const submitResp = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
      'Content-Type': 'application/octet-stream'
    },
    body: data
  });
  if (!submitResp.ok) {
    const t = await submitResp.text();
    throw new Error(`Read submit failed: ${submitResp.status} ${t}`);
  }
  const opLocation = submitResp.headers.get('operation-location');
  if (!opLocation) throw new Error('Missing operation-location header');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const poll = await fetch(opLocation, {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY }
    });
    if (!poll.ok) throw new Error(`Read poll failed: ${poll.status}`);
    const json = await poll.json();
    const status = (json.status || '').toLowerCase();
    if (status === 'succeeded') {
      const pages = (json.analyzeResult && json.analyzeResult.readResults) || [];
      const lines = [];
      for (const p of pages) for (const line of p.lines || []) lines.push(line.text);
      return lines.join('\n');
    }
    if (status === 'failed') throw new Error('Read operation failed: ' + JSON.stringify(json));
    await new Promise(r => setTimeout(r, 1200));
  }
  throw new Error('Timeout waiting for Read operation to complete');
}

function chunkText(text, maxChars = 1500) {
  const chunks = [];
  let i = 0;
  if (!text) return chunks;
  while (i < text.length) {
    let end = Math.min(i + maxChars, text.length);
    if (end < text.length) {
      const sub = text.slice(i, end);
      const lastSpace = sub.lastIndexOf(' ');
      if (lastSpace > Math.floor(maxChars * 0.6)) end = i + lastSpace;
    }
    const piece = text.slice(i, end).trim();
    if (piece) chunks.push(piece);
    i = end;
  }
  return chunks;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function synthesizeChunkToFile(chunkTextVal, outFile, opts = {}) {
  const { maxRetries = 3, chunkIndex = -1, voiceName = VOICE_NAME } = opts;
  if (!chunkTextVal || !chunkTextVal.trim()) throw new Error(`Empty chunk ${chunkIndex}`);
  await fs.ensureDir(path.dirname(outFile));
  try { const fd = fs.openSync(outFile, 'w'); fs.closeSync(fd); } catch (_) {}

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_REGION);
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
      speechConfig.speechSynthesisVoiceName = voiceName;

      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outFile);
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      await new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          chunkTextVal,
          result => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) return resolve();
            const cancel = sdk.SpeechSynthesisCancellationDetails.fromResult(result);
            const msg = cancel && cancel.errorDetails ? cancel.errorDetails : `Synthesis failed: ${result.reason}`;
            return reject(new Error(msg));
          },
          err => {
            synthesizer.close();
            return reject(err);
          }
        );
      });

      const stats = await fs.stat(outFile);
      if (stats.size <= 44) throw new Error(`Output file too small (${stats.size})`);
      return outFile;
    } catch (err) {
      console.warn(`synthesizeChunkToFile attempt ${attempt} failed (chunk ${chunkIndex}):`, err.message);
      try { await fs.remove(outFile); } catch (_) {}
      if (attempt >= maxRetries) throw new Error(`Chunk ${chunkIndex} failed after ${maxRetries} attempts: ${err.message}`);
      await sleep(300 * attempt);
    }
  }
}

async function mergeWavs(pathsList, outPath) {
  if (!pathsList || pathsList.length === 0) throw new Error('No wavs to merge');
  if (pathsList.length === 1) { await fs.copy(pathsList[0], outPath); return; }

  const first = await fs.readFile(pathsList[0]);
  const header = first.slice(0, 44);
  const bodies = [first.slice(44)];
  for (let i = 1; i < pathsList.length; i++) {
    const b = await fs.readFile(pathsList[i]);
    bodies.push(b.slice(44));
  }
  const totalBody = Buffer.concat(bodies);
  const dataSize = totalBody.length;
  const newHeader = Buffer.from(header);
  newHeader.writeUInt32LE(36 + dataSize, 4);
  newHeader.writeUInt32LE(dataSize, 40);
  const outBuf = Buffer.concat([newHeader, totalBody]);
  await fs.writeFile(outPath, outBuf);
}

async function synthesizeTextToWav(text, outPath, opts = {}) {
  const chunkSize = opts.chunkSize || 1500;
  const voiceName = opts.voiceName || VOICE_NAME;
  const maxRetries = opts.maxRetries || 3;
  if (!text || !text.trim()) throw new Error('No text to synthesize');

  const tmpDir = path.join(path.dirname(outPath), `tmp_${uuidv4()}`);
  await fs.ensureDir(tmpDir);
  try {
    const chunks = chunkText(text, chunkSize);
    if (!chunks.length) throw new Error('No chunks created');
    const files = [];
    for (let i = 0; i < chunks.length; i++) {
      const cf = path.join(tmpDir, `chunk_${i}.wav`);
      await synthesizeChunkToFile(chunks[i], cf, { maxRetries, chunkIndex: i, voiceName });
      files.push(cf);
    }
    await mergeWavs(files, outPath);
    for (const f of files) try { await fs.remove(f); } catch (_) {}
    try { await fs.remove(tmpDir); } catch (_) {}
    return outPath;
  } catch (err) {
    try { await fs.remove(tmpDir); } catch (_) {}
    throw err;
  }
}

// ----------------- Upload route -----------------

app.post('/upload', upload.single('doc'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  // temporary working dir
  const jobId = uuidv4();
  const jobDir = path.join(UPLOADS, jobId);
  await fs.ensureDir(jobDir);
  const savedPath = path.join(jobDir, req.file.originalname || req.file.filename);
  await fs.move(req.file.path, savedPath);

  try {
    // 1) try digital extract
    const ext = (path.extname(savedPath) || '').toLowerCase();
    let text = '';
    if (ext === '.txt' || ext === '.docx' || ext === '.pdf') {
      text = await extractTextIfDigital(savedPath, req.file.originalname || '');
    }

    // 2) if empty -> OCR
    if (!text || !text.trim()) {
      text = await runAzureRead(savedPath);
    }

    if (!text || !text.trim()) throw new Error('No text extracted from document.');

    const cleaned = text.replace(/\r/g, '').replace(/\s+\n/g, '\n').trim();

    // 3) Synthesize to WAV (create outWav in jobDir)
    const outWav = path.join(jobDir, 'out.wav');
    await synthesizeTextToWav(cleaned, outWav, { chunkSize: 1500, voiceName: VOICE_NAME });

    // 4) Stream WAV back to client
    res.setHeader('Content-Type', 'audio/wav');
    // include the transcript in a header (URI-encoded). WARNING: headers may be limited in size.
    try {
      const safeHeader = encodeURIComponent(cleaned.slice(0, 16000)); // cut to 16KB to be safe
      res.setHeader('X-Transcript-URI', safeHeader);
    } catch (_) { /* ignore header set failure */ }

    const stream = fs.createReadStream(outWav);
    stream.pipe(res);

    // cleanup when stream finishes or errors
    stream.on('close', async () => {
      try { await fs.remove(jobDir); } catch (_) {}
    });
    stream.on('error', async (err) => {
      console.error('Stream error', err);
      try { await fs.remove(jobDir); } catch (_) {}
    });

  } catch (err) {
    console.error('Processing failed:', err);
    try { await fs.remove(jobDir); } catch (_) {}
    res.status(500).send('Error: ' + err.message);
  }
});

// Health endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log('POST /upload  (form field "doc")');
});

// remove uploads older than `maxAgeMs`
const MAX_AGE = 1000 * 60 * 60 * 6; // 6 hours
setInterval(async () => {
  try {
    const names = await fs.readdir(UPLOADS);
    for (const name of names) {
      const p = path.join(UPLOADS, name);
      const st = await fs.stat(p);
      if (Date.now() - st.mtimeMs > MAX_AGE) {
        await fs.remove(p);
        console.log('Deleted old job:', p);
      }
    }
  } catch (err) { /* ignore */ }
}, 1000 * 60 * 30); // run every 30 minutes
