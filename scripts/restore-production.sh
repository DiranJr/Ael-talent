#!/usr/bin/env bash
# ==============================================================================
# A&L Talent + OpenCATS — Script de Restauração de Produção
# ==============================================================================
# Restaura o banco MariaDB e arquivos de upload a partir de um backup .tar.gz
# Uso: ./scripts/restore-production.sh <caminho_do_arquivo_backup.tar.gz> [--yes]
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "❌ Uso: $0 <caminho_do_arquivo_backup.tar.gz> [--yes]"
  exit 1
fi

BACKUP_FILE="$1"
AUTO_CONFIRM="${2:-}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERRO: Arquivo de backup '$BACKUP_FILE' não encontrado."
  exit 1
fi

ENV_FILE=".env.production"
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

echo "======================================================================"
echo " [A&L TALENT] Procedimento de Restauração de Produção"
echo "======================================================================"
echo " ⚠️  ATENÇÃO: A restauração substituirá os dados atuais do banco '${DB_NAME}'!"
echo "    Arquivo de Backup: $BACKUP_FILE"
echo "======================================================================"

if [ "$AUTO_CONFIRM" != "--yes" ] && [ "$AUTO_CONFIRM" != "-y" ]; then
  read -p "Deseja continuar com a restauração? (digite 'CONFIRMAR' para prosseguir): " RESP
  if [ "$RESP" != "CONFIRMAR" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
  fi
fi

TEMP_RESTORE_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$TEMP_RESTORE_DIR"
}
trap cleanup EXIT

# 1. Validação de Integridade Checksum
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "🔍 1/4 Validando integridade SHA-256 do arquivo..."
  sha256sum -c "${BACKUP_FILE}.sha256"
  echo "   ✅ Checksum verificado e íntegro."
fi

# 2. Descompactação do Pacote
echo "📦 2/4 Descompactando arquivos do backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE_DIR"

SQL_FILE=$(find "$TEMP_RESTORE_DIR" -name "*.sql" | head -n 1)
if [ -z "$SQL_FILE" ] || [ ! -s "$SQL_FILE" ]; then
  echo "❌ ERRO: Arquivo de dump SQL não encontrado dentro do pacote de backup."
  exit 1
fi

# 3. Restauração do Banco MariaDB
echo "🗄️ 3/4 Restaurando banco de dados '${DB_NAME}'..."
if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  docker exec -i -e MYSQL_PWD="${DB_PASS}" "${DB_CONTAINER}" \
    mariadb -u "${DB_USER}" "${DB_NAME}" < "$SQL_FILE"
elif command -v mariadb > /dev/null 2>&1; then
  MYSQL_PWD="${DB_PASS}" mariadb -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" "${DB_NAME}" < "$SQL_FILE"
elif command -v mysql > /dev/null 2>&1; then
  MYSQL_PWD="${DB_PASS}" mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USER}" "${DB_NAME}" < "$SQL_FILE"
else
  echo "❌ ERRO: mariadb/mysql client ou container ${DB_CONTAINER} não encontrados."
  exit 1
fi
echo "   ✅ Banco de dados restaurado com sucesso."

# 4. Restauração de Uploads/Currículos
if [ -d "${TEMP_RESTORE_DIR}/upload" ]; then
  echo "📁 4/4 Sincronizando arquivos de upload/currículos..."
  mkdir -p ./opencats/upload
  cp -r "${TEMP_RESTORE_DIR}/upload/"* ./opencats/upload/ 2>/dev/null || true
  echo "   ✅ Arquivos de upload restaurados com sucesso."
fi

echo "======================================================================"
echo "✅ RESTAURAÇÃO DE PRODUÇÃO CONCLUÍDA COM SUCESSO!"
echo "======================================================================"
