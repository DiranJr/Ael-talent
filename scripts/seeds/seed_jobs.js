/**
 * A&L Talent — Seed de Vagas Estruturadas para A&L Engenharia
 */

import { getDb } from './server/db.js'

const jobsToSeed = [
  {
    title: 'Engenheiro de Minas Sênior (Planejamento de Lavra)',
    department_id: 2, // Engenharia
    city: 'Parauapebas',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'A combinar (Compatível com o mercado)',
    openings: 2,
    is_hot: 1,
    description: `### Sobre a Vaga
A **A&L Engenharia** está buscando um **Engenheiro de Minas Sênior** para atuar na liderança e elaboração de planos de lavra de curto e médio prazo em projetos de grande porte no setor mínero-metalúrgico no Pará.

### Principais Responsabilidades
* Elaborar e acompanhar o sequenciamento de lavra e planos de produção mensal/trimestral.
* Realizar estudos de otimização de frota, cálculo de produtividade e dimensionamento de equipamentos.
* Interface técnica direta com equipes de geologia, topografia, meio ambiente e operação de mina.
* Gestão de KPIs de produtividade, custos operacionais e segurança operacional.

### Requisitos
* Graduação completa em **Engenharia de Minas** com registro ativo no CREA.
* Experiência sólida comprovada em mineração de grande porte (ferro, cobre ou bauxita).
* Domínio de softwares de mineração (Datamine, Vulcan, Deswik ou Whittle).
* Disponibilidade para residir em **Parauapebas/PA** ou atuar em escala de campo.

### O que Oferecemos
* Remuneração altamente atrativa e pacote completo de benefícios.
* Plano de Saúde e Odontológico Nacional (extensivo a dependentes).
* Vale Alimentação/Refeição, Transporte fretado e Seguro de Vida.
* Programa de Participação nos Resultados (PPR).`,
  },
  {
    title: 'Técnico em Segurança do Trabalho (Operações de Campo)',
    department_id: 4, // Segurança do Trabalho
    city: 'Canaã dos Carajás',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'R$ 4.500 - R$ 6.000',
    openings: 3,
    is_hot: 1,
    description: `### Sobre a Oportunidade
Procuramos **Técnicos em Segurança do Trabalho** comprometidos com a cultura de **Zero Danos** e excelência preventiva para atuar diretamente nas frentes operacionais da A&L Engenharia no projeto S11D / Canaã dos Carajás.

### Atribuições
* Inspeções diárias de frentes de serviço, liberação de atividades críticas (trabalho em altura, espaço confinado, içamento de cargas).
* Condução de Diálogos Diários de Segurança (DDS) e treinamentos de normas regulamentadoras (NR-10, NR-12, NR-22, NR-35).
* Acompanhamento de indicadores de segurança, investigação de incidentes e planos de ação corretiva.
* Auditoria de conformidade de EPIs e equipamentos operacionais.

### Requisitos
* Curso Técnico completo em **Segurança do Trabalho** com registro no MTE.
* CNH categoria B válida.
* Vivência sólida em obras de infraestrutura, mineração pesada ou montagem eletromecânica.
* Conhecimento aprofundado das NRs, especialmente NR-22 e NR-35.

### Benefícios
* Convênio Médico e Odontológico Bradesco Saúde.
* Vale Alimentação + Refeitório no local.
* Alojamento/Auxílio moradia (quando aplicável).
* Previdência Privada.`,
  },
  {
    title: 'Coordenador de Montagem Eletromecânica',
    department_id: 2, // Engenharia
    city: 'Parauapebas',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'Faixa Sênior / A combinar',
    openings: 1,
    is_hot: 1,
    description: `### Desafio da Posição
Liderar frentes multidisciplinares de montagem eletromecânica, tubulação industrial e estruturas metálicas em contratos industriais de alta complexidade.

### Responsabilidades
* Coordenação e supervisão direta de supervisores, encarregados e equipes operacionais de montagem.
* Gestão do cronograma físico-financeiro da obra e controle de avanço pelo método do valor agregado (EVM).
* Garantir o cumprimento rigoroso dos padrões de engenharia, qualidade (ISO 9001) e segurança operacional.
* Relacionamento institucional e alinhamento com a fiscalização do cliente.

### Requisitos
* Formação superior em **Engenharia Mecânica, Elétrica ou Civil**.
* Experiência comprovada em coordenação de montagens eletromecânicas industriais ou paradas de manutenção.
* Habilidade avançada em gestão de pessoas e resolução de conflitos de campo.
* Disponibilidade total para viagens e atuação em campo.`,
  },
  {
    title: 'Analista de Recursos Humanos Pleno (R&S e DHO)',
    department_id: 5, // Recursos Humanos
    city: 'Belo Horizonte',
    state: 'MG',
    type: 'CLT (Híbrido)',
    salary: 'R$ 5.000 - R$ 6.800',
    openings: 1,
    is_hot: 0,
    description: `### Sobre a Vaga
Integrar a equipe de Gente & Gestão da A&L no escritório corporativo de Belo Horizonte, conduzindo processos seletivos estratégicos e ações de desenvolvimento organizacional para as unidades do Norte e Sudeste.

### Responsabilidades
* Condução de ponta a ponta de processos seletivos para posições técnicas, operacionais e de liderança de engenharia.
* Atração e seleção por competências utilizando o ecossistema A&L Talent.
* Apoio na estruturação de programas de treinamento corporativo, integração de novos talentos e avaliações de desempenho.
* Gestão de indicadores de RH (Time-to-Fill, Turnover, Satisfação de Clientes Internos).

### Requisitos
* Ensino Superior completo em **Psicologia, Administração, Gestão de RH** ou áreas correlatas.
* Experiência anterior com recrutamento no segmento de Engenharia, Construção Pesada ou Mineração.
* Conhecimento em testes comportamentais (DISC, MBTI) e entrevistas estruturadas.
* Perfil proativo, consultivo e com forte comunicação interpessoal.

### Benefícios
* Modelo híbrido de trabalho (2 dias home office / 3 dias presencial).
* Cartão Flexível de Benefícios (Flash).
* Gympass / TotalPass.
* Seguro de Vida em grupo e Plano de Saúde SulAmérica.`,
  },
  {
    title: 'Supervisor de Terraplenagem e Infraestrutura',
    department_id: 3, // Operacional
    city: 'Marabá',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'R$ 7.000 - R$ 9.500',
    openings: 2,
    is_hot: 1,
    description: `### Oportunidade
Supervisionar frentes de terraplenagem, corte e aterro, drenagem superficial e profunda e pavimentação em obras viárias e industriais da A&L no sudeste do Pará.

### Atividades
* Planejar e direcionar a operação de escavadeiras, tratores de esteira, motoniveladoras e caminhões basculantes.
* Assegurar cumprimento de cotas topográficas, compactação e controle de qualidade geotécnico.
* Gestão da disciplina de campo, pontualidade, produtividade e conformidade de segurança.
* Acompanhar abastecimento, manutenção preventiva e disponibilidade mecânica dos equipamentos.

### Requisitos
* Ensino Médio completo ou formação técnica em Edificações/Construção Civil.
* Experiência consolidada em supervisão de terraplenagem pesada.
* CNH categoria B ou C.
* Liderança assertiva e vivência prática em obras no estado do Pará.`,
  },
  {
    title: 'Engenheiro de Custos e Orçamentos',
    department_id: 2, // Engenharia
    city: 'Belo Horizonte',
    state: 'MG',
    type: 'CLT (Híbrido)',
    salary: 'R$ 8.500 - R$ 11.500',
    openings: 1,
    is_hot: 0,
    description: `### Sobre a Vaga
Responsável pela elaboração de propostas técnico-comerciais, estimativas de custos de CAPEX/OPEX e composição de preços unitários (CPU) para concorrências públicas e privadas da A&L Engenharia.

### Atribuições
* Levantamento de quantitativos a partir de projetos executivos em CAD/BIM.
* Cotação de insumos, equipamentos e subcontratados no mercado nacional.
* Elaboração de BDI, curvas ABC de insumos e mão de obra, histogramas e fluxo de caixa de obras.
* Participação em reuniões de alinhamento com clientes e diretoria de novos negócios.

### Requisitos
* Graduação em **Engenharia Civil ou Engenharia de Produção**.
* Domínio de softwares de orçamentação (Volare, Sienge, Presto ou MS Excel avançado).
* Conhecimento sólido das tabelas de referência SINAPI, SICRO e bases privadas.
* Experiência prévia em orçamentos para mineração e infraestrutura.`,
  },
  {
    title: 'Analista de Controladoria e Custos de Projetos',
    department_id: 6, // Financeiro
    city: 'Parauapebas',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'R$ 6.000 - R$ 8.000',
    openings: 1,
    is_hot: 0,
    description: `### Desafio
Acompanhar e auditar a contabilidade de custos dos contratos da A&L Engenharia em Carajás, garantindo acuracidade contábil, controle de apropriação e previsibilidade financeira.

### Responsabilidades
* Fechamento mensal de custos por centro de custo e contrato.
* Análise de desvios entre Orçado vs. Realizado (Variance Analysis).
* Acompanhamento de medições de clientes e emissão de notas fiscais de serviços.
* Elaboração de relatórios gerenciais e apresentações para a gerência de contrato.

### Requisitos
* Superior completo em **Ciências Contábeis, Economia ou Administração**.
* Experiência prévia em controladoria de obras ou indústria pesada.
* Domínio de sistemas ERP (SAP, TOTVS Protheus ou Sienge).
* Conhecimento sólido em Excel / Power BI.`,
  },
  {
    title: 'Mecânico de Equipamentos Pesados (Linha Amarela)',
    department_id: 3, // Operacional
    city: 'Canaã dos Carajás',
    state: 'PA',
    type: 'CLT (Presencial)',
    salary: 'R$ 3.800 - R$ 5.200 + Periculosidade',
    openings: 4,
    is_hot: 1,
    description: `### Sobre a Função
Executar manutenções preventivas, corretivas e preditivas em equipamentos da Linha Amarela (escavadeiras CAT/Komatsu, pás carregadeiras, tratores de esteira e motoniveladoras).

### Atividades
* Diagnóstico de falhas em sistemas hidráulicos, pneumáticos, transmissões e motores a diesel (Cummins, Caterpillar, Volvo).
* Substituição de componentes de desgaste, material rodante e cilindros hidráulicos.
* Preenchimento de ordens de serviço (OS) e relatórios de apontamento mecânico.
* Cumprimento rigoroso dos procedimentos de bloqueio e etiquetagem (Lockout/Tagout).

### Requisitos
* Curso Técnico ou Profissionalizante em **Mecânica Diesel, Manutenção de Máquinas Pesadas** (SENAI ou equivalente).
* Experiência comprovada em carteira com manutenção de equipamentos pesados.
* Disponibilidade para atuar em turnos e escala de revezamento.
* Residir em Canaã dos Carajás ou Parauapebas.`,
  },
]

async function seedJobs() {
  console.log('====================================================')
  console.log('INSERINDO VAGAS ESTRUTURADAS NO BANCO A&L TALENT')
  console.log('====================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  try {
    let createdCount = 0

    for (const job of jobsToSeed) {
      // Verifica se já existe uma vaga com esse título exato
      const [existing] = await conn.query(
        'SELECT joborder_id FROM joborder WHERE title = ?',
        [job.title]
      )

      if (existing.length > 0) {
        console.log(`ℹ️ Vaga já existe: "${job.title}" (ID: ${existing[0].joborder_id})`)
        continue
      }

      await conn.beginTransaction()

      const [res] = await conn.query(`
        INSERT INTO joborder (
          recruiter, contact_id, company_id, entered_by, owner,
          title, description, notes, type, salary,
          status, is_hot, openings, openings_available,
          city, state, country, public, company_department_id,
          date_created, date_modified
        ) VALUES (
          1, 0, 2, 1, 1,
          ?, ?, 'Vaga cadastrada via Seed Oficial A&L Talent', ?, ?,
          'Active-Share', ?, ?, ?,
          ?, ?, 'BR', 1, ?,
          NOW(), NOW()
        )
      `, [
        job.title,
        job.description,
        job.type,
        job.salary,
        job.is_hot || 0,
        job.openings,
        job.openings,
        job.city,
        job.state,
        job.department_id,
      ])

      const jobId = res.insertId

      // Registra atividade no OpenCATS
      await conn.query(`
        INSERT INTO activity (
          data_item_id, data_item_type, joborder_id, type, notes, date_created, date_occurred, entered_by
        ) VALUES (?, 400, ?, 100, ?, NOW(), NOW(), 1)
      `, [
        jobId,
        jobId,
        `Vaga "${job.title}" publicada com sucesso no Portal A&L Talent.`
      ])

      await conn.commit()
      createdCount++
      console.log(`✅ [ID ${jobId}] Criada: "${job.title}" (${job.city}/${job.state})`)
    }

    const [totalRows] = await conn.query("SELECT COUNT(*) as total FROM joborder WHERE status = 'Active-Share' OR public = 1")
    console.log(`\n🎉 Processo concluído! Total de novas vagas criadas: ${createdCount}`)
    console.log(`📊 Total de vagas ativas no Portal A&L Talent: ${totalRows[0].total}`)

  } catch (err) {
    await conn.rollback()
    console.error('❌ Erro ao criar vagas:', err)
  } finally {
    conn.release()
    process.exit(0)
  }
}

seedJobs().catch(console.error)
