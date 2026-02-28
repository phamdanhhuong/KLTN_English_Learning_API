export interface StandardApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
  path?: string;
  error?: {
    code: string;
    details?: any;
    stack?: string;
  };
  meta?: {
    processingTime?: number;
    version?: string;
    [key: string]: any;
  };
}

export class ResponseBuilder {
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    path?: string,
    meta?: Record<string, any>,
  ): StandardApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      meta: {
        version: '1.0.0',
        ...meta,
      },
    };
  }

  static error(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any,
    path?: string,
  ): StandardApiResponse<null> {
    return {
      success: false,
      statusCode,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      error: {
        code: errorCode || 'UNKNOWN_ERROR',
        ...(details && { details }),
      },
      meta: {
        version: '1.0.0',
      },
    };
  }
}
