import { Request, Response, NextFunction } from 'express';

/**
 * Response Envelope Middleware
 * 
 * Standardizes all API responses to follow a consistent format:
 * - Success responses: { success: true, data: any, message?: string, pagination?: object }
 * - Error responses: { success: false, error: string, message: string }
 */

// Extend Response interface to add custom methods
declare global {
  namespace Express {
    interface Response {
      successResponse: (data: any, message?: string, pagination?: any) => void;
      errorResponse: (error: string, message: string, statusCode?: number) => void;
    }
  }
}

export function responseEnvelope(req: Request, res: Response, next: NextFunction) {
  // Add custom response methods
  res.successResponse = (data: any, message?: string, pagination?: any) => {
    const response: any = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    if (pagination) {
      response.pagination = pagination;
    }

    res.json(response);
  };

  res.errorResponse = (error: string, message: string, statusCode: number = 500) => {
    res.status(statusCode).json({
      success: false,
      error,
      message,
    });
  };

  next();
}

/**
 * Standard error handler that uses the response envelope
 */
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  // Log the error
  console.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine error type and status code
  let statusCode = 500;
  let errorType = 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'Validation error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorType = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorType = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorType = 'Not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorType = 'Conflict';
  }

  // Use the custom error response method
  res.errorResponse(
    errorType,
    process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    statusCode
  );
}

export default responseEnvelope;
