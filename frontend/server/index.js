/**
 * A&L Talent — Servidor Node.js / Express
 * API proxy entre o Vite SPA e o banco OpenCATS (MariaDB)
 */

import cors from 'cors'
import crypto from 'crypto'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { adminAuthLimiter } from './auth/rateLimit.js'
import { getDb } from './db.js'
import { sendError } from './helpers.js'
import { logger } from './logger.js'
// Rotas administrativas (RH) e middleware de autenticação
import {
  adminAuth,
  adminCreateDepartmentHandler,
  adminDeleteDepartmentHandler,
  adminGetDepartmentsHandler,
  adminLoginHandler,
  adminStatsHandler,
} from './routes/admin.js'

import {
  adminDownloadAttachmentHandler,
  adminGetCandidateDetailHandler,
  adminGetCandidatesHandler,
  adminUpdateCandidateStatusHandler,
} from './routes/adminCandidates.js'
import {
  adminCreateJobHandler,
  adminDeleteJobHandler,
  adminGetJobsHandler,
  adminToggleJobStatusHandler,
  adminUpdateJobHandler,
} from './routes/adminJobs.js'
import adminUsersRouter from './routes/adminUsers.js'
// Rotas públicas
import { applyHandler } from './routes/apply.js'
import { filtersHandler, jobDetailHandler, jobsHandler } from './routes/jobs.js'
import talentPoolRouter from './routes/talentPool.js'
import { upload } from './upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware de Request ID & Observabilidade ────────────────
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID()
  req.id = reqId
  res.setHeader('x-request-id', reqId)

  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (req.path !== '/api/health') {
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
        requestId: req.id,
        method: req.method,
        route: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
      })
    }
  })
  next()
})

// ─── Middlewares de Segurança e Headers HTTP ────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3001,http://localhost:8000')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Origem não permitida pela política de CORS.'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders:
      process.env.NODE_ENV === 'test'
        ? ['Content-Type', 'Authorization', 'x-test-bypass', 'x-request-id']
        : ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  })
)

app.use(express.json({ limit: '2mb' }))

// ─── Rotas Públicas ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const db = await getDb()
    await db.execute('SELECT 1')
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      db: 'connected',
      timestamp: new Date().toISOString(),
      request_id: req.id,
    })
  } catch (err) {
    logger.error('Falha no healthcheck de banco de dados', { requestId: req.id, error: err })
    return sendError(res, 'Serviço de banco de dados indisponível.', 503)
  }
})

app.get('/api/jobs', jobsHandler)
app.get('/api/jobs/:id', jobDetailHandler)
app.get('/api/filters', filtersHandler)
app.post('/api/apply', upload.single('resume'), applyHandler)

// ─── Rotas Administrativas (RH) — Protegidas ────────────────────
// Login Administrativo com Rate Limiting
app.post('/api/admin/login', adminAuthLimiter, adminLoginHandler)

// Dashboard Stats (Protegido)
app.get('/api/admin/stats', adminAuth, adminStatsHandler)

// Gestão de Vagas (Protegido)
app.get('/api/admin/jobs', adminAuth, adminGetJobsHandler)
app.post('/api/admin/jobs', adminAuth, adminCreateJobHandler)
app.put('/api/admin/jobs/:id', adminAuth, adminUpdateJobHandler)
app.patch('/api/admin/jobs/:id/status', adminAuth, adminToggleJobStatusHandler)
app.delete('/api/admin/jobs/:id', adminAuth, adminDeleteJobHandler)

// Gestão de Candidatos & Currículos (Protegido)
app.get('/api/admin/candidates', adminAuth, adminGetCandidatesHandler)
app.get('/api/admin/candidates/:id', adminAuth, adminGetCandidateDetailHandler)
app.patch('/api/admin/candidates/:candidateId/jobs/:jobId/status', adminAuth, adminUpdateCandidateStatusHandler)
app.get('/api/admin/attachments/:id/download', adminAuth, adminDownloadAttachmentHandler)

// Departamentos (Protegido)
app.get('/api/admin/departments', adminAuth, adminGetDepartmentsHandler)
app.post('/api/admin/departments', adminAuth, adminCreateDepartmentHandler)
app.delete('/api/admin/departments/:id', adminAuth, adminDeleteDepartmentHandler)

// Gestão de Usuários & Recrutadores (Protegido)
app.use('/api/admin/users', adminAuth, adminUsersRouter)

// Banco de Talentos & Portal do Candidato
app.use('/api/talent-pool', talentPoolRouter)

// ─── Serve o build Vite em produção ─────────────────────────────
const distDir = path.join(__dirname, '..', 'dist')
app.use(express.static(distDir))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return sendError(res, 'Recurso não encontrado.', 404)
  }
  res.sendFile(path.join(distDir, 'index.html'))
})

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢 A&L Talent API rodando em http://localhost:${PORT}`)
  console.log(`   /api/health            — status do servidor`)
  console.log(`   /api/jobs              — portal público de vagas`)
  console.log(`   /api/admin/*           — painel administrativo do RH (Autenticado)\n`)
})
