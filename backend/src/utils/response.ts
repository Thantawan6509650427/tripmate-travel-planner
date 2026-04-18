import { Response } from 'express'

export const sendSuccess = (
  res: Response,
  data: any,
  message = 'Success',
  code = 'SUCCESS',
  status = 200
) => {
  return res.status(status).json({
    success: true,
    code,
    message,
    data
  })
}

export const sendError = (
  res: Response,
  message = 'Error',
  code = 'ERROR',
  status = 400
) => {
  return res.status(status).json({
    success: false,
    code,
    message
  })
}