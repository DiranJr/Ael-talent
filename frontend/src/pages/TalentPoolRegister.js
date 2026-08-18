/**
 * A&L Talent — Formulário em 6 Etapas do Banco de Talentos
 * Suporta:
 * - Múltiplas Formações Acadêmicas (+ Adicionar Outra)
 * - Múltiplas Experiências Profissionais (+ Adicionar Outra + Resumo)
 * - Candidatura Direta a Vagas (job_id)
 * - Auto-complete ao digitar e-mail cadastrado
 * Rota: #/talent-pool/register e #/jobs/:id/apply
 */

import { registerTalentPool, getFilters, lookupCandidate, getJob, setCandidateAuth } from '../api.js'
import { showToast } from '../components/Toast.js'

const SUGGESTED_SKILLS = [
  'Excel Avançado',
  'AutoCAD',
  'Power BI',
  'MS Project',
  'SAP / ERP',
  'NR-10',
  'NR-35',
  'NR-12',
  'NR-18',
  'Gestão de Obras',
  'Planejamento Físico-Financeiro',
  'Terraplenagem',
  'Pavimentação Asfáltica',
  'Drenagem & Saneamento',
  'Topografia',
  'Controle Tecnológico / Laboratório',
  'Segurança do Trabalho',
  'Gestão de Equipes',
  'Operação de Escavadeira / Trator',
  'Manutenção Pesada',
  'Suprimentos & Compras',
  'Faturamento & Medições',
]

export async function renderTalentPoolRegister(params, appEl) {
  const jobId = params?.id || new URLSearchParams(window.location.hash.split('?')[1] || '').get('job_id') || null
  let targetJob = null
  let departments = []

  try {
    const [filtersRes, jobRes] = await Promise.all([
      getFilters(),
      jobId ? getJob(jobId).catch(() => null) : Promise.resolve(null),
    ])
    departments = (filtersRes.departments || []).filter(d => d.value)
    if (jobRes?.job) {
      targetJob = jobRes.job
    }
  } catch (err) {
    console.error('Erro ao inicializar formulário:', err)
  }

  // Estado do formulário
  const formData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    state: 'PA',
    linkedin: '',
    interest_area: targetJob?.department_name || '',
    desired_role: targetJob?.title || '',
    desired_pay: '',
    travel_availability: 'Total (Qualquer região)',
    driver_license: 'Não possui',
    can_relocate: '1',
    educations: [
      { level: 'Superior Completo', course: '', institution: '', year: '', status: 'Concluído' }
    ],
    experiences: [
      { role: '', company: '', period: '', is_current: false, activities: '' }
    ],
    notes: '',
    key_skills: [],
    consent_lgpd: false,
    resume: null,
  }

  let currentStep = 1
  const totalSteps = 6
  let lookupDone = false

  function render() {
    appEl.innerHTML = `
      <div style="background: var(--ael-surface); min-height: 100vh; padding-top: calc(var(--ael-header-h) + 2rem); padding-bottom: 5rem;">
        <div class="container" style="max-width: 780px; margin-inline: auto;">

          <!-- BANNER DE CANDIDATURA DIRETA A VAGA (SE APLICÁVEL) -->
          ${targetJob ? `
            <div style="
              background: linear-gradient(135deg, var(--ael-green-dark), var(--ael-green-base));
              border-radius: var(--ael-radius-lg);
              padding: 1.25rem 1.5rem;
              margin-bottom: 1.5rem;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
              flex-wrap: wrap;
              box-shadow: 0 4px 16px rgba(0, 48, 30, 0.15);
            ">
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ael-green-accent);">
                  Candidatura para Oportunidade Aberta
                </div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-top: 0.15rem;">
                  ${escHtml(targetJob.title)}
                </div>
                <div style="font-size: 0.8125rem; color: rgba(255,255,255,0.85); margin-top: 0.25rem;">
                  ${escHtml(targetJob.department_name || 'Geral')} · ${escHtml([targetJob.city, targetJob.state].filter(Boolean).join(' - ') || 'Parauapebas - PA')}
                </div>
              </div>
              <div style="font-size: 0.75rem; background: rgba(255,255,255,0.15); padding: 0.35rem 0.75rem; border-radius: 999px; font-weight: 600;">
                Perfil integrado ao Banco de Talentos
              </div>
            </div>
          ` : ''}

          <!-- Breadcrumb & Header -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--ael-muted); margin-bottom: 0.75rem;">
              <a href="#/talent-pool" style="color: var(--ael-green-base); text-decoration: none; font-weight: 700;">Banco de Talentos</a>
              <span>›</span>
              <span style="color: var(--ael-ink); font-weight: 600;">${targetJob ? 'Inscrição na Vaga' : 'Cadastro de Perfil'}</span>
            </div>
            <h1 style="font-size: clamp(1.75rem, 3.5vw, 2.25rem); font-weight: 800; color: var(--ael-ink);">
              ${targetJob ? `Candidatura: ${escHtml(targetJob.title)}` : 'Faça Parte do Time A&L'}
            </h1>
            <p style="color: var(--ael-muted); font-size: 0.9375rem; margin-top: 0.25rem;">
              Preencha seu perfil profissional estruturado. Se já possui cadastro, digite seu e-mail para carregar seus dados.
            </p>
          </div>

          <!-- PROGRESS BAR -->
          <div class="data-card" style="padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.875rem; font-weight: 700; color: var(--ael-ink);">
                Etapa ${currentStep} de ${totalSteps}: <span style="color: var(--ael-green-base);">${getStepTitle(currentStep)}</span>
              </span>
              <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-green-base);">
                ${Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden;">
              <div style="
                height: 100%;
                width: ${(currentStep / totalSteps) * 100}%;
                background: linear-gradient(90deg, var(--ael-green-base), var(--ael-green-accent));
                border-radius: 999px;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>

          <!-- CARD FORMULÁRIO -->
          <div class="data-card" style="padding: 2rem;">
            <form id="talent-pool-form">
              ${renderStepContent(currentStep, formData, departments)}

              <!-- BOTÕES DE NAVEGAÇÃO -->
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 2.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--ael-line);
              ">
                ${currentStep > 1 ? `
                  <button type="button" class="btn btn-outline" id="prev-step-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                    <span>Voltar</span>
                  </button>
                ` : `<div></div>`}

                ${currentStep < totalSteps ? `
                  <button type="button" class="btn btn-primary btn-lg" id="next-step-btn">
                    <span>Avançar Etapa</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                ` : `
                  <button type="submit" class="btn btn-primary btn-lg" id="submit-talent-btn" style="box-shadow: 0 4px 16px rgba(0, 230, 118, 0.3);">
                    <span>${targetJob ? 'Confirmar Candidatura & Salvar Perfil' : 'Concluir Cadastro no Banco de Talentos'}</span>
                  </button>
                `}
              </div>
            </form>
          </div>

        </div>
      </div>
    `
    bindEvents()
  }

  function getStepTitle(step) {
    switch (step) {
      case 1: return 'Dados Pessoais & Contato'
      case 2: return 'Interesse Profissional'
      case 3: return 'Formação Acadêmica'
      case 4: return 'Experiência Profissional & Resumo'
      case 5: return 'Competências & Habilidades'
      case 6: return 'Revisão & Finalização'
      default: return ''
    }
  }

  function renderStepContent(step, data, depts) {
    switch (step) {
      case 1:
        return `
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 1.5rem;">
            1. Dados Pessoais & Informações de Contato
          </h3>

          <div class="form-group">
            <label class="form-label" for="tp-email">E-mail * <span style="font-weight:400;color:var(--ael-muted);">(se já tiver cadastro, carregaremos seus dados)</span></label>
            <input id="tp-email" name="email" type="email" class="form-control" placeholder="seu.email@exemplo.com" value="${escAttr(data.email)}" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-first-name">Nome *</label>
              <input id="tp-first-name" name="first_name" type="text" class="form-control" placeholder="Seu nome" value="${escAttr(data.first_name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="tp-last-name">Sobrenome *</label>
              <input id="tp-last-name" name="last_name" type="text" class="form-control" placeholder="Seu sobrenome completo" value="${escAttr(data.last_name)}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-phone">WhatsApp / Celular com DDD *</label>
              <input id="tp-phone" name="phone" type="tel" class="form-control" placeholder="(94) 99123-4567" value="${escAttr(data.phone)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="tp-state">Estado (UF) *</label>
              <select id="tp-state" name="state" class="form-control" required>
                <option value="PA" ${data.state === 'PA' ? 'selected' : ''}>PA - Pará</option>
                <option value="MG" ${data.state === 'MG' ? 'selected' : ''}>MG - Minas Gerais</option>
                <option value="MA" ${data.state === 'MA' ? 'selected' : ''}>MA - Maranhão</option>
                <option value="TO" ${data.state === 'TO' ? 'selected' : ''}>TO - Tocantins</option>
                <option value="GO" ${data.state === 'GO' ? 'selected' : ''}>GO - Goiás</option>
                <option value="DF" ${data.state === 'DF' ? 'selected' : ''}>DF - Distrito Federal</option>
                <option value="SP" ${data.state === 'SP' ? 'selected' : ''}>SP - São Paulo</option>
                <option value="RJ" ${data.state === 'RJ' ? 'selected' : ''}>RJ - Rio de Janeiro</option>
                <option value="BA" ${data.state === 'BA' ? 'selected' : ''}>BA - Bahia</option>
                <option value="OUTRO" ${data.state === 'OUTRO' ? 'selected' : ''}>Outro Estado</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-city">Cidade onde mora *</label>
              <input id="tp-city" name="city" type="text" class="form-control" placeholder="Ex: Parauapebas, Canaã, Marabá, BH..." value="${escAttr(data.city)}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="tp-linkedin">LinkedIn ou Portfólio (opcional)</label>
              <input id="tp-linkedin" name="linkedin" type="url" class="form-control" placeholder="https://linkedin.com/in/seuperfil" value="${escAttr(data.linkedin)}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(0,91,58,0.04); border: 1px solid rgba(0,91,58,0.12); padding: 1rem; border-radius: var(--ael-radius-md); margin-top: 0.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="tp-password" style="font-weight: 700; color: var(--ael-green-dark);">
                Criar Senha de Acesso *
              </label>
              <input
                id="tp-password"
                name="password"
                type="password"
                class="form-control"
                placeholder="Mínimo 8 caracteres"
                value="${escAttr(data.password || '')}"
                minlength="8"
                required
              />
              <div class="form-hint">Para acessar o Portal do Candidato com segurança.</div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="tp-password-confirm" style="font-weight: 700; color: var(--ael-green-dark);">
                Confirmar Senha *
              </label>
              <input
                id="tp-password-confirm"
                name="password_confirm"
                type="password"
                class="form-control"
                placeholder="Repita sua senha"
                value="${escAttr(data.password_confirm || '')}"
                minlength="8"
                required
              />
            </div>
          </div>
        `

      case 2:
        return `
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 1.5rem;">
            2. Interesse Profissional & Disponibilidade
          </h3>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-interest-area">Área de Interesse Principal *</label>
              <select id="tp-interest-area" name="interest_area" class="form-control" required>
                <option value="">Selecione sua área</option>
                ${depts.map(d => `
                  <option value="${d.value}" ${data.interest_area === d.value ? 'selected' : ''}>${escHtml(d.label)}</option>
                `).join('')}
                <option value="Operacional" ${data.interest_area === 'Operacional' ? 'selected' : ''}>Operacional / Obras</option>
                <option value="Engenharia" ${data.interest_area === 'Engenharia' ? 'selected' : ''}>Engenharia & Projetos</option>
                <option value="Administrativo" ${data.interest_area === 'Administrativo' ? 'selected' : ''}>Administrativo & Financeiro</option>
                <option value="Segurança do Trabalho" ${data.interest_area === 'Segurança do Trabalho' ? 'selected' : ''}>Segurança do Trabalho (SST)</option>
                <option value="Outra" ${data.interest_area === 'Outra' ? 'selected' : ''}>Outra Área</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="tp-desired-role">Cargo ou Função Desejada *</label>
              <input id="tp-desired-role" name="desired_role" type="text" class="form-control" placeholder="Ex: Engenheiro de Produção, Auxiliar de Obras..." value="${escAttr(data.desired_role)}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-travel">Disponibilidade para Viagens</label>
              <select id="tp-travel" name="travel_availability" class="form-control">
                <option value="Total (Qualquer região)" ${data.travel_availability.includes('Total') ? 'selected' : ''}>Total (Disponível para qualquer região)</option>
                <option value="Parcial (Viagens curtas)" ${data.travel_availability.includes('Parcial') ? 'selected' : ''}>Parcial (Viagens eventuais e curtas)</option>
                <option value="Apenas na região atual" ${data.travel_availability.includes('região atual') ? 'selected' : ''}>Apenas na minha região atual</option>
                <option value="Não disponível" ${data.travel_availability.includes('Não') ? 'selected' : ''}>Não disponível para viagens</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="tp-cnh">Possui CNH (Habilitação)?</label>
              <select id="tp-cnh" name="driver_license" class="form-control">
                <option value="Não possui" ${data.driver_license === 'Não possui' ? 'selected' : ''}>Não possuo CNH</option>
                <option value="Categoria A (Moto)" ${data.driver_license.includes('Categoria A') ? 'selected' : ''}>Categoria A (Moto)</option>
                <option value="Categoria B (Carro)" ${data.driver_license.includes('Categoria B') ? 'selected' : ''}>Categoria B (Carro)</option>
                <option value="Categoria AB (Carro e Moto)" ${data.driver_license.includes('Categoria AB') ? 'selected' : ''}>Categoria AB (Carro e Moto)</option>
                <option value="Categoria C (Caminhão)" ${data.driver_license.includes('Categoria C') ? 'selected' : ''}>Categoria C (Caminhão)</option>
                <option value="Categoria D (Ônibus/Vans)" ${data.driver_license.includes('Categoria D') ? 'selected' : ''}>Categoria D (Ônibus/Transporte)</option>
                <option value="Categoria E (Carretas/Pesados)" ${data.driver_license.includes('Categoria E') ? 'selected' : ''}>Categoria E (Veículos Pesados/Carretas)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="tp-desired-pay">Pretensão Salarial (opcional)</label>
              <input id="tp-desired-pay" name="desired_pay" type="text" class="form-control" placeholder="Ex: R$ 3.500,00 ou A combinar" value="${escAttr(data.desired_pay)}" />
            </div>

            <div class="form-group" style="display: flex; flex-direction: column; justify-content: center;">
              <label class="form-label" style="margin-bottom: 0.5rem;">Disponibilidade para Mudança?</label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--ael-ink); cursor: pointer;">
                <input type="checkbox" id="tp-relocate" ${data.can_relocate === '1' ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--ael-green-base);" />
                <span>Sim, tenho disponibilidade para mudar de cidade/estado</span>
              </label>
            </div>
          </div>
        `

      case 3:
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin: 0;">
              3. Formação Acadêmica & Cursos
            </h3>
            <button type="button" class="btn btn-sm btn-outline" id="add-education-btn" style="gap: 0.375rem; font-weight: 600;">
              <span>+ Adicionar Outra Formação</span>
            </button>
          </div>

          <div id="educations-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${data.educations.map((edu, idx) => `
              <div class="edu-card" data-idx="${idx}" style="
                background: #ffffff;
                border: 1.5px solid var(--ael-line);
                border-radius: var(--ael-radius-lg);
                padding: 1.25rem;
                position: relative;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-green-base);">
                    Formação #${idx + 1}
                  </span>
                  ${data.educations.length > 1 ? `
                    <button type="button" class="btn-icon danger remove-edu-btn" data-idx="${idx}" title="Remover formação" style="width: 28px; height: 28px;">
                      ✕
                    </button>
                  ` : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Nível de Escolaridade *</label>
                    <select class="form-control edu-level" required>
                      <option value="Ensino Médio Completo" ${edu.level === 'Ensino Médio Completo' ? 'selected' : ''}>Ensino Médio Completo</option>
                      <option value="Técnico em Andamento" ${edu.level === 'Técnico em Andamento' ? 'selected' : ''}>Curso Técnico (em andamento)</option>
                      <option value="Técnico Completo" ${edu.level === 'Técnico Completo' ? 'selected' : ''}>Curso Técnico (completo)</option>
                      <option value="Superior em Andamento" ${edu.level === 'Superior em Andamento' ? 'selected' : ''}>Ensino Superior (em andamento)</option>
                      <option value="Superior Completo" ${edu.level === 'Superior Completo' ? 'selected' : ''}>Ensino Superior (completo / graduação)</option>
                      <option value="Pós-Graduação / MBA" ${edu.level?.includes('Pós') ? 'selected' : ''}>Pós-Graduação / MBA / Especialização</option>
                      <option value="Mestrado / Doutorado" ${edu.level?.includes('Mestrado') ? 'selected' : ''}>Mestrado / Doutorado</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Curso / Área de Formação *</label>
                    <input type="text" class="form-control edu-course" placeholder="Ex: Engenharia Civil, Mineração, Administração..." value="${escAttr(edu.course)}" required />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 0;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Instituição de Ensino / Faculdade</label>
                    <input type="text" class="form-control edu-institution" placeholder="Ex: SENAI, IFPA, UFPA, PUC, Estácio..." value="${escAttr(edu.institution)}" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Ano de Conclusão / Previsão</label>
                    <input type="text" class="form-control edu-year" placeholder="Ex: 2022, 2025..." value="${escAttr(edu.year)}" />
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `

      case 4:
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin: 0;">
              4. Experiência Profissional & Resumo
            </h3>
            <button type="button" class="btn btn-sm btn-outline" id="add-experience-btn" style="gap: 0.375rem; font-weight: 600;">
              <span>+ Adicionar Outra Experiência</span>
            </button>
          </div>

          <!-- RESUMO PROFISSIONAL -->
          <div class="form-group" style="background: rgba(0, 91, 58, 0.04); border: 1px solid rgba(0, 91, 58, 0.15); border-radius: var(--ael-radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
            <label class="form-label" for="tp-notes" style="font-weight: 700; color: var(--ael-green-dark);">
              Resumo Profissional / Apresentação (Mini-Bio) *
            </label>
            <textarea id="tp-notes" name="notes" rows="3" class="form-control" placeholder="Descreva brevemente sua trajetória, principais realizações, tipos de obras que já atuou e seus pontos fortes..." style="resize: vertical; font-family: inherit; line-height: 1.6;" required>${escHtml(data.notes)}</textarea>
            <div class="form-hint">Este resumo será o primeiro texto visualizado pelos recrutadores da A&L.</div>
          </div>

          <!-- LISTA DE EXPERIÊNCIAS -->
          <div id="experiences-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${data.experiences.map((exp, idx) => `
              <div class="exp-card" data-idx="${idx}" style="
                background: #ffffff;
                border: 1.5px solid var(--ael-line);
                border-radius: var(--ael-radius-lg);
                padding: 1.25rem;
                position: relative;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-green-base);">
                    Experiência #${idx + 1} ${idx === 0 ? '(Mais Recente)' : ''}
                  </span>
                  ${data.experiences.length > 1 ? `
                    <button type="button" class="btn-icon danger remove-exp-btn" data-idx="${idx}" title="Remover experiência" style="width: 28px; height: 28px;">
                      ✕
                    </button>
                  ` : ''}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Cargo / Função *</label>
                    <input type="text" class="form-control exp-role" placeholder="Ex: Encarregado de Terraplenagem, Analista Jr..." value="${escAttr(exp.role)}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Empresa / Construtora *</label>
                    <input type="text" class="form-control exp-company" placeholder="Ex: Nome da construtora ou empresa" value="${escAttr(exp.company)}" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Período de Atuação</label>
                  <input type="text" class="form-control exp-period" placeholder="Ex: Jan 2021 a Mar 2024 ou Jan 2023 até o momento" value="${escAttr(exp.period)}" />
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Principais Atividades & Responsabilidades</label>
                  <textarea rows="2" class="form-control exp-activities" placeholder="Descreva brevemente as rotinas, equipamentos ou equipes sob sua responsabilidade..." style="resize: vertical; font-family: inherit;">${escHtml(exp.activities)}</textarea>
                </div>
              </div>
            `).join('')}
          </div>
        `

      case 5:
        return `
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 0.5rem;">
            5. Competências Técnicas & Habilidades
          </h3>
          <p style="font-size: 0.875rem; color: var(--ael-muted); margin-bottom: 1.5rem;">
            Clique nas competências que você domina para adicioná-las com 1 clique ao seu perfil.
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;" id="skills-cloud">
            ${SUGGESTED_SKILLS.map(skill => {
              const isSelected = data.key_skills.includes(skill)
              return `
                <button
                  type="button"
                  class="skill-pill-btn ${isSelected ? 'selected' : ''}"
                  data-skill="${escAttr(skill)}"
                  style="
                    padding: 0.4rem 0.875rem;
                    border-radius: 999px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    border: 1.5px solid ${isSelected ? 'var(--ael-green-base)' : 'var(--ael-line)'};
                    background: ${isSelected ? 'rgba(0, 91, 58, 0.12)' : '#ffffff'};
                    color: ${isSelected ? 'var(--ael-green-dark)' : 'var(--ael-ink)'};
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    transition: all 0.15s ease;
                  "
                >
                  <span>${isSelected ? '✓' : '+'}</span>
                  <span>${escHtml(skill)}</span>
                </button>
              `
            }).join('')}
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="tp-other-skills">Outras Competências / Softwares / Normas (separadas por vírgula)</label>
            <input
              id="tp-other-skills"
              type="text"
              class="form-control"
              placeholder="Ex: Primavera P6, Cursos específicos, Máquinas pesadas..."
              value="${escAttr(data.key_skills.filter(s => !SUGGESTED_SKILLS.includes(s)).join(', '))}"
            />
          </div>
        `

      case 6:
        return `
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 1.5rem;">
            6. Revisão do Perfil & Finalização
          </h3>

          <!-- CARD RESUMO -->
          <div style="
            background: rgba(0, 91, 58, 0.04);
            border: 1px solid rgba(0, 91, 58, 0.15);
            border-radius: var(--ael-radius-lg);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          ">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div>
                <div style="font-weight: 800; color: var(--ael-ink); font-size: 1.125rem;">${escHtml(data.first_name)} ${escHtml(data.last_name)}</div>
                <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 0.15rem;">
                  ${escHtml(data.email)} · ${escHtml(data.phone)} · ${escHtml(data.city)} - ${escHtml(data.state)}
                </div>
              </div>
              <span class="badge badge-green">${escHtml(data.interest_area || 'Geral')}</span>
            </div>

            <div style="font-size: 0.8125rem; border-top: 1px solid rgba(0,91,58,0.1); padding-top: 0.75rem; margin-bottom: 0.75rem;">
              <strong>Cargo Desejado:</strong> ${escHtml(data.desired_role || 'Não informado')}<br>
              <strong>Disponibilidade:</strong> Viagens: ${escHtml(data.travel_availability)} · Mudança: ${data.can_relocate === '1' ? 'Sim' : 'Não'} · CNH: ${escHtml(data.driver_license)}
            </div>

            <div style="font-size: 0.8125rem; border-top: 1px solid rgba(0,91,58,0.1); padding-top: 0.75rem; margin-bottom: 0.75rem;">
              <strong>Formações (${data.educations.length}):</strong>
              <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
                ${data.educations.map(e => `<li>${escHtml(e.level)} em ${escHtml(e.course || 'Área não informada')} (${escHtml(e.institution || 'Instituição não informada')})</li>`).join('')}
              </ul>
            </div>

            <div style="font-size: 0.8125rem; border-top: 1px solid rgba(0,91,58,0.1); padding-top: 0.75rem; margin-bottom: 0.75rem;">
              <strong>Experiências (${data.experiences.length}):</strong>
              <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
                ${data.experiences.map(e => `<li>${escHtml(e.role || 'Cargo')} na empresa ${escHtml(e.company || 'Não informada')} ${e.period ? `(${escHtml(e.period)})` : ''}</li>`).join('')}
              </ul>
            </div>

            ${data.key_skills.length ? `
              <div style="margin-top: 0.75rem; font-size: 0.75rem; border-top: 1px solid rgba(0,91,58,0.1); padding-top: 0.75rem;">
                <strong>Competências:</strong> ${escHtml(data.key_skills.join(', '))}
              </div>
            ` : ''}
          </div>

          <!-- UPLOAD OPCIONAL DE CURRÍCULO -->
          <div class="form-group">
            <label class="form-label" for="tp-resume">
              Deseja anexar seu Currículo em PDF? <span style="font-weight: 400; color: var(--ael-muted);">(Opcional)</span>
            </label>
            <input id="tp-resume" name="resume" type="file" class="form-control" accept=".pdf,.doc,.docx" />
            <div class="form-hint">Formatos aceitos: PDF, DOC ou DOCX (máx 5MB). Se preferir, não precisa anexar arquivo.</div>
          </div>

          <!-- CONSENTIMENTO LGPD -->
          <div style="
            background: #ffffff;
            border: 1.5px solid var(--ael-line);
            border-radius: var(--ael-radius-lg);
            padding: 1.25rem;
            margin-top: 1.5rem;
          ">
            <label style="display: flex; gap: 0.75rem; align-items: flex-start; cursor: pointer;">
              <input
                type="checkbox"
                id="tp-consent"
                ${data.consent_lgpd ? 'checked' : ''}
                style="width: 20px; height: 20px; accent-color: var(--ael-green-base); margin-top: 2px;"
                required
              />
              <span style="font-size: 0.8125rem; color: var(--ael-text); line-height: 1.5;">
                <strong style="color: var(--ael-ink);">Termo de Consentimento para Banco de Talentos e Processos Seletivos:</strong><br>
                Autorizo expressamente a <strong>A&L Engenharia</strong> a armazenar e utilizar meus dados pessoais e profissionais fornecidos neste cadastro para fins exclusivos de processos seletivos, triagem de vagas e contato de oportunidades futuras, em estrita conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018).
              </span>
            </label>
          </div>
        `
      default: return ''
    }
  }

  function saveCurrentStepData() {
    switch (currentStep) {
      case 1:
        formData.first_name = document.getElementById('tp-first-name')?.value || ''
        formData.last_name  = document.getElementById('tp-last-name')?.value || ''
        formData.email      = document.getElementById('tp-email')?.value || ''
        formData.phone            = document.getElementById('tp-phone')?.value || ''
        formData.city             = document.getElementById('tp-city')?.value || ''
        formData.state            = document.getElementById('tp-state')?.value || 'PA'
        formData.linkedin         = document.getElementById('tp-linkedin')?.value || ''
        formData.password         = document.getElementById('tp-password')?.value || ''
        formData.password_confirm = document.getElementById('tp-password-confirm')?.value || ''
        break

      case 2:
        formData.interest_area       = document.getElementById('tp-interest-area')?.value || ''
        formData.desired_role        = document.getElementById('tp-desired-role')?.value || ''
        formData.travel_availability = document.getElementById('tp-travel')?.value || ''
        formData.driver_license      = document.getElementById('tp-cnh')?.value || ''
        formData.desired_pay         = document.getElementById('tp-desired-pay')?.value || ''
        formData.can_relocate        = document.getElementById('tp-relocate')?.checked ? '1' : '0'
        break

      case 3:
        const eduCards = document.querySelectorAll('.edu-card')
        formData.educations = Array.from(eduCards).map(card => ({
          level: card.querySelector('.edu-level')?.value || 'Superior Completo',
          course: card.querySelector('.edu-course')?.value || '',
          institution: card.querySelector('.edu-institution')?.value || '',
          year: card.querySelector('.edu-year')?.value || '',
          status: 'Concluído'
        }))
        if (!formData.educations.length) {
          formData.educations = [{ level: 'Superior Completo', course: '', institution: '', year: '', status: 'Concluído' }]
        }
        break

      case 4:
        formData.notes = document.getElementById('tp-notes')?.value || ''
        const expCards = document.querySelectorAll('.exp-card')
        formData.experiences = Array.from(expCards).map(card => ({
          role: card.querySelector('.exp-role')?.value || '',
          company: card.querySelector('.exp-company')?.value || '',
          period: card.querySelector('.exp-period')?.value || '',
          activities: card.querySelector('.exp-activities')?.value || '',
        }))
        if (!formData.experiences.length) {
          formData.experiences = [{ role: '', company: '', period: '', activities: '' }]
        }
        break

      case 5:
        const otherSkills = document.getElementById('tp-other-skills')?.value || ''
        const otherList = otherSkills.split(',').map(s => s.trim()).filter(Boolean)
        const selectedPills = Array.from(document.querySelectorAll('.skill-pill-btn.selected')).map(b => b.dataset.skill)
        formData.key_skills = Array.from(new Set([...selectedPills, ...otherList]))
        break

      case 6:
        formData.consent_lgpd = document.getElementById('tp-consent')?.checked || false
        const fileInput = document.getElementById('tp-resume')
        if (fileInput?.files?.[0]) {
          formData.resume = fileInput.files[0]
        }
        break
    }
  }

  function validateStep(step) {
    saveCurrentStepData()
    switch (step) {
      case 1:
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          showToast({ title: 'Atenção', message: 'Preencha seu nome e sobrenome.', type: 'error' })
          return false
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          showToast({ title: 'Atenção', message: 'Informe um e-mail válido.', type: 'error' })
          return false
        }
        if (!formData.phone.trim()) {
          showToast({ title: 'Atenção', message: 'Informe seu WhatsApp / Telefone com DDD.', type: 'error' })
          return false
        }
        if (!formData.city.trim()) {
          showToast({ title: 'Atenção', message: 'Informe sua cidade.', type: 'error' })
          return false
        }
        if (!formData.password || formData.password.length < 8) {
          showToast({ title: 'Senha Obrigatória', message: 'Crie uma senha com no mínimo 8 caracteres para seu perfil.', type: 'error' })
          return false
        }
        if (formData.password !== formData.password_confirm) {
          showToast({ title: 'Senhas Diferentes', message: 'A confirmação de senha não coincide com a senha criada.', type: 'error' })
          return false
        }
        return true

      case 2:
        if (!formData.interest_area) {
          showToast({ title: 'Atenção', message: 'Selecione sua área de interesse principal.', type: 'error' })
          return false
        }
        if (!formData.desired_role.trim()) {
          showToast({ title: 'Atenção', message: 'Informe o cargo ou função que busca.', type: 'error' })
          return false
        }
        return true

      case 3:
        const firstEdu = formData.educations[0]
        if (!firstEdu || !firstEdu.course.trim()) {
          showToast({ title: 'Atenção', message: 'Informe o curso ou área de formação.', type: 'error' })
          return false
        }
        return true

      case 4:
        if (!formData.notes.trim()) {
          showToast({ title: 'Atenção', message: 'Preencha seu resumo profissional / apresentação.', type: 'error' })
          return false
        }
        const firstExp = formData.experiences[0]
        if (!firstExp || !firstExp.role.trim() || !firstExp.company.trim()) {
          showToast({ title: 'Atenção', message: 'Preencha pelo menos uma experiência profissional (cargo e empresa).', type: 'error' })
          return false
        }
        return true

      case 5:
        return true

      case 6:
        if (!formData.consent_lgpd) {
          showToast({ title: 'Consentimento Obrigatório', message: 'Você precisa aceitar o termo de consentimento para finalizar.', type: 'error' })
          return false
        }
        return true
    }
    return true
  }

  function bindEvents() {
    // Adicionar / Remover Formações
    document.getElementById('add-education-btn')?.addEventListener('click', () => {
      saveCurrentStepData()
      formData.educations.push({ level: 'Superior Completo', course: '', institution: '', year: '', status: 'Concluído' })
      render()
    })

    document.querySelectorAll('.remove-edu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx)
        saveCurrentStepData()
        formData.educations.splice(idx, 1)
        render()
      })
    })

    // Adicionar / Remover Experiências
    document.getElementById('add-experience-btn')?.addEventListener('click', () => {
      saveCurrentStepData()
      formData.experiences.push({ role: '', company: '', period: '', is_current: false, activities: '' })
      render()
    })

    document.querySelectorAll('.remove-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx)
        saveCurrentStepData()
        formData.experiences.splice(idx, 1)
        render()
      })
    })

    // Voltar
    document.getElementById('prev-step-btn')?.addEventListener('click', () => {
      saveCurrentStepData()
      if (currentStep > 1) {
        currentStep--
        render()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })

    // Avançar
    document.getElementById('next-step-btn')?.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++
          render()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    })

    // Skills pills toggle
    document.querySelectorAll('.skill-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected')
        const isSelected = btn.classList.contains('selected')
        btn.style.borderColor = isSelected ? 'var(--ael-green-base)' : 'var(--ael-line)'
        btn.style.background = isSelected ? 'rgba(0, 91, 58, 0.12)' : '#ffffff'
        btn.style.color = isSelected ? 'var(--ael-green-dark)' : 'var(--ael-ink)'
        btn.querySelector('span:first-child').textContent = isSelected ? '✓' : '+'
      })
    })

    // Submit final
    document.getElementById('talent-pool-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (!validateStep(6)) return

      const submitBtn = document.getElementById('submit-talent-btn')
      submitBtn.disabled = true
      submitBtn.querySelector('span').textContent = 'Processando Inscrição...'

      const payload = new FormData()
      payload.append('first_name', formData.first_name)
      payload.append('last_name', formData.last_name)
      payload.append('email', formData.email)
      payload.append('phone', formData.phone)
      payload.append('city', formData.city)
      payload.append('state', formData.state)
      payload.append('linkedin', formData.linkedin)
      payload.append('interest_area', formData.interest_area)
      payload.append('desired_role', formData.desired_role)
      payload.append('desired_pay', formData.desired_pay)
      payload.append('travel_availability', formData.travel_availability)
      payload.append('driver_license', formData.driver_license)
      payload.append('can_relocate', formData.can_relocate)
      payload.append('notes', formData.notes)
      payload.append('key_skills', formData.key_skills.join(', '))
      payload.append('educations', JSON.stringify(formData.educations))
      payload.append('experiences', JSON.stringify(formData.experiences))
      payload.append('consent_lgpd', 'true')

      if (formData.password) {
        payload.append('password', formData.password)
      }

      if (jobId) {
        payload.append('job_id', jobId)
      }

      if (formData.resume) {
        payload.append('resume', formData.resume)
      }

      try {
        const res = await registerTalentPool(payload)
        if (res.token) {
          setCandidateAuth(res.token, {
            candidate_id: res.candidate_id,
            email: formData.email,
            name: `${formData.first_name} ${formData.last_name}`,
          })
        }
        renderSuccessScreen(formData.first_name, res.isNew, res.job_title)
      } catch (err) {
        showToast({ title: 'Erro na Inscrição', message: err.message, type: 'error' })
        submitBtn.disabled = false
        submitBtn.querySelector('span').textContent = targetJob ? 'Confirmar Candidatura & Salvar Perfil' : 'Concluir Cadastro no Banco de Talentos'
      }
    })
  }

  function renderSuccessScreen(name, isNew, jobTitle) {
    appEl.innerHTML = `
      <div style="background: var(--ael-surface); min-height: calc(100vh - 80px); padding-block: 4rem 6rem; display: flex; align-items: center;">
        <div class="container" style="max-width: 620px; margin-inline: auto; text-align: center;">
          <div class="data-card" style="padding: 3.5rem 2rem;">
            <div style="
              width: 76px; height: 76px; border-radius: 50%;
              background: rgba(0, 230, 118, 0.15); color: var(--ael-green-dark);
              display: flex; align-items: center; justify-content: center;
              margin-inline: auto; margin-bottom: 1.5rem; font-size: 2.25rem; font-weight: 800;
            ">✓</div>

            <h2 style="font-size: 1.875rem; font-weight: 800; color: var(--ael-ink); margin-bottom: 0.75rem;">
              ${jobTitle ? 'Candidatura Enviada com Sucesso!' : (isNew ? 'Perfil Cadastrado com Sucesso!' : 'Perfil Atualizado com Sucesso!')}
            </h2>

            <p style="color: var(--ael-text); font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
              Olá, <strong>${escHtml(name)}</strong>!
              ${jobTitle
                ? `Sua candidatura para a vaga <strong>"${escHtml(jobTitle)}"</strong> foi confirmada e seus dados estruturados foram salvos no Banco de Talentos da A&L Engenharia.`
                : `Seu perfil profissional estruturado foi cadastrado no Banco de Talentos oficial da A&L Engenharia.`
              }
              Nossa equipe de RH entrará em contato diretamente com você via WhatsApp ou Telefone.
            </p>

            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="#/candidato" class="btn btn-primary btn-lg">
                <span>Acessar Meu Painel de Candidato</span>
              </a>
              <a href="#/jobs" class="btn btn-outline btn-lg">
                <span>Ver Outras Vagas</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }

  render()
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escAttr(s) { return escHtml(s) }
