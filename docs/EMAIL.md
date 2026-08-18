# A&L Talent — Documentação de E-mails Transacionais (Brevo)

> **Provedor Oficial:** Brevo (antigo Sendinblue)  
> **Protocolo:** SMTP Relay TLS (`smtp-relay.brevo.com:587`)  
> **Filosofia:** *A&L Talent por fora, OpenCATS por dentro.*

---

## 1. Visão Geral & Arquitetura

O sistema **A&L Talent** utiliza o **Brevo** como seu provedor oficial e exclusivo para o envio de e-mails transacionais. Toda a lógica de comunicação por e-mail é centralizada no módulo [`frontend/server/email/`](file:///c:/Users/Diran.junior.AEL0/Documents/ael-talent-starter/ael-talent-starter/frontend/server/email):

```text
frontend/server/email/
├── transporter.js     # Conexão SMTP Brevo, timeouts (10s), mock em memória e health check
├── templates.js       # Templates HTML e Texto responsivos (Recuperação de Senha, Primeiro Acesso)
├── sendEmail.js       # Sanitização de cabeçalhos (anti-CRLF), retry automático e safe logging
└── index.js           # Re-exports limpos para as rotas da aplicação
```

### Matriz de Ambientes

| Ambiente | Provedor / Modo | Comportamento |
| :--- | :--- | :--- |
| **Produção (`production`)** | **Brevo SMTP Relay** | Dispara e-mails reais via `smtp-relay.brevo.com:587`. Tokens **nunca** aparecem no payload HTTP. |
| **Desenvolvimento (`development`)** | **Log / Mock Interceptado** | Se SMTP não estiver configurado, exibe os dados no terminal e emite toast de auxílio local. |
| **Testes Unitários & CI (`test`)** | **In-Memory Mock** | Transporter em memória (`TEST_EMAIL_MODE=mock`). 0 chamadas externas e 0 dependência de rede. |

---

## 2. Passo a Passo de Configuração no Brevo

Para habilitar o envio real em produção:

1. **Crie uma conta** no [Brevo (brevo.com)](https://www.brevo.com/).
2. **Validação de Remetente & Domínio:**
   - Acesse *Senders & IP* e cadastre o remetente oficial: `carreiras@aelengenharia.com.br`.
   - Configure os registros DNS (SPF, DKIM e DMARC) no seu provedor de domínio para garantir entregabilidade máxima na caixa de entrada (evitando a pasta de spam).
3. **Gerar Credenciais SMTP:**
   - Acesse *Configurações > SMTP & API > SMTP*.
   - Clique em **Gerar nova chave SMTP** (Master Password).
   - Anote o **Login SMTP** e a **Chave/Senha gerada**.
4. **Configurar no Servidor (`.env.production`):**
   - Preencha as variáveis conforme a seção abaixo.
5. **Validar Conectividade:**
   - Execute o comando de teste manual:
     ```bash
     EMAIL_TEST_TO=seu-email@dominio.com npm run email:test
     ```

---

## 3. Variáveis de Ambiente

As seguintes variáveis controlam o serviço de e-mail e devem ser configuradas no arquivo `.env` (ou `.env.production`):

```env
# ─── SERVIÇO DE E-MAIL TRANSACIONAL (BREVO SMTP RELAY) ────────────────────────
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_login_smtp_brevo@exemplo.com
SMTP_PASS=sua_master_key_smtp_brevo
SMTP_FROM=carreiras@aelengenharia.com.br
SMTP_FROM_NAME="A&L Talent"
SMTP_REPLY_TO=rh@aelengenharia.com.br

# ─── URL BASE DA APLICAÇÃO (USADA NOS LINKS DE E-MAIL) ────────────────────────
APP_URL=https://carreiras.aelengenharia.com.br
```

---

## 4. Fluxos de E-mail Transacional

### 4.1. Recuperação de Senha (`/api/talent-pool/forgot-password`)
1. O candidato informa seu e-mail na tela de login.
2. A API localiza o candidato e gera um token aleatório criptográfico (e um código de 6 dígitos numéricos).
3. **Apenas o hash SHA-256 do token é armazenado no banco** (`candidate_auth.reset_token_hash`) com validade estrita de **15 minutos**.
4. O Brevo envia o e-mail contendo:
   - Botão direto: `${APP_URL}/#/reset-password?token=<TOKEN_ENCODED>`
   - Código numérico de 6 dígitos para digitação manual no formulário.
5. Ao submeter a nova senha em `POST /api/talent-pool/reset-password`:
   - O backend valida o hash do token e a expiração.
   - Atualiza a senha usando hash `scrypt`.
   - **Invalida imediatamente o token** (`reset_token_hash = NULL`), impedindo qualquer ataque de repetição (*Replay Attack*).
   - Autentica o candidato automaticamente no painel.

### 4.2. Primeiro Acesso (`/api/talent-pool/first-access`)
- Para candidatos legados ou cadastrados pelo RH que ainda não possuem senha criada, o sistema envia o e-mail de **Primeiro Acesso**, permitindo que ativem sua conta e definam sua senha inicial com segurança.

---

## 5. Práticas de Segurança & LGPD

* **Anti-Enumeração de Contas:** As rotas `/forgot-password` e `/first-access` sempre retornam uma mensagem genérica de sucesso (`"Se o e-mail informado estiver cadastrado em nossa base, as instruções foram enviadas."`), sem revelar se o e-mail existe ou não.
* **Sanitização de Cabeçalhos (Anti-CRLF Injection):** Todos os valores (`to`, `subject`, `from`, `replyTo`) são sanitizados contra caracteres `\r`, `\n` e `\t` (CWE-93).
* **Safe Logging (LGPD Compliance):** Os logs registram apenas `{ event: 'email_send', template, to: 'ca******o@dominio.com', status, duration_ms }`. **Nenhum token, senha, link completo ou dado sensível é gravado nos logs.**
* **Rate Limiting & Anti-Abuso:** Proteção com `express-rate-limit` limitando solicitações por IP e janela de tempo.
* **Resiliência:** Timeout de conexão de 10 segundos e 1 retry automático com backoff para falhas de rede transitórias.

---

## 6. Comandos e Testes

```bash
# Rodar testes unitários isolados do módulo de e-mail (Vitest Mock)
npm run test:email

# Rodar todos os testes unitários da aplicação
npm run test:unit

# Disparar teste manual real para a Brevo (apenas quando solicitado)
EMAIL_TEST_TO=seu-email@dominio.com npm run email:test
```

---

## 7. Troubleshooting

| Sintoma | Causa Mais Comum | Solução |
| :--- | :--- | :--- |
| `535 Authentication failed` | `SMTP_USER` ou `SMTP_PASS` incorretos. | Gere uma nova Master Key SMTP no painel da Brevo em *SMTP & API*. |
| `ETIMEDOUT / ECONNREFUSED` | Bloqueio de porta no firewall/provedor. | Verifique se a porta `587` de saída está liberada no servidor. |
| E-mail cai na caixa de Spam | Domínio sem autenticação DNS. | Configure os registros TXT para SPF e DKIM no DNS do domínio `aelengenharia.com.br`. |
| Limite diário atingido | Plano gratuito Brevo atingiu 300 envios/dia. | Faça upgrade para o plano Starter/Business da Brevo conforme volume do RH. |
