# Guia Prático de Deploy em Produção — Debian 13 (Trixie)
## Domínio: aelengenharia.com.br (ex: carreiras.aelengenharia.com.br)

Este guia contém todos os comandos necessários para provisionar uma VPS limpa com **Debian 13**, instalar os pré-requisitos, configurar o proxy reverso Nginx, emitir o certificado SSL HTTPS e inicializar a aplicação.

---

## 1. Apontamento DNS (Antes do Servidor)

No painel de gerenciamento do domínio `aelengenharia.com.br` (ex: Registro.br, Cloudflare, etc.):
* **Tipo**: `A`
* **Nome / Host**: `carreiras` (ou `talentos`)
* **Valor / Destino**: `IP_PUBLICO_DA_SUA_VPS`
* **TTL**: `3600`

---

## 2. Preparação da VPS Debian 13

Acesse a VPS via SSH como `root` e execute a atualização inicial:

```bash
# 1. Atualização de pacotes do Debian 13
apt update && apt upgrade -y

# 2. Instalação de utilitários básicos e Nginx
apt install -y curl wget git ufw nginx certbot python3-certbot-nginx nodejs npm

# 3. Instalação do Docker e Docker Compose no Debian
apt install -y docker.io docker-compose-v2
systemctl enable --now docker
systemctl enable --now nginx
```

---

## 3. Configuração do Firewall (UFW)

Para blindar o servidor e manter em sigilo as portas internas do banco e administração:

```bash
# Permitir apenas SSH, HTTP e HTTPS
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar Firewall
ufw enable
```

---

## 4. Clonagem e Configuração do Projeto

```bash
# 1. Criar pasta da aplicação
mkdir -p /var/www/ael-talent
cd /var/www/ael-talent

# 2. Clonar o repositório Git
git clone https://github.com/SEU_USUARIO/ael-talent.git .

# 3. Configurar variáveis de ambiente de produção
cp .env.example .env
nano .env
```

> **Dica**: No `.env`, gere senhas e segredos fortes:
> ```bash
> # Gerar chaves aleatórias de 32 bytes para SESSION_SECRET
> openssl rand -hex 32
> ```

---

## 5. Build do Frontend Estático (Vite)

```bash
cd /var/www/ael-talent/frontend
npm install
npm run build
```
> O build otimizado será gerado na pasta `/var/www/ael-talent/frontend/dist/`.

---

## 6. Inicialização dos Containers em Produção

Na raiz do projeto (`/var/www/ael-talent`):

```bash
docker compose -f docker-compose.prod.yml up -d
```

Verifique se os containers estão saudáveis:
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 7. Configuração do Nginx e Certificado SSL/HTTPS

```bash
# 1. Copiar o arquivo de configuração para o Nginx
cp /var/www/ael-talent/nginx/ael-talent.conf /etc/nginx/sites-available/carreiras.aelengenharia.com.br.conf

# 2. Ativar o site
ln -s /etc/nginx/sites-available/carreiras.aelengenharia.com.br.conf /etc/nginx/sites-enabled/

# 3. Testar a sintaxe do Nginx
nginx -t

# 4. Recarregar o Nginx
systemctl reload nginx

# 5. Emitir o Certificado SSL HTTPS Gratuito (Let's Encrypt)
certbot --nginx -d carreiras.aelengenharia.com.br
```

---

## 8. Rotina Diária de Backup Automatizado

Crie o script de backup no Debian:

```bash
cat << 'EOF' > /usr/local/bin/ael-backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/ael-talent"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do banco MariaDB
docker exec ael_db_prod mysqldump -u root -pSUA_SENHA_ROOT --single-transaction cats > $BACKUP_DIR/cats_$DATE.sql

# Backup dos currículos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/ael-talent/opencats upload/

# Manter apenas backups dos últimos 14 dias
find $BACKUP_DIR -type f -mtime +14 -delete
EOF

chmod +x /usr/local/bin/ael-backup.sh
```

Adicione ao cron para rodar todas as noites às 02h00:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ael-backup.sh") | crontab -
```

---

## 9. Comandos Úteis de Manutenção no Debian

```bash
# Ver status da aplicação
docker compose -f docker-compose.prod.yml ps

# Ver logs do backend em tempo real
docker logs -f ael_api_prod

# Reiniciar serviços
docker compose -f docker-compose.prod.yml restart

# Atualizar versão do código (Deploy Contínuo)
cd /var/www/ael-talent
git pull origin main
cd frontend && npm install && npm run build
cd .. && docker compose -f docker-compose.prod.yml up -d --build
```
