/**
 * A&L Talent — Upload Handler (Multer Seguro)
 * Salva currículos na pasta de upload compartilhada com o OpenCATS
 */

import crypto from 'crypto'
import fs from 'fs'
import multer, { diskStorage } from 'multer'
import path from 'path'
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
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // Sanitiza nome original contra path traversal e extensão
    const sanitizedOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')
    const rawExt = path.extname(sanitizedOriginal).toLowerCase()
    const isImage =
      file.fieldname === 'photo' ||
      file.mimetype?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt)
    const ext = ALLOWED_EXT.has(rawExt) ? rawExt : isImage ? '.jpg' : '.pdf'
    const randomHash = crypto.randomBytes(8).toString('hex')
    const prefix = isImage ? 'photo' : 'resume'
    cb(null, `${prefix}_${Date.now()}_${randomHash}${ext}`)
  },
})

function fileFilter(req, file, cb) {
  const originalName = file.originalname || ''
  const ext = path.extname(originalName).toLowerCase()

  // Bloqueia tentativas de path traversal no nome
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    const cleanBase = path.basename(originalName)
    if (!cleanBase || cleanBase.includes('..')) {
      return cb(new Error('Nome de arquivo inválido ou tentativa de path traversal detectada.'))
    }
  }

  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Formato não suportado. Envie currículos em PDF/DOCX ou fotos em JPG/PNG/WEBP.'))
  }
}

/**
 * Validação rigorosa por Magic Bytes (assinatura real do arquivo)
 * @param {string} filePath
 * @param {string} originalName
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export async function validateUploadedFile(filePath, originalName = '') {
  if (!filePath || !fs.existsSync(filePath)) {
    return { valid: false, error: 'Arquivo de upload não encontrado.' }
  }

  let fd = null
  try {
    const stats = await fs.promises.stat(filePath)
    if (stats.size === 0) {
      await fs.promises.unlink(filePath).catch(() => {})
      return { valid: false, error: 'O arquivo enviado está vazio.' }
    }

    if (stats.size > MAX_FILE_SIZE) {
      await fs.promises.unlink(filePath).catch(() => {})
      return { valid: false, error: 'O arquivo excede o limite máximo permitido de 5MB.' }
    }

    const buffer = Buffer.alloc(Math.min(stats.size, 8192))
    fd = await fs.promises.open(filePath, 'r')
    await fd.read(buffer, 0, buffer.length, 0)
    await fd.close()
    fd = null

    const ext = path.extname(originalName || filePath).toLowerCase()

    // 1. Imagens JPEG (.jpg, .jpeg)
    if (ext === '.jpg' || ext === '.jpeg') {
      const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      if (!isJpeg) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura binária de imagem JPEG inválida.' }
      }
      return { valid: true }
    }

    // 2. Imagens PNG (.png)
    if (ext === '.png') {
      const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      if (!isPng) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura binária de imagem PNG inválida.' }
      }
      return { valid: true }
    }

    // 3. Imagens WEBP (.webp)
    if (ext === '.webp') {
      const isWebp =
        buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
      if (!isWebp) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura binária de imagem WEBP inválida.' }
      }
      return { valid: true }
    }

    // 4. PDF: Deve começar com %PDF- (0x25 0x50 0x44 0x46)
    if (ext === '.pdf') {
      const isPdf =
        buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
      if (!isPdf) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura binária de PDF inválida ou arquivo corrompido.' }
      }
      return { valid: true }
    }

    // 5. DOCX: Assinatura ZIP PK (0x50 0x4B 0x03 0x04) + estrutura OpenXML
    if (ext === '.docx') {
      const isZip =
        buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
      if (!isZip) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura de arquivo DOCX inválida (não é um pacote ZIP/OpenXML válido).' }
      }

      // Validação de estrutura Office: busca por [Content_Types].xml ou word/ nos primeiros bytes
      const fileString = buffer.toString('binary')
      const hasOfficeStructure = fileString.includes('[Content_Types].xml') || fileString.includes('word/')
      if (!hasOfficeStructure) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Pacote DOCX corrompido ou sem estrutura Office válida.' }
      }

      return { valid: true }
    }

    // 6. DOC Legado (Word 97-2003): Assinatura OLE Compound Document (0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1)
    if (ext === '.doc') {
      const isOleDoc =
        buffer.length >= 8 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
      if (!isOleDoc) {
        await fs.promises.unlink(filePath).catch(() => {})
        return { valid: false, error: 'Assinatura de documento DOC legado inválida.' }
      }
      return { valid: true }
    }

    await fs.promises.unlink(filePath).catch(() => {})
    return { valid: false, error: 'Extensão de arquivo não permitida.' }
  } catch (err) {
    if (fd) {
      try {
        await fd.close()
      } catch (_) {}
    }
    await fs.promises.unlink(filePath).catch(() => {})
    return { valid: false, error: `Erro na validação do arquivo: ${err.message}` }
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
