# A&L TALENT — CHECKLIST DE PRONTIDÃO PARA PRODUÇÃO
**Data:** 18 de Agosto de 2026  
**Status do Release:** Release Candidate (`v1.0.0-rc1`)  
**Arquitetura:** *A&L TALENT POR FORA, OPENCATS POR DENTRO.*

---

## 1. PRE-FLIGHT CHECKLIST (ANTES DE APONTAR DNS E ABRIR AO PÚBLICO)

### 1.1 CI, Qualidade de Código & Testes
- [x] **CI Verde:** Workflow do GitHub Actions configurado e homologado (`.github/workflows/ci.yml`).
- [x] **Lint & Formatação:** Biome validado sem nenhum erro (`npm run lint`).
- [x] **Testes Unitários:** 18/18 testes isolados com Vitest aprovados (`npm run test:unit`).
- [x] **Testes de Integração:** 39/39 testes com banco MariaDB OpenCATS aprovados (`npm run test:all`).
- [x] **Testes E2E (Playwright):** 4/4 specs de ponta a ponta aprovadas (`npm run test:e2e`).
- [x] **Smoke Tests de Produção:** 7/7 validações automáticas aprovadas (`npm run test:smoke`).
- [x] **Build Otimizado:** Build de produção do Vite compilado em ~340ms (`npm run build`).

---

### 1.2 Segurança, Secrets & Variáveis de Ambiente
- [x] **Template .env.production.example:** Criado e documentado sem credenciais reais versionadas.
- [x] **Exclusão no Git:** `.gitignore` e `frontend/.gitignore` bloqueiam `.env`, `.env.production`, etc.
- [x] **Validação Fail-Fast:** Servidor Express encerra o processo se `SESSION_SECRET` ou `ADMIN_SESSION_SECRET` forem fracos ou padrão.
- [x] **Chaves Criptográficas:** Geração documentada com `openssl rand -hex 32` (mínimo 32 bytes).
- [x] **Usuário do Banco:** Uso de usuário com privilégios restritos (`ael_prod`), sem conexão direta como `root`.
- [x] **Sanitização de Erros:** Erros em produção nunca revelam stack traces, paths do servidor ou queries SQL.

---

### 1.3 Infraestrutura, Rede & Portas
- [x] **Isolamento de Portas:** Apenas portas 80 (HTTP) e 443 (HTTPS) expostas externamente.
- [x] **Serviços Internos Ocultos:** Portas 3001 (Express), 3306 (MariaDB), 8000 (OpenCATS) e 8080 (phpMyAdmin) restritas a loopback / rede Docker privada `ael_prod_net`.
- [x] **Imagens Fixas:** `node:20-alpine`, `mariadb:10.11` (sem uso de tag `latest`).
- [x] **Restart Policies:** Configuração de `restart: unless-stopped` em todos os serviços essenciais.
- [x] **Health Checks:** Healthcheck nativo no MariaDB (`healthcheck.sh`) e na API Express (`/api/health`).
- [x] **Log Rotation:** Driver `json-file` limitado a `max-size: 10m` e `max-file: 5`.

---

### 1.4 Nginx, SSL & Headers
- [x] **Proxy Reverso:** Nginx configurado para servir SPA estático em `/` e proxy para `/api/`.
- [x] **Certbot / ACME:** Suporte configurado para desafio `/.well-known/acme-challenge/`.
- [x] **Redirecionamento HTTPS:** Redirecionamento 301 automático de HTTP para HTTPS.
- [x] **Protocolos TLS:** Suporte restrito a TLS 1.2 e TLS 1.3 com ciphers modernos.
- [x] **Security Headers:** `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` e CSP habilitados.
- [x] **Propagação de Headers:** `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` e `X-Request-ID` encaminhados ao Express.
- [x] **Trust Proxy:** `app.set('trust proxy', 1)` ativo para identificação correta de IP no rate limit.

---

### 1.5 Persistência, Uploads, Backup & Disaster Recovery
- [x] **Volumes Persistentes:** Volumes nomeados `ael_mariadb_data` e `ael_uploads_data`.
- [x] **Scripts de Backup:** `scripts/backup-production.sh` gerando dump SQL + pacote de uploads compactados com hash SHA-256.
- [x] **Scripts de Restore:** `scripts/restore-production.sh` com validação de integridade e confirmação interativa.
- [x] **Teste de Restauração:** Validado via `scripts/test_backup_restore.js` com 100% de integridade nos registros.
- [x] **Retenção de Backups:** Política automática de expiração de 7 dias para dumps diários.

---

### 1.6 Procedimento de Rollback
- [x] **Rollback de Aplicação:** Procedimento documentado de retorno de commit/tag com reinício limpo de containers.
- [x] **Rollback de Banco:** Procedimento de restauração de snapshot antes de migrações estruturais.
