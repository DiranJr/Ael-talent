import { describe, it, expect } from 'vitest'
import {
  STATUS_MAP,
  formatWhatsAppUrl,
  formatCandidateProfile,
  sendSuccess,
  sendError,
} from '../../server/helpers.js'

describe('Server Helpers & Business Mappers', () => {
  it('STATUS_MAP deve cobrir os status padrão do OpenCATS', () => {
    expect(STATUS_MAP[100].label).toBe('Novo / Recebido')
    expect(STATUS_MAP[500].label).toBe('Entrevista')
    expect(STATUS_MAP[600].label).toBe('Aprovado / Proposta')
    expect(STATUS_MAP[650].label).toBe('Banco de Talentos / Futuro')
    expect(STATUS_MAP[700].label).toBe('Não Selecionado')
    expect(STATUS_MAP[800].label).toBe('Contratado')
  })

  it('formatWhatsAppUrl deve formatar números com DDD e código internacional 55', () => {
    const url1 = formatWhatsAppUrl('(94) 98123-4567', 'João Silva')
    expect(url1).toBeDefined()
    expect(url1).toContain('wa.me/5594981234567')
    expect(url1).toContain('text=Ol%C3%A1%20Jo%C3%A3o%20Silva')

    const url2 = formatWhatsAppUrl('+55 94 99111-2233', 'Maria')
    expect(url2).toContain('wa.me/5594991112233')

    const urlNull = formatWhatsAppUrl('', 'Teste')
    expect(urlNull).toBeNull()

    const urlInvalid = formatWhatsAppUrl('123', 'Teste')
    expect(urlInvalid).toBeNull()
  })

  it('formatCandidateProfile deve processar campos estruturados JSON e fallbacks', () => {
    const rawCandidate = {
      candidate_id: 50,
      first_name: 'Ana',
      last_name: 'Paula',
      email1: 'ana@example.com',
      phone_cell: '94999998888',
      city: 'Parauapebas',
      state: 'PA',
      key_skills: 'NR-35, NR-33, RAC-01',
    }

    const extras = {
      'Area de Interesse': 'Segurança do Trabalho',
      'Tempo de Experiencia': '3 a 5 anos',
      'Formacao Academica': JSON.stringify([
        {
          level: 'Pós-graduação',
          course: 'Engenharia de Segurança',
          institution: 'USP',
          year: '2022',
          status: 'Concluído',
        },
      ]),
    }

    const formatted = formatCandidateProfile(rawCandidate, extras)
    expect(formatted.candidate_id).toBe(50)
    expect(formatted.full_name).toBe('Ana Paula')
    expect(formatted.interest_area).toBe('Segurança do Trabalho')
    expect(Array.isArray(formatted.key_skills)).toBe(true)
    expect(formatted.key_skills.length).toBe(3)
    expect(formatted.key_skills).toContain('NR-35')
    expect(formatted.whatsapp_link).toContain('wa.me/5594999998888')
    expect(formatted.educations[0].course).toBe('Engenharia de Segurança')
  })

  it('sendSuccess e sendError devem formatar respostas padronizadas com request_id', () => {
    const mockRes = {
      req: { id: 'test-req-1234' },
      statusCode: null,
      jsonBody: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.jsonBody = data
        return this
      },
    }

    sendSuccess(mockRes, { user: 'tester' }, 'Operação concluída', 201)
    expect(mockRes.statusCode).toBe(201)
    expect(mockRes.jsonBody.success).toBe(true)
    expect(mockRes.jsonBody.message).toBe('Operação concluída')
    expect(mockRes.jsonBody.user).toBe('tester')
    expect(mockRes.jsonBody.request_id).toBe('test-req-1234')

    sendError(mockRes, 'Credenciais inválidas', 401)
    expect(mockRes.statusCode).toBe(401)
    expect(mockRes.jsonBody.success).toBe(false)
    expect(mockRes.jsonBody.error).toBe('Credenciais inválidas')
    expect(mockRes.jsonBody.request_id).toBe('test-req-1234')
  })
})
