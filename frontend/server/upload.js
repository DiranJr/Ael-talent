/**
 * A&L Talent — Upload Handler (Multer Seguro)
 * Salva currículos na pasta de upload compartilhada com o OpenCATS
 */

import multer, { diskStorage } from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Diretório de Upload: volume compartilhado com o OpenCATS
const UPLOAD_DIR = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.resolve(__dirname, '..', '..', 'opencats', 'upload')

if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  } catch (err) {
    console.warn(`[UPLOAD] Diretório ${UPLOAD_DIR} não pôde ser criado automaticamente:`, err.message)
  }
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // Sanitiza extensão e gera identificador único imprevisível
    const rawExt = path.extname(file.originalname).toLowerCase()
    const ext = ALLOWED_EXT.has(rawExt) ? rawExt : '.pdf'
    const randomHash = crypto.randomBytes(8).toString('hex')
    cb(null, `resume_${Date.now()}_${randomHash}${ext}`)
  },
})

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()

  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Formato de arquivo não suportado. Envie currículos em PDF, DOC ou DOCX.'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
})

export { UPLOAD_DIR }
