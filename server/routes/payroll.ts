import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { processPayroll } from '../services/payrollService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('PDFファイルのみ受け付けます'));
  },
});

router.post('/process', authMiddleware, upload.single('file'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDFファイルを送信してください' });
      return;
    }
    const yearMonth = req.body.year_month || new Date().toISOString().slice(0, 7);

    const { excelBuffer, savedCount, mappedCount } = await processPayroll(
      req.file.buffer,
      yearMonth
    );

    res
      .set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="payroll_${yearMonth}_tokenized.xlsx"`,
        'X-Saved-Count': savedCount.toString(),
        'X-Mapped-Count': mappedCount.toString(),
      })
      .send(excelBuffer);
  } catch (err: any) {
    console.error('[payroll]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
