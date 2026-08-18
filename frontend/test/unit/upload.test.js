import { describe, it, expect, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { validateUploadedFile } from '../../server/upload.js'

describe('Upload Validation & Magic Bytes', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ael-upload-test-'))

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (_) {}
  })

  it('deve aceitar arquivo com cabeçalho mágico PDF válido (%PDF-)', async () => {
    const filePath = path.join(tempDir, 'valid.pdf')
    const pdfHeader = Buffer.from('%PDF-1.7\n%test data\n')
    fs.writeFileSync(filePath, pdfHeader)

    const result = await validateUploadedFile(filePath, 'valid.pdf')
    expect(result.valid).toBe(true)
  })

  it('deve rejeitar arquivo com extensão .pdf mas conteúdo falso/executável', async () => {
    const filePath = path.join(tempDir, 'fake.pdf')
    const fakeContent = Buffer.from('MZ\x90\x00\x03\x00\x00\x00') // Executável Windows PE
    fs.writeFileSync(filePath, fakeContent)

    const result = await validateUploadedFile(filePath, 'fake.pdf')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Assinatura binária de PDF inválida')
  })

  it('deve aceitar arquivo DOCX com assinatura ZIP PK e estrutura Office', async () => {
    const filePath = path.join(tempDir, 'valid.docx')
    const docxHeader = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      Buffer.from('sample content [Content_Types].xml word/document.xml')
    ])
    fs.writeFileSync(filePath, docxHeader)

    const result = await validateUploadedFile(filePath, 'valid.docx')
    expect(result.valid).toBe(true)
  })

  it('deve rejeitar arquivo vazio de 0 bytes', async () => {
    const filePath = path.join(tempDir, 'empty.pdf')
    fs.writeFileSync(filePath, Buffer.alloc(0))

    const result = await validateUploadedFile(filePath, 'empty.pdf')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('está vazio')
  })
})
