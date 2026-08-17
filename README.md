# A&L Talent — Portal de Carreiras, Banco de Talentos & Painel do RH

Sistema oficial de Atração, Recrutamento & Seleção da **A&L Engenharia**, combinando um **Portal de Carreiras Moderno (Vite + Vanilla JS)** com a solidez e transparência relacional do **OpenCATS (MariaDB)**.

> **Filosofia Arquitetural:** *"A&L Talent por fora, OpenCATS por dentro."*

---

## 🏛️ Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       PORTAL DE CARREIRAS (SPA)                         │
│  - Mural de Vagas Públicas (http://localhost:5173/#/jobs)               │
│  - Banco de Talentos em 6 Etapas (http://localhost:5173/#/talent-pool) │
│  - Área do Candidato com Login (http://localhost:5173/#/candidato)      │
│  - Painel do RH & Pipeline (http://localhost:5173/#/admin)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API BACKEND (NODE.JS / EXPRESS)                      │
│  - Autenticação Scrypt (candidate_auth) & Bcrypt RH (user)              │
│  - Rate Limiting, Lockout de 15m e Proteção contra Força Bruta          │
│  - Upload Sanitizado de Currículos & Prevenção de Path Traversal        │
│  - Helpers Padronizados & Transações Atômicas                           │
│  Porta: 3001                                                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ MySQL2 Pool
┌────────────────────────────────────▼────────────────────────────────────┐
│                    BANCO DE DADOS MARIADB (cats)                        │
│  - Tabelas OpenCATS: candidate, joborder, candidate_joborder, attachment│
│  - Tabela Customizada: candidate_auth (credenciais isoladas)            │
│  - OpenCATS Legado (http://localhost:8000)                              │
│  - phpMyAdmin (http://localhost:8080)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Executar Localmente

### 1. Iniciar Banco de Dados e Containers
Na raiz do projeto (`ael-talent-starter`):
```powershell
docker compose up -d
```

### 2. Iniciar API e Frontend
Na pasta `frontend`:
```powershell
cd frontend
npm install
npm run dev:all
```
> O comando `npm run dev:all` inicia concorrentemente a API Express na porta `3001` e o Vite Dev Server na porta `5173`.

---

## 🌐 URLs de Acesso Local

| Serviço | URL | Acesso / Notas |
| :--- | :--- | :--- |
| **Portal de Carreiras Público** | [http://localhost:5173/#/](http://localhost:5173/#/) | Mural de vagas abertas e candidaturas |
| **Banco de Talentos A&L** | [http://localhost:5173/#/talent-pool](http://localhost:5173/#/talent-pool) | Cadastro proativo em 6 etapas estruturadas |
| **Área do Candidato** | [http://localhost:5173/#/candidato](http://localhost:5173/#/candidato) | Login do candidato e acompanhamento de status |
| **Painel Administrativo do RH** | [http://localhost:5173/#/admin](http://localhost:5173/#/admin) | Login RH: `admin` / `admin` |
| **API Backend (Express)** | [http://localhost:3001/api/health](http://localhost:3001/api/health) | Endpoints REST e Health Check |
| **OpenCATS Legado** | [http://localhost:8000](http://localhost:8000) | Painel clássico: `admin` / `admin` |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | `ael_dev` / `ael_dev_2024` |

---

## 📚 Documentação Técnica de Pré-Produção

* 📋 [Relatório de Homologação Operacional](docs/HOMOLOGACAO.md)
* 🔒 [Checklist de Pré-Produção e Deploy](docs/PRODUCTION-CHECKLIST.md)
* 💾 [Guia de Backup e Restauração (Disaster Recovery)](docs/BACKUP-RESTORE.md)
* 🏛️ [Documentação de Arquitetura do Sistema](docs/ARCHITECTURE.md)
* 📌 [Backlog de Evoluções Futuras](docs/BACKLOG.md)

---

## 🧪 Baterias de Testes Automatizados

Para executar os testes de validação:

```bash
cd frontend

# Testes de Homologação Operacional de Ponta a Ponta
node test_homologation_suite.js

# Testes de Hardening e Segurança de Autenticação
node test_hardening_suite.js

# Testes de Auditoria de Integração e Compatibilidade OpenCATS
node test_audit_suite.js

# Teste de Integridade de Backup e Restauração
node test_backup_restore.js
```
