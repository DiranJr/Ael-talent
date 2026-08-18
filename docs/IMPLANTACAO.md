# GUIA DE IMPLANTAÇÃO EM PRODUÇÃO (DEPLOYMENT RUNBOOK)
## A&L TALENT + OPENCATS

Este runbook descreve o procedimento operacional padrão para provisionar e colocar o sistema A&L Talent online em um servidor limpo **Debian 13 (Trixie)** ou **Ubuntu 24.04 LTS**.

---

## 1. PRÉ-REQUISITOS DO SERVIDOR

* Sistema Operacional: Debian 13 ou Ubuntu 24.04 LTS
* Acesso SSH com chave pública (login de root remoto desabilitado)
* Portas abertas no firewall: `22` (SSH), `80` (HTTP), `443` (HTTPS)
* Docker Engine & Docker Compose Plugin instalados
* Nginx e Certbot instalados no host

---

## 2. PREPARAÇÃO DO SERVIDOR & FIREWALL

### 2.1 Atualização de Pacotes e Instalação de Dependências
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx tar gzip
```

### 2.2 Configuração do Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
```

### 2.3 Criação do Usuário Operacional Dedicado
```bash
sudo adduser --disabled-password --gecos "" aeltalent
sudo usermod -aG docker aeltalent
sudo su - aeltalent
```

---

## 3. IMPLANTAÇÃO DA APLICAÇÃO

### 3.1 Clonagem do Repositório
```bash
git clone https://github.com/aelengenharia/ael-talent.git /var/www/ael-talent
cd /var/www/ael-talent
git checkout v1.0.0-rc1 # ou a release tag aprovada
```

### 3.2 Configuração de Variáveis de Ambiente
```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

> **Geração de Segredos Criptográficos:**
> ```bash
> openssl rand -hex 32 # Utilize para SESSION_SECRET
> openssl rand -hex 32 # Utilize para ADMIN_SESSION_SECRET
> openssl rand -base64 24 # Utilize para DB_PASS e DB_ROOT_PASS
> ```

### 3.3 Compilação do Frontend SPA
```bash
cd frontend
npm ci
npm run build
cd ..
```

### 3.4 Inicialização dos Containers de Produção
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3.5 Validação dos Containers e Healthchecks
```bash
docker compose -f docker-compose.prod.yml ps
```
*Verifique se todos os containers (`ael_api_prod`, `ael_db_prod`, `ael_web_prod`) estão no estado `Up (healthy)` ou `Up`.*

---

## 4. CONFIGURAÇÃO DO NGINX & CERTIFICADO SSL

### 4.1 Instalação da Configuração do Nginx
```bash
sudo cp nginx/ael-talent.conf /etc/nginx/sites-available/ael-talent.conf
# Substitua <DOMAIN> pelo domínio oficial (ex: carreiras.aelengenharia.com.br)
sudo sed -i 's/<DOMAIN>/carreiras.aelengenharia.com.br/g' /etc/nginx/sites-available/ael-talent.conf
sudo ln -sf /etc/nginx/sites-available/ael-talent.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2 Emissão do Certificado SSL (Let's Encrypt / Certbot)
```bash
sudo certbot --nginx -d carreiras.aelengenharia.com.br --non-interactive --agree-tos -m admin@aelengenharia.com.br
```

---

## 5. VALIDAÇÃO PÓS-DEPLOY (SMOKE TESTS)

Execute a suíte automatizada de smoke tests de produção:
```bash
node scripts/smoke-production.js https://carreiras.aelengenharia.com.br
```
Se todos os 7 testes retornarem `✅ APROVADO`, a aplicação está oficialmente online e operacional.

---

## 6. GUIA RÁPIDO PARA INCIDENTES (TROUBLESHOOTING)

### 6.1 Aplicação Fora do Ar ou Respondendo 502 / 503
```bash
# 1. Verificar status dos containers
docker compose -f docker-compose.prod.yml ps

# 2. Consultar logs de erro da API Express
docker compose -f docker-compose.prod.yml logs --tail=100 api

# 3. Consultar logs do banco de dados
docker compose -f docker-compose.prod.yml logs --tail=100 db

# 4. Testar o health check interno
curl -I http://127.0.0.1:3001/api/health

# 5. Reiniciar a stack com segurança
docker compose -f docker-compose.prod.yml restart
```

### 6.2 Verificação de Recursos do Sistema
```bash
# Espaço em disco
df -h

# Memória RAM disponível
free -h

# Uso de CPU por container
docker stats --no-stream
```
