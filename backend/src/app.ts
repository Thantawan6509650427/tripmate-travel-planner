import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import tripRoutes from './routes/trips'
import voteRoutes from './routes/votes'
import notiRoutes from './routes/noti'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())

// ============================================================================
// ROUTES
// ============================================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth',  authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/votes', voteRoutes)
app.use('/api/noti',  notiRoutes)

// ============================================================================
// ERROR HANDLER (ต้องอยู่ล่างสุดเสมอ)
// ============================================================================
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app