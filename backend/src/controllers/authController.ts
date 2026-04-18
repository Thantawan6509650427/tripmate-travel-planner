import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'
import { sendSuccess, sendError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

// ============================================================================
// POST /api/auth/register
// ============================================================================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return sendError(res, 'กรุณากรอกข้อมูลให้ครบ', 'MISSING_FIELDS', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return sendError(res, 'อีเมลนี้ถูกใช้แล้ว', 'EMAIL_EXISTS', 409)
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true, createdAt: true }
    })

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    )

    return sendSuccess(res, { user, token }, 'สมัครสมาชิกสำเร็จ', 'REGISTER_SUCCESS', 201)

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// ============================================================================
// POST /api/auth/login
// ============================================================================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return sendError(res, 'กรุณากรอกอีเมลและรหัสผ่าน', 'MISSING_FIELDS', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'INVALID_CREDENTIALS', 401)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return sendError(res, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'INVALID_CREDENTIALS', 401)
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user

    return sendSuccess(res, { user: userWithoutPassword, token }, 'เข้าสู่ระบบสำเร็จ', 'LOGIN_SUCCESS')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// ============================================================================
// GET /api/auth/me
// ============================================================================
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true }
    })

    if (!user) {
      return sendError(res, 'ไม่พบผู้ใช้', 'USER_NOT_FOUND', 404)
    }

    return sendSuccess(res, user, 'ดึงข้อมูลสำเร็จ', 'USER_FETCHED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}