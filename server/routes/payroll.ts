import express from 'express';
import multer from 'multer';
import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('PDFファイルのみ受け付けます'));
  },
});

/**
 * POST /api/payroll/parse
 * PDFをpdfplumberで解析し、テーブルデータ（JSON）を返す
 */
router.post('/parse', upload.single('file'), async (req, res): Promise<void> => {
  let tmpPath = '';

  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDFファイルを送信してください' });
      return;
    }

    // 一時ファイルに保存（pdfplumberはファイルパスが必要）
    tmpPath = path.join(os.tmpdir(), `payroll_${Date.now()}.pdf`);
    await writeFile(tmpPath, req.file.buffer);

    // Pythonスクリプトを呼び出し
    const scriptPath = path.join(__dirname, '..', 'parse_payroll.py');
    const result = await new Promise<string>((resolve, reject) => {
      execFile('python', [scriptPath, tmpPath], {
        maxBuffer: 50 * 1024 * 1024, // 50MB
        timeout: 60000, // 60秒
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('[payroll/parse] Python error:', stderr);
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    const parsed = JSON.parse(result);
    res.json(parsed);

  } catch (err: any) {
    console.error('[payroll/parse]', err);
    res.status(500).json({ error: err.message });
  } finally {
    // 一時ファイルを削除
    if (tmpPath) {
      try { await unlink(tmpPath); } catch {}
    }
  }
});

export default router;
