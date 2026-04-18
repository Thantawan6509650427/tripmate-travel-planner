import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err)

  const status  = err.status  || 500
  const message = err.message || 'Internal server error'
  const code    = err.code    || 'SERVER_ERROR'

  res.status(status).json({
    success: false,
    code,
    message
  })
}