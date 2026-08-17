/**
 * A&L Talent — População de Candidatos Ricos, Extra Fields e Pipeline do RH
 */

import { getDb } from './server/db.js'
import { hashPassword } from './server/auth/password.js'

const candidatesSeed = [
  {
    first_name: 'Juliana',
    last_name: 'Mendes Cavalcante',
    email: 'juliana.mendes@ael.dev',
    phone: '94991234567',
    city: 'Parauapebas',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/juliana-mendes-minas',
    current_employer: 'Vale S.A.',
    desired_pay: 'R$ 12.000',
    can_relocate: 1,
    notes: 'Excelente background em planejamento de lavra a céu aberto e modelagem geotécnica.',
    key_skills: ['Datamine', 'Deswik', 'Planejamento de Lavra', 'AutoCAD', 'Geotecnia', 'Gestão de Frotas'],
    interest_area: 'Engenharia',
    desired_role: 'Engenheira de Minas Sênior',
    travel_availability: 'Total (Qualquer região)',
    driver_license: 'B',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'Pós-Graduação / Especialização', course: 'Engenharia Geotécnica Aplicada à Mineração', institution: 'UFMG', year: '2022', status: 'Concluído' },
      { level: 'Superior Completo', course: 'Engenharia de Minas', institution: 'UFPA - Campus Marabá', year: '2019', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Engenheira de Minas Pleno', company: 'Vale S.A. (Mina de Carajás)', period: '2022 - Atual', activities: 'Sequenciamento de lavra de curto prazo, conciliação mina-usina e dimensionamento de frota CAT.' },
      { role: 'Assistente de Planejamento de Mina', company: 'Construtora Norberto Odebrecht', period: '2019 - 2022', activities: 'Controle de topografia, mapas de avanço de lavra e relatórios diários de produção.' }
    ],
    job_id: 4, // Engenheiro de Minas Sênior
    pipeline_status: 300, // Qualifying (Em Triagem)
    status_history: [
      { from: 0, to: 100, daysAgo: 10, note: 'Candidatura recebida pelo Portal A&L Talent' },
      { from: 100, to: 200, daysAgo: 7, note: 'Primeiro contato realizado via WhatsApp pelo RH' },
      { from: 200, to: 300, daysAgo: 3, note: 'Aprovada na triagem inicial de requisitos técnicos' }
    ]
  },
  {
    first_name: 'Fernando',
    last_name: 'Henrique Silveira',
    email: 'fernando.silveira@ael.dev',
    phone: '94981122334',
    city: 'Canaã dos Carajás',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/fernando-silveira-tst',
    current_employer: 'Usiminas Mecânica',
    desired_pay: 'R$ 5.500',
    can_relocate: 1,
    notes: 'Profissional muito experiente em NR-22 e NR-35. Ótima postura preventiva.',
    key_skills: ['NR-22', 'NR-35', 'NR-10', 'APR', 'DDS', 'Investigação de Acidentes', 'Espaço Confinado'],
    interest_area: 'Segurança do Trabalho',
    desired_role: 'Técnico em Segurança do Trabalho',
    travel_availability: 'Estadual (Pará)',
    driver_license: 'AB',
    experience_years: '3 a 5 anos',
    educations: [
      { level: 'Técnico', course: 'Técnico em Segurança do Trabalho', institution: 'SENAI Parauapebas', year: '2020', status: 'Concluído' },
      { level: 'Superior Cursando', course: 'Gestão Ambiental', institution: 'UNIP', year: '2025', status: 'Em andamento' }
    ],
    experiences: [
      { role: 'Técnico de Segurança do Trabalho Pleno', company: 'Usiminas Mecânica', period: '2022 - Atual', activities: 'Acompanhamento de montagem industrial, liberação de PT, APR e treinamentos de NR-35 e NR-33.' },
      { role: 'Técnico de Segurança Jr', company: 'Andrade Gutierrez', period: '2020 - 2022', activities: 'Inspeções de frentes de obra civil pesada e controle de EPIs.' }
    ],
    job_id: 5, // TST Canaã
    pipeline_status: 500, // Interviewing (Entrevista)
    status_history: [
      { from: 0, to: 100, daysAgo: 14, note: 'Inscrição via Portal de Carreiras' },
      { from: 100, to: 200, daysAgo: 11, note: 'Contato telefônico realizado' },
      { from: 200, to: 300, daysAgo: 8, note: 'Triagem técnica aprovada' },
      { from: 300, to: 400, daysAgo: 5, note: 'Currículo enviado para o Gestor de SMS' },
      { from: 400, to: 500, daysAgo: 2, note: 'Entrevista técnica e comportamental agendada' }
    ]
  },
  {
    first_name: 'Roberto Carlos',
    last_name: 'Drumond',
    email: 'roberto.drumond@ael.dev',
    phone: '94992345678',
    city: 'Parauapebas',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/roberto-drumond-eng',
    current_employer: 'Tenenge / Engevix',
    desired_pay: 'R$ 16.000',
    can_relocate: 1,
    notes: 'Líder experiente em paradas de manutenção e grandes montagens de britagem.',
    key_skills: ['Montagem Eletromecânica', 'Tubulação Industrial', 'Gestão de Contratos', 'MS Project', 'ISO 9001', 'Liderança'],
    interest_area: 'Engenharia',
    desired_role: 'Coordenador de Montagem Eletromecânica',
    travel_availability: 'Total (Qualquer região)',
    driver_license: 'B',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'MBA / Pós-Graduação', course: 'Gestão de Projetos (PMI)', institution: 'Fundação Getúlio Vargas (FGV)', year: '2018', status: 'Concluído' },
      { level: 'Superior Completo', course: 'Engenharia Mecânica', institution: 'PUC Minas', year: '2014', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Coordenador de Obras Eletromecânicas', company: 'Tenenge Engenharia', period: '2020 - Atual', activities: 'Gestão de 180 colaboradores diretos na ampliação da Usina de Tratamento de Minério.' },
      { role: 'Engenheiro Residente de Montagem', company: 'Metso Outotec Brasil', period: '2015 - 2020', activities: 'Montagem de moinhos de bolas, britadores cônicos e espessadores de rejeitos.' }
    ],
    job_id: 6, // Coordenador Montagem
    pipeline_status: 400, // Submitted (Enviado ao Gestor)
    status_history: [
      { from: 0, to: 100, daysAgo: 8, note: 'Inscrição recebida' },
      { from: 100, to: 300, daysAgo: 6, note: 'Triagem direta por perfil sênior' },
      { from: 300, to: 400, daysAgo: 2, note: 'Apresentado para a Diretoria de Operações' }
    ]
  },
  {
    first_name: 'Camila Beatriz',
    last_name: 'Nogueira',
    email: 'camila.nogueira@ael.dev',
    phone: '31998765432',
    city: 'Belo Horizonte',
    state: 'MG',
    linkedin: 'https://linkedin.com/in/camila-nogueira-rh',
    current_employer: 'Samarco Mineração',
    desired_pay: 'R$ 6.500',
    can_relocate: 0,
    notes: 'Perfil consultivo de Business Partner, excelente comunicação e domínio de ATS.',
    key_skills: ['R&S por Competências', 'DHO', 'People Analytics', 'ATS OpenCATS', 'Treinamento', 'Clima Organizacional'],
    interest_area: 'Recursos Humanos',
    desired_role: 'Analista de Recursos Humanos Pleno',
    travel_availability: 'Ocasional (Treinamentos)',
    driver_license: 'B',
    experience_years: '3 a 5 anos',
    educations: [
      { level: 'Pós-Graduação / Especialização', course: 'Gestão Estratégica de Pessoas', institution: 'IBMEC BH', year: '2021', status: 'Concluído' },
      { level: 'Superior Completo', course: 'Psicologia', institution: 'UFMG', year: '2019', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Analista de Atração & Seleção Pleno', company: 'Samarco Mineração S.A.', period: '2022 - Atual', activities: 'Gestão de vagas corporativas e de engenharia para as unidades de Germano e Ubu.' },
      { role: 'Consultora de RH', company: 'VLI Logística', period: '2019 - 2022', activities: 'Condução de programas de estágio, trainee e seleção técnica operacional.' }
    ],
    job_id: 7, // Analista RH
    pipeline_status: 600, // Offered (Aprovado / Proposta)
    status_history: [
      { from: 0, to: 100, daysAgo: 20, note: 'Inscrição no portal' },
      { from: 100, to: 300, daysAgo: 16, note: 'Triagem de currículos aprovada' },
      { from: 300, to: 500, daysAgo: 10, note: 'Entrevistas realizadas com RH e Gerência' },
      { from: 500, to: 600, daysAgo: 1, note: 'Candidata selecionada - Proposta formal enviada' }
    ]
  },
  {
    first_name: 'Antônio Marcos',
    last_name: 'Fagundes',
    email: 'antonio.fagundes@ael.dev',
    phone: '94993456789',
    city: 'Marabá',
    state: 'PA',
    linkedin: '',
    current_employer: 'Construtora Camargo Corrêa',
    desired_pay: 'R$ 8.000',
    can_relocate: 1,
    notes: 'Líder experiente em terraplenagem e drenagem de grande porte na região Norte.',
    key_skills: ['Terraplenagem', 'Corte e Aterro', 'Drenagem Profunda', 'Escavadeiras CAT', 'Motoniveladoras', 'Topografia'],
    interest_area: 'Operacional',
    desired_role: 'Supervisor de Terraplenagem e Infraestrutura',
    travel_availability: 'Estadual (Pará)',
    driver_license: 'C',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'Técnico', course: 'Técnico em Edificações e Estradas', institution: 'IFPA Campus Marabá', year: '2015', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Supervisor de Campo de Terraplenagem', company: 'Camargo Corrêa Infra', period: '2018 - Atual', activities: 'Supervisão de frota pesada e conformidade de greide em obras rodoviárias e de barragens.' },
      { role: 'Encarregado de Obras', company: 'Queiroz Galvão', period: '2014 - 2018', activities: 'Acompanhamento de compactação e drenagem pluvial.' }
    ],
    job_id: 8, // Supervisor Terraplenagem
    pipeline_status: 100, // No Contact (Novo)
    status_history: [
      { from: 0, to: 100, daysAgo: 1, note: 'Candidatura recebida hoje pelo portal' }
    ]
  },
  {
    first_name: 'Gabriel Santana',
    last_name: 'Ribeiro',
    email: 'gabriel.ribeiro@ael.dev',
    phone: '31987654321',
    city: 'Belo Horizonte',
    state: 'MG',
    linkedin: 'https://linkedin.com/in/gabriel-ribeiro-custos',
    current_employer: 'Construtora Barbosa Mello',
    desired_pay: 'R$ 10.000',
    can_relocate: 0,
    notes: 'Contratado para a vaga de Engenheiro de Custos. Admissão em andamento.',
    key_skills: ['Orçamento de Obras', 'SINAPI', 'SICRO', 'Sienge', 'Excel Avançado', 'Curva ABC', 'BDI'],
    interest_area: 'Engenharia',
    desired_role: 'Engenheiro de Custos e Orçamentos',
    travel_availability: 'Ocasional (Visitas Técnicas)',
    driver_license: 'B',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'Superior Completo', course: 'Engenharia Civil', institution: 'UFMG', year: '2017', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Engenheiro Orçamentista Pleno', company: 'Construtora Barbosa Mello', period: '2020 - Atual', activities: 'Elaboração de propostas para obras de infraestrutura e mineração.' },
      { role: 'Analista de Custos Jr', company: 'MRV Engenharia', period: '2017 - 2020', activities: 'Composição de custos unitários e cotação com fornecedores.' }
    ],
    job_id: 9, // Engenheiro Custos
    pipeline_status: 800, // Placed (Contratado)
    status_history: [
      { from: 0, to: 100, daysAgo: 30, note: 'Inscrição' },
      { from: 100, to: 300, daysAgo: 24, note: 'Triagem técnica' },
      { from: 300, to: 500, daysAgo: 18, note: 'Entrevistas realizadas' },
      { from: 500, to: 600, daysAgo: 10, note: 'Proposta aceita pelo candidato' },
      { from: 600, to: 800, daysAgo: 2, note: 'Processo seletivo concluído - Contratado!' }
    ]
  },
  {
    first_name: 'Priscila',
    last_name: 'Zanetti Fontes',
    email: 'priscila.fontes@ael.dev',
    phone: '94994567890',
    city: 'Parauapebas',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/priscila-zanetti-fin',
    current_employer: 'Anglo American',
    desired_pay: 'R$ 7.500',
    can_relocate: 1,
    notes: 'Especialista em fechamento de custos e conciliação de contratos no SAP.',
    key_skills: ['Controladoria', 'SAP CO/FI', 'Variance Analysis', 'Power BI', 'Fechamento Contábil', 'Custos Industriais'],
    interest_area: 'Financeiro',
    desired_role: 'Analista de Controladoria e Custos de Projetos',
    travel_availability: 'Não possui',
    driver_license: 'B',
    experience_years: '3 a 5 anos',
    educations: [
      { level: 'Pós-Graduação / Especialização', course: 'Controladoria e Finanças Corporativas', institution: 'USP / ESALQ', year: '2021', status: 'Concluído' },
      { level: 'Superior Completo', course: 'Ciências Contábeis', institution: 'FUMEC', year: '2018', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Analista Financeira de Contratos', company: 'Anglo American', period: '2021 - Atual', activities: 'Acompanhamento de orçamento OPEX/CAPEX e análise de desvios físico-financeiros.' },
      { role: 'Auditora Contábil Jr', company: 'Deloitte Touche Tohmatsu', period: '2018 - 2021', activities: 'Auditoria externa em empresas dos setores de construção pesada e energia.' }
    ],
    job_id: 10, // Analista Controladoria
    pipeline_status: 200, // Contacted (Contactado)
    status_history: [
      { from: 0, to: 100, daysAgo: 5, note: 'Inscrição no portal' },
      { from: 100, to: 200, daysAgo: 1, note: 'Contato telefônico realizado para agendar triagem' }
    ]
  },
  {
    first_name: 'Waldir',
    last_name: 'dos Santos Queiroz',
    email: 'waldir.queiroz@ael.dev',
    phone: '94995678901',
    city: 'Canaã dos Carajás',
    state: 'PA',
    linkedin: '',
    current_employer: 'Sotreq CAT',
    desired_pay: 'R$ 4.800',
    can_relocate: 0,
    notes: 'Mecânico especialista em sistemas hidráulicos e motores diesel Caterpillar e Komatsu.',
    key_skills: ['Mecânica Pesada', 'Caterpillar', 'Komatsu', 'Hidráulica', 'Motores Diesel', 'Diagnóstico Eletrônico'],
    interest_area: 'Operacional',
    desired_role: 'Mecânico de Equipamentos Pesados',
    travel_availability: 'Estadual (Pará)',
    driver_license: 'D',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'Técnico', course: 'Técnico em Manutenção de Máquinas Pesadas', institution: 'SENAI Canaã dos Carajás', year: '2016', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Mecânico de Campo III', company: 'Sotreq S.A. (Caterpillar)', period: '2019 - Atual', activities: 'Manutenção de escavadeiras hidráulicas 390D e tratores D11T em mineração.' },
      { role: 'Mecânico de Oficina', company: 'Komatsu do Brasil', period: '2016 - 2019', activities: 'Revisão de motores, transmissões e bombas de pistão.' }
    ],
    job_id: 11, // Mecânico
    pipeline_status: 100, // No Contact (Novo)
    status_history: [
      { from: 0, to: 100, daysAgo: 2, note: 'Candidatura recebida no portal' }
    ]
  },
  {
    first_name: 'Larissa',
    last_name: 'Vasconcelos Ramos',
    email: 'larissa.ramos@ael.dev',
    phone: '94996789012',
    city: 'Parauapebas',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/larissa-vasconcelos-ambiental',
    current_employer: 'Arcadis Brasil',
    desired_pay: 'R$ 7.000',
    can_relocate: 1,
    notes: 'Profissional proativa cadastrada no Banco de Talentos Geral da A&L para oportunidades futuras.',
    key_skills: ['Licenciamento Ambiental', 'EIA/RIMA', 'QGIS', 'Gestão de Resíduos', 'Outorgas Hídricas', 'Auditoria Ambiental'],
    interest_area: 'Engenharia',
    desired_role: 'Engenheira Ambiental / Especialista em Licenciamento',
    travel_availability: 'Total (Qualquer região)',
    driver_license: 'B',
    experience_years: '3 a 5 anos',
    educations: [
      { level: 'Superior Completo', course: 'Engenharia Ambiental', institution: 'Universidade Federal de Viçosa (UFV)', year: '2020', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Consultora Ambiental Pleno', company: 'Arcadis Brasil', period: '2021 - Atual', activities: 'Estudos de impacto ambiental e monitoramento de programas de mitigação em Carajás.' }
    ],
    job_id: null, // Apenas Banco de Talentos
    pipeline_status: null,
    status_history: []
  },
  {
    first_name: 'Thiago',
    last_name: 'Albuquerque Meireles',
    email: 'thiago.meireles@ael.dev',
    phone: '94997890123',
    city: 'Marabá',
    state: 'PA',
    linkedin: 'https://linkedin.com/in/thiago-meireles-automacao',
    current_employer: 'Albras Alumínio do Brasil',
    desired_pay: 'R$ 8.500',
    can_relocate: 1,
    notes: 'Especialista em automação industrial, inversores de frequência e redes industriais.',
    key_skills: ['CLP Rockwell / Siemens', 'SCADA', 'Redes Profinet/Modbus', 'Instrumentação', 'Subestações', 'Automação'],
    interest_area: 'Operacional',
    desired_role: 'Supervisor de Manutenção Elétrica / Automação',
    travel_availability: 'Total (Qualquer região)',
    driver_license: 'B',
    experience_years: 'Mais de 5 anos',
    educations: [
      { level: 'Superior Completo', course: 'Engenharia de Controle e Automação', institution: 'IFPA Campus Marabá', year: '2018', status: 'Concluído' }
    ],
    experiences: [
      { role: 'Engenheiro de Automação Industrial', company: 'Albras Alumínio Brasileiro', period: '2020 - Atual', activities: 'Programação de CLPs Siemens S7-1500 e supervisão de redes de instrumentação.' },
      { role: 'Técnico de Automação', company: 'Siemens Brasil', period: '2016 - 2020', activities: 'Comissionamento e start-up de painéis elétricos industriais.' }
    ],
    job_id: null, // Apenas Banco de Talentos
    pipeline_status: null,
    status_history: []
  }
]

async function seedCandidates() {
  console.log('======================================================================')
  console.log('POVOANDO CANDIDATOS RICOS, BANCO DE TALENTOS & PIPELINE DE SELEÇÃO')
  console.log('======================================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  try {
    let createdCount = 0
    let appsCount = 0

    for (const cand of candidatesSeed) {
      await conn.beginTransaction()

      const cleanEmail = cand.email.trim().toLowerCase()

      // Verifica se o candidato já existe
      const [existing] = await conn.query(
        'SELECT candidate_id FROM candidate WHERE email1 = ?',
        [cleanEmail]
      )

      let candidateId

      if (existing.length > 0) {
        candidateId = existing[0].candidate_id
        await conn.query(
          `UPDATE candidate SET
            first_name = ?,
            last_name = ?,
            phone_cell = ?,
            city = ?,
            state = ?,
            web_site = ?,
            current_employer = ?,
            desired_pay = ?,
            can_relocate = ?,
            notes = ?,
            key_skills = ?,
            date_modified = NOW()
          WHERE candidate_id = ?`,
          [
            cand.first_name,
            cand.last_name,
            cand.phone,
            cand.city,
            cand.state,
            cand.linkedin || null,
            cand.current_employer,
            cand.desired_pay,
            cand.can_relocate,
            cand.notes,
            cand.key_skills.join(', '),
            candidateId
          ]
        )
      } else {
        const [res] = await conn.query(
          `INSERT INTO candidate (
            first_name, last_name, email1, phone_cell,
            city, state, web_site, current_employer,
            desired_pay, can_relocate, notes, key_skills,
            source, is_active, date_created, date_modified, entered_by, owner
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Banco de Talentos A&L', 1, NOW(), NOW(), 1, 1)`,
          [
            cand.first_name,
            cand.last_name,
            cleanEmail,
            cand.phone,
            cand.city,
            cand.state,
            cand.linkedin || null,
            cand.current_employer,
            cand.desired_pay,
            cand.can_relocate,
            cand.notes,
            cand.key_skills.join(', ')
          ]
        )
        candidateId = res.insertId
      }

      // 1. Extra Fields
      const primaryEdu = cand.educations[0] || {}
      const extraFieldsMap = {
        'Area de Interesse': cand.interest_area,
        'Cargo Desejado': cand.desired_role,
        'Disponibilidade para Viagens': cand.travel_availability,
        'CNH': cand.driver_license,
        'Escolaridade': primaryEdu.level || null,
        'Curso': primaryEdu.course || null,
        'Instituicao de Ensino': primaryEdu.institution || null,
        'Ano de Conclusao': primaryEdu.year || null,
        'Tempo de Experiencia': cand.experience_years,
        'Ultimo Cargo': cand.experiences[0]?.role || null,
        'Formacao Academica': JSON.stringify(cand.educations),
        'Historico Profissional': JSON.stringify(cand.experiences),
        'Consentimento LGPD': `Autorizado em ${new Date().toLocaleString('pt-BR')} (IP: 127.0.0.1)`
      }

      for (const [field, val] of Object.entries(extraFieldsMap)) {
        if (val !== null && val !== undefined) {
          await conn.query(
            'DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100 AND field_name = ?',
            [candidateId, field]
          )
          await conn.query(
            'INSERT INTO extra_field (data_item_id, field_name, value, import_id, data_item_type) VALUES (?, ?, ?, 0, 100)',
            [candidateId, field, String(val)]
          )
        }
      }

      // 2. Candidate Auth (Senha padrão segura para testes: `candidato123`)
      const passwordHash = hashPassword('candidato123')
      const [authCheck] = await conn.query('SELECT id FROM candidate_auth WHERE candidate_id = ?', [candidateId])
      if (authCheck.length > 0) {
        await conn.query(
          `UPDATE candidate_auth SET
            password_hash = ?,
            failed_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
           WHERE candidate_id = ?`,
          [passwordHash, candidateId]
        )
      } else {
        await conn.query(
          `INSERT INTO candidate_auth (candidate_id, password_hash, failed_attempts, created_at, updated_at)
           VALUES (?, ?, 0, NOW(), NOW())`,
          [candidateId, passwordHash]
        )
      }

      // 3. Candidatura e Histórico de Pipeline
      if (cand.job_id) {
        const [appCheck] = await conn.query(
          'SELECT candidate_joborder_id FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ?',
          [candidateId, cand.job_id]
        )

        let appId
        if (appCheck.length > 0) {
          appId = appCheck[0].candidate_joborder_id
          await conn.query(
            'UPDATE candidate_joborder SET status = ?, date_modified = NOW() WHERE candidate_joborder_id = ?',
            [cand.pipeline_status, appId]
          )
        } else {
          const [insApp] = await conn.query(
            `INSERT INTO candidate_joborder (
              candidate_id, joborder_id, status, added_by, date_created, date_modified
            ) VALUES (?, ?, ?, 1, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW())`,
            [candidateId, cand.job_id, cand.pipeline_status]
          )
          appId = insApp.insertId
          appsCount++
        }

        // Histórico de transições
        await conn.query(
          'DELETE FROM candidate_joborder_status_history WHERE candidate_id = ? AND joborder_id = ?',
          [candidateId, cand.job_id]
        )

        for (const h of cand.status_history) {
          await conn.query(
            `INSERT INTO candidate_joborder_status_history (
              candidate_id, joborder_id, date, status_from, status_to
            ) VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?)`,
            [candidateId, cand.job_id, h.daysAgo, h.from, h.to]
          )

          await conn.query(
            `INSERT INTO activity (
              data_item_type, data_item_id, joborder_id, entered_by,
              date_occurred, date_created, date_modified, type, notes
            ) VALUES (100, ?, ?, 1, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY), NOW(), 800, ?)`,
            [candidateId, cand.job_id, h.daysAgo, h.daysAgo, h.note]
          )
        }
      }

      await conn.commit()
      createdCount++
      console.log(`✅ [ID ${candidateId}] ${cand.first_name} ${cand.last_name} (${cand.desired_role}) ${cand.job_id ? '-> Vaga #' + cand.job_id + ' (Status: ' + cand.pipeline_status + ')' : '(Banco de Talentos)'}`)
    }

    console.log(`\n🎉 Finalizado com sucesso!`)
    console.log(`Total de perfis criados/atualizados: ${createdCount}`)
    console.log(`Total de candidaturas ativas no pipeline: ${appsCount}`)

  } catch (err) {
    await conn.rollback()
    console.error('❌ Erro no seed de candidatos:', err)
  } finally {
    conn.release()
    process.exit(0)
  }
}

seedCandidates().catch(console.error)
