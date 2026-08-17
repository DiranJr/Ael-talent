-- ================================================================
-- A&L Talent — Setup inicial do OpenCATS
-- ================================================================

-- 1. HABILITAR CAREER PORTAL (settings_type = 4)
DELETE FROM settings WHERE settings_type = 4;

INSERT INTO settings (setting, value, settings_type) VALUES
  ('enabled',               '1',         4),
  ('allowBrowse',           '1',         4),
  ('candidateRegistration', '0',         4),
  ('showDepartment',        '1',         4),
  ('showCompany',           '0',         4),
  ('activeBoard',           'CATS 2.0',  4),
  ('allowXMLSubmit',        '1',         4);

-- 2. CRIAR EMPRESA A&L ENGENHARIA
INSERT IGNORE INTO company (
  company_id, name, entered_by, owner,
  date_created, date_modified, is_hot
) VALUES (
  2, 'A&L Engenharia', 1, 1,
  NOW(), NOW(), 0
);

-- 3. CRIAR VAGA DE TESTE — Assistente Administrativo
INSERT INTO joborder (
  title,
  description,
  notes,
  type,
  status,
  is_hot,
  city,
  state,
  country,
  company_id,
  entered_by,
  owner,
  openings,
  openings_available,
  public,
  date_created,
  date_modified
) VALUES (
  'Assistente Administrativo',
  'Vaga fictícia criada exclusivamente para teste do A&L Talent.\n\nResponsabilidades:\n- Suporte às rotinas administrativas e operacionais\n- Controle e organização de documentos\n- Atendimento telefônico e presencial\n- Elaboração de relatórios e planilhas\n- Apoio à equipe de gestão\n\nRequisitos:\n- Ensino médio completo (desejável superior em andamento)\n- Experiência mínima de 1 ano em funções administrativas\n- Domínio do Pacote Office (Excel, Word, Outlook)\n- Boa comunicação oral e escrita\n- Organização e proatividade\n\nDiferenciais:\n- Experiência no setor de engenharia ou construção civil\n- Conhecimento em sistemas ERP\n- Superior completo em Administração ou áreas afins',
  'Vaga de teste — ambiente de desenvolvimento A&L Talent',
  'Full Time',
  'Active-Share',
  1,
  'Belo Horizonte',
  'MG',
  'BR',
  2,
  1,
  1,
  1,
  1,
  1,
  NOW(),
  NOW()
);

-- 4. CRIAR SEGUNDA VAGA — Técnico de Segurança do Trabalho
INSERT INTO joborder (
  title,
  description,
  notes,
  type,
  status,
  is_hot,
  city,
  state,
  country,
  company_id,
  entered_by,
  owner,
  openings,
  openings_available,
  public,
  date_created,
  date_modified
) VALUES (
  'Técnico de Segurança do Trabalho',
  'Atuação em campo com foco em prevenção de acidentes e conformidade com normas regulamentadoras.\n\nResponsabilidades:\n- Elaborar e implementar programas de prevenção de acidentes\n- Realizar inspeções e auditorias de segurança\n- Ministrar treinamentos de NR obrigatórias\n- Investigar e analisar acidentes de trabalho\n- Acompanhar a equipe em campo garantindo o uso de EPIs\n\nRequisitos:\n- Técnico em Segurança do Trabalho (registro no MTb)\n- Experiência mínima de 2 anos na área\n- Conhecimento das NRs, especialmente NR-6, NR-10, NR-35\n- Disponibilidade para trabalho em campo\n- CNH categoria B\n\nDiferenciais:\n- Experiência em mineração ou obras de infraestrutura\n- CIPA\n- Pós-graduação na área',
  'Vaga de teste — ambiente de desenvolvimento A&L Talent',
  'Full Time',
  'Active-Share',
  1,
  'Canaã dos Carajás',
  'PA',
  'BR',
  2,
  1,
  1,
  2,
  2,
  1,
  NOW(),
  NOW()
);

-- Verificação
SELECT
  'Career Portal Settings' as tipo,
  COUNT(*) as total
FROM settings WHERE settings_type = 4

UNION ALL

SELECT
  'Vagas Active-Share' as tipo,
  COUNT(*) as total
FROM joborder WHERE status = 'Active-Share';
