import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../types/auth.types.js';
import prisma from '../config/db.js';
import { ReportAnalyzerService } from '../services/ai/reportAnalyzer.service.js';

// Setup uploads storage
const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents and image files (PNG, JPG, WebP) are allowed.'));
    }
  },
});

/**
 * Controller: Upload report and run BloodCare AI analysis
 * Route: POST /api/user/reports/upload
 */
export const uploadAndAnalyzeReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const file = req.file;
    const { customText, reportName } = req.body;

    const originalFileName = reportName || file?.originalname || 'Clinical_Pathology_Report.pdf';
    let extractedText = customText || '';

    // If text file or readable ascii, extract preview
    if (file && fs.existsSync(file.path)) {
      try {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.txt') {
          extractedText = fs.readFileSync(file.path, 'utf8');
        }
      } catch (readErr) {
        console.warn('Could not read raw text from file:', readErr);
      }
    }

    // Run BloodCare AI Analysis
    const analysis = await ReportAnalyzerService.analyzeReport({
      text: extractedText,
      fileName: originalFileName,
      fileType: file?.mimetype || 'application/pdf',
      patientBloodGroup: req.user.blood_group,
    });

    // Save report in database
    const savedReport = await prisma.report.create({
      data: {
        user_id: req.user.id,
        file_name: originalFileName,
        file_url: file ? `/uploads/reports/${file.filename}` : null,
        file_type: file?.mimetype || 'application/pdf',
        file_size: file?.size || 0,
        extracted_text: extractedText || null,
        summary: analysis.summary,
        abnormal_values: JSON.stringify(analysis.abnormalValues),
        risk_flags: JSON.stringify(analysis.riskFlags),
        suggested_step: analysis.suggestedStep,
        is_flagged: analysis.isFlagged,
      },
    });

    // If report was flagged with risk indicators, trigger an automatic follow-up notification (Phase 9 integration)
    if (analysis.isFlagged) {
      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          type: 'followup',
          title: `Report Alert: ${originalFileName}`,
          message: `BloodCare AI detected physiological markers requiring review in your uploaded report. ${analysis.suggestedStep}`,
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          type: 'test_due',
          title: `Report Analyzed: ${originalFileName}`,
          message: `BloodCare AI completed analysis. All parameters within normal ranges.`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report uploaded and analyzed successfully by BloodCare AI.',
      report: {
        ...savedReport,
        abnormalValues: analysis.abnormalValues,
        riskFlags: analysis.riskFlags,
      },
    });
  } catch (error) {
    console.error('Error in uploadAndAnalyzeReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and analyze report.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Get logged-in user's report history
 * Route: GET /api/user/reports
 */
export const getUserReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const reports = await prisma.report.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });

    const parsedReports = reports.map((r) => {
      let abnormalValues = [];
      let riskFlags = [];
      try {
        if (r.abnormal_values) abnormalValues = JSON.parse(r.abnormal_values);
      } catch {}
      try {
        if (r.risk_flags) riskFlags = JSON.parse(r.risk_flags);
      } catch {}
      return {
        ...r,
        abnormalValues,
        riskFlags,
      };
    });

    res.status(200).json({
      success: true,
      count: parsedReports.length,
      reports: parsedReports,
    });
  } catch (error) {
    console.error('Error in getUserReports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Controller: Delete report
 * Route: DELETE /api/user/reports/:id
 */
export const deleteReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id, user_id: req.user.id },
    });

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found.' });
      return;
    }

    await prisma.report.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleteReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
