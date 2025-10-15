import { Router, Request, Response } from 'express';
import { db, estimates, estimateLineItems, customers } from '../db/index.js';
import { eq, desc, count } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/estimates
 * Get all estimates with line items
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const allEstimates = await db.query.estimates.findMany({
      with: {
        customer: true,
        lineItems: true,
      },
      orderBy: desc(estimates.last_updated),
      limit: limitNum,
      offset: offset,
    });

    const [totalResult] = await db.select({ count: count() }).from(estimates);
    const total = totalResult?.count || 0;

    res.json({
      success: true,
      data: allEstimates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching estimates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estimates',
      error: error.message,
    });
  }
});

/**
 * GET /api/estimates/:id
 * Get a specific estimate by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Estimate ID is required',
      });
    }

    const estimateId = id; // ID is now text, not number
    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, estimateId),
      with: {
        customer: true,
        lineItems: true,
      },
    });

    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
      });
    }

    res.json({
      success: true,
      data: estimate,
    });
  } catch (error: any) {
    logger.error(`Error fetching estimate with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estimate',
      error: error.message,
    });
  }
});

/**
 * GET /api/estimates/stats
 * Get estimate statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalEstimates] = await db.select({ count: count() }).from(estimates);
    
    // TODO: Add status column to estimates table
    const statusStats = [[{ count: 0 }], [{ count: 0 }], [{ count: 0 }], [{ count: 0 }]];

    res.json({
      success: true,
      data: {
        total: totalEstimates?.count || 0,
        byStatus: {
          draft: statusStats[0][0]?.count || 0,
          sent: statusStats[1][0]?.count || 0,
          accepted: statusStats[2][0]?.count || 0,
          declined: statusStats[3][0]?.count || 0,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching estimate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estimate stats',
      error: error.message,
    });
  }
});

export default router;