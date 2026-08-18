#!/usr/bin/env bash
# ==============================================================================
# A&L Talent + OpenCATS — Script de Backup Completo de Produção
# ==============================================================================
# Executa dump completo do MariaDB e compacta uploads/currículos em .tar.gz
# Uso: ./scripts/backup-production.sh [caminho_env]
# ==============================================================================

set -euo pipefail

ENV_FILE="${1:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
  if [ -f ".env" ]; then
    ENV_FILE=".env"
  fi
fi

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  export $(grep -v '^#' "$ENV_FILE" | xargs -d '\n')
fi

DB_CONTAINER="${DB_CONTAINER:-ael_db_prod}"
DB_NAME="${DB_NAME:-cats}"
DB_USER="${DB_USER:-ael_prod}"
DB_PASS="${DB_PASS:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
UPLOAD_DIR="${UPLOAD_DIR:-./opencats/upload}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ael_backup_${TIMESTAMP}.tar.gz"
TEMP_DUMP_DIR=$(mktemp -d)

mkdir -p "$BACKUP_DIR"

echo "======================================================================"
echo " [A&L TALENT] Iniciando Backup de Produção — ${TIMESTAMP}"
echo "======================================================================"

cleanup() {
  rm -rf "$TEMP_DUMP_DIR"
}
trap cleanup EXIT

# 1. Dump do Banco MariaDB
echo "📦 1/3 Gerando dump consistente do MariaDB (${DB_NAME})..."
SQL_DUMP_FILE="${TEMP_DUMP_DIR}/database_${DB_NAME}_${TIMESTAMP}.sql"

if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  # Executa dump dentro do container do banco
  docker exec -e MYSQL_PWD="${DB_PASS}" "${DB_CONTAINER}" \
    mariadb-dump -u "${DB_USER}" --single-transaction --quick "${DB_NAME}" > "$SQL_DUMP_FILE"
elif command -v mariadb-dump > /dev/null 2>&1; then
  MYSQL_PWD="${DB_PASS}" mariadb-dump -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" --single-transaction --quick "${DB_NAME}" > "$SQL_DUMP_FILE"
elif command -v mysqldump > /dev/null 2>&1; then
  MYSQL_PWD="${DB_PASS}" mysqldump -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" --single-transaction --quick "${DB_NAME}" > "$SQL_DUMP_FILE"
else
  echo "❌ ERRO: mariadb-dump/mysqldump ou container ${DB_CONTAINER} não encontrados."
  exit 1
fi

if [ ! -s "$SQL_DUMP_FILE" ]; then
  echo "❌ ERRO: O arquivo de dump SQL foi gerado vazio!"
  exit 1
fi
echo "   ✅ Dump do banco gerado com sucesso ($(du -h "$SQL_DUMP_FILE" | cut -f1))"

# 2. Compactação de Banco + Uploads/Currículos
echo "📁 2/3 Empacotando dump do banco e arquivos de upload/currículos..."
tar -czf "$BACKUP_FILE" \
  -C "$TEMP_DUMP_DIR" "database_${DB_NAME}_${TIMESTAMP}.sql" \
  -C "." "$(basename "$UPLOAD_DIR")" 2>/dev/null || \
tar -czf "$BACKUP_FILE" \
  -C "$TEMP_DUMP_DIR" "database_${DB_NAME}_${TIMESTAMP}.sql"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ ERRO: O arquivo final de backup não pôde ser gerado."
  exit 1
fi

# 3. Geração de Checksum SHA-256
echo "🔒 3/3 Calculando checksum de integridade SHA-256..."
sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"

# 4. Limpeza de Backups Antigos (Retenção de 7 dias)
echo "🧹 Aplicando política de retenção (removendo backups com mais de 7 dias)..."
find "$BACKUP_DIR" -name "ael_backup_*.tar.gz*" -mtime +7 -exec rm -f {} \; 2>/dev/null || true

echo "======================================================================"
echo "✅ BACKUP CONCLUÍDO COM SUCESSO!"
echo "   Arquivo:  ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
echo "   Checksum: ${BACKUP_FILE}.sha256"
echo "======================================================================"
