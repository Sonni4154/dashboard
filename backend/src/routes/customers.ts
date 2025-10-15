import { Router, Request, Response } from 'express';
import { db, customers } from '../db/index.js';
import { desc, eq, count } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/customers
 * Get all customers with optional pagination and filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(customers);
    const total = totalResult?.count || 0;

    // Get paginated results
    const allCustomers = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.last_updated))
      .limit(limitNum)
      .offset(offset);

        res.successResponse(
          allCustomers,
          'Customers retrieved successfully',
          {
            page: pageNum,
            limit: limitNum,
            total: total,
            pages: Math.ceil(total / limitNum),
          }
        );
      } catch (error: any) {
        logger.error('Error fetching customers:', error);
        res.errorResponse('Failed to fetch customers', error.message, 500);
      }
});

/**
 * GET /api/customers/stats
 * Get customer statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalCustomers] = await db.select({ count: count() }).from(customers);
    const [activeCustomers] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.active, true));

    res.successResponse({
      total: totalCustomers?.count || 0,
      active: activeCustomers?.count || 0,
      inactive: (totalCustomers?.count || 0) - (activeCustomers?.count || 0),
    }, 'Customer statistics retrieved successfully');
  } catch (error: any) {
    logger.error('Error fetching customer stats:', error);
    res.errorResponse('Failed to fetch customer statistics', error.message, 500);
  }
});

/**
 * GET /api/customers/:id
 * Get a specific customer by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const customerId = id; // ID is now text, not number
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        message: `Customer with ID ${id} does not exist`,
      });
    }

        res.successResponse(customer, 'Customer retrieved successfully');
  } catch (error: any) {
    logger.error('Error fetching customer:', error);
    res.errorResponse('Failed to fetch customer', error.message, 500);
  }
});

export default router;