# Arquitetura Técnica — A&L Talent + OpenCATS

Este documento descreve a arquitetura estrutural do sistema **A&L Talent**, explicando a divisão entre camadas, padrões de integração com o **OpenCATS**, esquema de banco de dados, ciclo de vida de candidaturas e autenticação.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura em camadas de alta performance e desacoplamento:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                   PORTAL DO CANDIDATO & PAINEL DO RH                    │
│                     (Vite + Vanilla JS SPA / CSS Tokens)                 │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP / REST APIs
┌────────────────────────────────────▼─────────────────────────────────────┐
│                    API BACKEND & ADAPTER (Node.js / Express)            │
│  - Middleware de Segurança & Rate Limit (express-rate-limit)             │
│  - Autenticação Scrypt (candidate_auth) & Bcrypt (user)                  │
│  - Upload Sanitizer & Multer Handler                                     │
│  - Helpers Padronizados & Transações Atômicas                            │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ MySQL2 Pool Connection
┌────────────────────────────────────▼─────────────────────────────────────┐
│                       BANCO DE DADOS MARIADB (cats)                      │
│  ┌───────────────────────┐                    ┌──────────────────────┐  │
│  │   TABELAS OPENCATS    │                    │ TABELAS CUSTOMIZADAS │  │
│  │  - candidate          │                    │  - candidate_auth    │  │
│  │  - joborder           │◄─── FK (1:1) ───── │    (Scrypt / Salt)   │  │
│  │  - candidate_joborder │                    └──────────────────────┘  │
│  │  - status_history     │                                              │
│  │  - extra_field        │                                              │
│  │  - attachment         │                                              │
│  │  - activity           │                                              │
│  └───────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Separação de Responsabilidades e Banco de Dados

### 2.1 Dados de Recrutamento (Nativos OpenCATS)
* **`candidate`**: Dados cadastrais básicos (nome, e-mail, celular, cidade, estado, empresa atual, remuneração pretendida, notas).
* **`joborder`**: Descrição das vagas, status de publicação (*Active-Share*, *On Hold*, *Closed*), departamento e cidade/estado.
* **`candidate_joborder`**: Associação formal entre candidato e vaga com status atual do pipeline.
* **`candidate_joborder_status_history`**: Rastreabilidade histórica de todas as mudanças de fase no funil de seleção.
* **`extra_field`**: Metadados adicionais do candidato (Área de interesse, Cargo desejado, Disponibilidade para viagens, CNH, Formação acadêmica em JSON, Histórico profissional em JSON e Consentimento LGPD).
* **`attachment`**: Metadados de arquivos de currículo enviados (`data_item_type = 100`).
* **`activity`**: Registro cronológico de interações, anotações do RH e movimentações.

### 2.2 Dados de Credenciais & Segurança (`candidate_auth`)
Para evitar a poluição das tabelas nativas do OpenCATS e garantir conformidade com padrões modernos de cibersegurança, as credenciais residem exclusivamente na tabela customizada `candidate_auth`:
* `candidate_id` (`INT(11)` UNIQUE FK com `ON DELETE CASCADE`)
* `password_hash` (`VARCHAR(255)` — Formato `<salt_hex>:<scrypt_hash_hex>`)
* `failed_attempts` (`INT(11)` — Contador para proteção contra força bruta)
* `locked_until` (`DATETIME` — Bloqueio temporário de 15 minutos após 5 falhas consecutivas)
* `last_login` (`DATETIME` — Timestamp de último acesso bem-sucedido)
* `password_changed_at` (`DATETIME` — Data da última alteração de senha)
* `reset_token_hash` (`VARCHAR(64)` — Hash SHA-256 de token de recuperação temporário de 15 minutos)

---

## 3. Mapeamento Canônico de Status do Pipeline

| Código | Label OpenCATS | Label Painel RH | Label Portal do Candidato |
| :---: | :--- | :--- | :--- |
| **100** | No Contact | Novo / Recebido | Candidatura Recebida |
| **200** | Contacted | Contactado | Em Análise Inicial |
| **250** | Candidate Responded | Candidato Respondeu | Em Análise Inicial |
| **300** | Qualifying | Em Triagem | Em Triagem Técnica |
| **400** | Submitted | Enviado ao Gestor | Em Avaliação pela Gestão |
| **500** | Interviewing | Entrevista | Entrevista Agendada |
| **600** | Offered | Aprovado / Proposta | Proposta em Andamento |
| **650** | Passed On | Banco de Talentos / Futuro | Banco de Talentos |
| **675** | Candidate Declined | Desistiu | Processo Encerrado |
| **700** | Rejected | Não Selecionado | Processo Encerrado |
| **800** | Placed | Contratado | Contratado |
