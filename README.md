# A&L Talent — Plataforma de Seleção & Banco de Talentos

Sistema oficial de Atração, Recrutamento & Seleção da **A&L Engenharia**, combinando um **Portal de Carreiras Moderno (Vite + Vanilla JS)** com a solidez e integridade relacional do **OpenCATS (MariaDB)**.

> **Diretriz de Arquitetura:** *"A&L Talent por fora, OpenCATS por dentro."*

---

## 📖 Sobre o Projeto

O **A&L Talent** é a solução unificada de recrutamento da A&L Engenharia. A plataforma oferece aos candidatos uma experiência fluida, responsiva e acessível para candidatura e acompanhamento de processos seletivos, enquanto disponibiliza à equipe de Recursos Humanos um painel completo para gestão de vagas, triagem de candidatos, busca estruturada no Banco de Talentos e distribuição de oportunidades.

---

## 🏛️ Arquitetura

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       PORTAL DE CARREIRAS (SPA)                         │
│  - Mural de Vagas Públicas (http://localhost:5173/#/jobs)               │
│  - Banco de Talentos em 6 Etapas (http://localhost:5173/#/talent-pool) │
│  - Área do Candidato (http://localhost:5173/#/candidato)                │
│  - Painel do RH & Triagem (http://localhost:5173/#/admin)               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (JSON)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API BACKEND (NODE.JS / EXPRESS)                      │
│  - Autenticação Scrypt (Candidatos) & Bcrypt (Recrutadores RH)          │
│  - Limite de Requisições (Rate Limit) e Cooldown de 60s                 │
│  - E-mail Transacional Brevo SMTP com Retentativa e Sanitização CRLF   │
│  - Upload Sanitizado de Currículos & Prevenção de Path Traversal        │
│  - Helpers Padronizados & Transações Atômicas                           │
│  Porta: 3001                                                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Conexão Pool MariaDB
┌────────────────────────────────────▼────────────────────────────────────┐
│                    BANCO DE DADOS MARIADB (cats)                        │
│  - Tabelas OpenCATS: candidate, joborder, candidate_joborder, attachment│
│  - Tabela Customizada: candidate_auth (credenciais e tokens isolados)   │
│  - OpenCATS Legado (http://localhost:8000)                              │
│  - phpMyAdmin (http://localhost:8080)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias

- **Frontend**: JavaScript Vanilla (ES Modules), HTML5 Semântico, CSS3 Moderno (Design System A&L), Vite.
- **Backend**: Node.js, Express, MySQL2, Nodemailer.
- **E-mail Transacional**: Brevo (SMTP Relay autenticado).
- **Banco de Dados**: MariaDB 10.11 / OpenCATS ATS.
- **Qualidade & Testes**: Vitest, Playwright, Biome (Linter/Formatter).
- **Infraestrutura**: Docker, Docker Compose, Nginx Reverse Proxy.

---

## 🚀 Como Executar Localmente

### 1. Iniciar Banco de Dados e Containers
Na raiz do projeto (`ael-talent-starter`):
```bash
docker compose up -d
```

### 2. Iniciar API e Frontend
Na pasta `frontend`:
```bash
cd frontend
npm install
npm run dev:all
```
> O comando `npm run dev:all` inicia concorrentemente a API Express na porta `3001` e o Vite Dev Server na porta `5173`.

---

## 🌐 URLs de Acesso Local

| Módulo / Interface | URL | Credenciais / Notas |
| :--- | :--- | :--- |
| **Portal Público de Carreiras** | [http://localhost:5173/#/](http://localhost:5173/#/) | Mural de vagas abertas e candidaturas |
| **Banco de Talentos** | [http://localhost:5173/#/talent-pool](http://localhost:5173/#/talent-pool) | Cadastro estruturado em 6 etapas |
| **Área do Candidato** | [http://localhost:5173/#/candidato](http://localhost:5173/#/candidato) | Login, acompanhamento de etapas e perfil |
| **Painel Administrativo do RH** | [http://localhost:5173/#/admin](http://localhost:5173/#/admin) | Login inicial: `admin` / `admin` |
| **API Backend (Express)** | [http://localhost:3001/api/health](http://localhost:3001/api/health) | Verificação de integridade e status |
| **OpenCATS Clássico** | [http://localhost:8000](http://localhost:8000) | Painel legado do ATS |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | Acesso ao banco de dados `cats` |

---

## 🧪 Testes Automatizados

Para executar as suítes de validação automatizadas:

```bash
cd frontend

# Testes Unitários (Vitest)
npm run test:unit

# Testes de Homologação Operacional de Ponta a Ponta
npm run test:homologation

# Testes de Hardening e Segurança de Autenticação
npm run test:hardening

# Testes de Auditoria de Integração OpenCATS
npm run test:audit

# Testes de Backup e Restauração
npm run test:backup

# Executar Todas as Suítes de Teste
npm run test:all
```

---

## 📁 Estrutura de Pastas

```text
ael-talent-starter/
├── docs/                     # Documentação técnica e operacional
│   ├── AUDITORIA-ENGENHARIA.md
│   ├── QUALIDADE-ENGENHARIA.md
│   ├── PRONTIDAO-PRODUCAO.md
│   ├── CHECKLIST-PRODUCAO.md
│   ├── IMPLANTACAO.md
│   ├── BACKUP-RESTAURACAO.md
│   ├── EMAIL-TRANSACIONAL.md
│   ├── HOMOLOGACAO.md
│   ├── ARQUITETURA.md
│   └── PADRAO-IDIOMA.md
├── frontend/                 # Aplicação Web e API Node.js
│   ├── src/                  # Código-fonte SPA (Vite + Vanilla JS)
│   │   ├── components/       # Componentes reutilizáveis de interface
│   │   ├── pages/            # Páginas públicas e administrativas
│   │   ├── styles/           # Design System, tokens e CSS global
│   │   └── api.js            # Cliente HTTP centralizado
│   ├── server/               # API REST Express
│   │   ├── auth/             # Autenticação, rate limiting e tokens
│   │   ├── email/            # Serviço transacional Brevo e templates
│   │   └── routes/           # Rotas da API
│   └── test/                 # Suítes de testes unitários e de integração
├── opencats/                 # Instalação do ATS OpenCATS
├── scripts/                  # Scripts operacionais e utilitários CLI
└── docker-compose.yml        # Orquestração de containers locais
```

---

## 👥 Banco de Talentos

O formulário do Banco de Talentos organiza a coleta de informações dos candidatos em 6 etapas:
1. **Identificação Pessoal & Contato**: Nome, e-mail, telefone/WhatsApp, CPF, data de nascimento e gênero.
2. **Endereço**: CEP com autopreenchimento, logradouro, número, bairro, cidade e estado.
3. **Área de Interesse & Pretensão**: Departamento/área desejada, cargo de interesse, disponibilidade e pretensão salarial.
4. **Formação Acadêmica & Idiomas**: Grau de escolaridade, curso, instituição e nível de idiomas.
5. **Histórico Profissional**: Última empresa, cargo ocupado, período de atuação e principais atividades.
6. **Competências, Currículo & Senha**: Habilidades técnicas, envio de currículo em PDF/DOCX e definição de senha de acesso.

---

## 🔄 Integração com OpenCATS

A integração preserva a integridade relacional do OpenCATS através das tabelas principais:
- `candidate`: Dados cadastrais e dados complementares via `extra_field`.
- `joborder`: Vagas cadastradas e seus respectivos recrutadores.
- `candidate_joborder`: Vínculos de candidaturas e etapas do processo seletivo.
- `attachment`: Currículos e documentos anexados.
- `candidate_auth`: Tabela isolada para hash seguro de senhas (`scrypt`) e tokens com validade temporária.

---

## 📧 E-mail Transacional (Brevo)

O serviço de e-mail transacional é operado via **Brevo SMTP Relay** (`smtp-relay.brevo.com:587`):
- **Recuperação de Senha**: Disparo de e-mail com link direto e código de 6 dígitos numéricos (validade de 15 minutos).
- **Primeiro Acesso**: Convite para ativação de perfil de candidatos cadastrados.
- **Proteção Anti-Abuso**: Cooldown obrigatório de 60 segundos entre solicitações consecutivas e sanitização contra Header Injection (CRLF).

Consulte o guia detalhado em [`docs/EMAIL-TRANSACIONAL.md`](docs/EMAIL-TRANSACIONAL.md).

---

## 💾 Backup e Restauração

Rotinas operacionais automatizadas para preservação de dados:
- **Backup**: `bash scripts/backup-production.sh` (gera dump compactado do banco MariaDB e diretório de uploads).
- **Restauração**: `bash scripts/restore-production.sh <arquivo_backup.tar.gz>` (restauração segura com verificação de integridade).

Consulte o runbook completo em [`docs/BACKUP-RESTAURACAO.md`](docs/BACKUP-RESTAURACAO.md).

---

## 📚 Documentação Técnica

* 📄 [Padrão de Idioma e Glossário Oficial](docs/PADRAO-IDIOMA.md)
* 📋 [Relatório de Homologação Operacional](docs/HOMOLOGACAO.md)
* 🔒 [Checklist de Prontidão para Produção](docs/CHECKLIST-PRODUCAO.md)
* 💾 [Guia de Backup e Restauração](docs/BACKUP-RESTAURACAO.md)
* 📧 [Guia de E-mail Transacional (Brevo)](docs/EMAIL-TRANSACIONAL.md)
* 🏛️ [Documentação de Arquitetura](docs/ARQUITETURA.md)
* 🚀 [Guia de Implantação em Produção](docs/IMPLANTACAO.md)
* 📊 [Relatório de Auditoria de Engenharia](docs/AUDITORIA-ENGENHARIA.md)
* ⚙️ [Critérios de Qualidade de Engenharia](docs/QUALIDADE-ENGENHARIA.md)
