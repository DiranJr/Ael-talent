# Checklist Oficial de Pré-Produção & Deploy — A&L Talent

Este checklist detalha todos os pré-requisitos técnicos e de infraestrutura que devem ser seguidos antes da publicação do sistema em ambiente de produção oficial.

---

## 1. Infraestrutura & Rede
- [ ] **Domínio & DNS**: Configurar entrada DNS apontando para o servidor (ex: `carreiras.aelengenharia.com.br`).
- [ ] **Certificado SSL / HTTPS**: Instalação e renovação automática de certificado TLS (Let's Encrypt / Cloudflare) — HTTPS estritamente obrigatório para dados de candidatos e autenticação.
- [ ] **Proxy Reverso**: Configuração de Nginx ou Traefik roteando tráfego para a API (porta 3001) e estáticos do Vite.
- [ ] **Firewall & Portas**:
  - `443/TCP` (HTTPS público)
  - `80/TCP` (HTTP com redirecionamento para 443)
  - `3306/TCP` (MariaDB — **Acesso Interno/Privado apenas**)
  - `8080/TCP` (phpMyAdmin — **Bloqueado para a Internet ou com IP Whitelist / VPN interna**)
  - `8000/TCP` (OpenCATS Clássico — **Restrito a VPN ou rede interna da A&L**)

---

## 2. Configurações de Ambiente (`.env`)
- [ ] `NODE_ENV=production` ativado.
- [ ] `SESSION_SECRET` configurado com chave randômica forte de 32 bytes (`openssl rand -hex 32`).
- [ ] `ADMIN_SESSION_SECRET` configurado com chave randômica independente.
- [ ] `CORS_ORIGIN` configurado exclusivamente com os domínios corporativos permitidos.
- [ ] `DB_PASS` e `DB_ROOT_PASS` alterados para senhas complexas e seguras.
- [ ] Parâmetros SMTP de produção configurados (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).

---

## 3. Segurança & Proteção de Dados (LGPD)
- [ ] **Isolamento de Credenciais**: Garantido que senhas do candidato residam exclusivamente em `candidate_auth`.
- [ ] **Security Headers Ativos**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`.
- [ ] **Proteção de Uploads**: Diretório de anexos com permissões restritas de leitura e execução de scripts bloqueada (`.htaccess` ou diretiva Nginx `location /uploads { deny all; }`).
- [ ] **Rate Limiting Ativo**: Verificado funcionamento dos limitadores por IP contra ataques de força bruta em `/api/talent-pool/login` e `/api/admin/login`.

---

## 4. Banco de Dados & Armazenamento
- [ ] Execução das migrations versionadas (`scripts/001_initial_schema.sql`, `scripts/002_create_candidate_auth.sql`).
- [ ] Volume persistente montado para o MariaDB (`/var/lib/mysql`).
- [ ] Volume persistente montado para anexos de currículo (`/uploads`).
- [ ] Rotina de backup agendada (Cron job executando `mysqldump` diário).

---

## 5. Build & Operação da Aplicação
- [ ] Execução de `npm run build` gerando bundle otimizado em `frontend/dist/`.
- [ ] Process Manager (PM2 ou Docker Compose com restart policy `always`) configurado para o servidor Express.
- [ ] Health check monitorado em `GET /api/health`.
- [ ] Validação do checklist de uso operacional pelo time de Recursos Humanos.
