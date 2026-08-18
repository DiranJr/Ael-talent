# RUNBOOK DE BACKUP, RETENÇÃO E RECUPERAÇÃO DE DESASTRES (RESTORE)
## A&L TALENT + OPENCATS

Este documento estabelece os procedimentos operacionais de segurança da informação para salvaguarda e recuperação dos dados do portal A&L Talent e OpenCATS.

---

## 1. POLÍTICA DE BACKUP

| Tipo | Frequência | Retenção | Conteúdo |
|---|---|---|---|
| **Diário (Automático)** | Diariamente às 03:00 AM | 7 dias | Dump MariaDB (`cats`) + Diretório de Currículos (`upload/`) |
| **Semanal (Snapshot)** | Domingos às 04:00 AM | 4 semanas | Dump MariaDB (`cats`) + Diretório de Currículos (`upload/`) |
| **Pré-Deploy / Migração** | Antes de cada release | Permanente | Snapshot completo do banco e arquivos |

---

## 2. PROCEDIMENTO DE BACKUP

### 2.1 Execução Manual
Para disparar um backup imediatamente no servidor de produção:
```bash
cd /var/www/ael-talent
./scripts/backup-production.sh
```
O script gerará um pacote compactado em `backups/ael_backup_YYYYMMDD_HHMMSS.tar.gz` acompanhado do arquivo de checksum `*.sha256`.

### 2.2 Automação via Crontab do Servidor
Adicione a seguinte entrada na crontab do usuário operacional (`crontab -e`):
```cron
# Backup diário do A&L Talent às 03:00 da manhã com rotação automática
0 3 * * * /var/www/ael-talent/scripts/backup-production.sh /var/www/ael-talent/.env.production >> /var/log/ael-backup.log 2>&1
```

---

## 3. PROCEDIMENTO DE RESTAURAÇÃO (RESTORE)

> [!CAUTION]
> A restauração é uma operação crítica que substituirá os dados atuais do banco de dados pelos dados contidos no backup. Execute preferencialmente em janela de manutenção.

### 3.1 Restauração Manual
```bash
cd /var/www/ael-talent
# Sintaxe: ./scripts/restore-production.sh <caminho_do_arquivo>
./scripts/restore-production.sh backups/ael_backup_20260818_030000.tar.gz
```
O script solicitará a digitação de `CONFIRMAR` antes de aplicar as alterações.

### 3.2 Restauração Automatizada (Modo Não-Interativo / Disaster Recovery)
```bash
./scripts/restore-production.sh backups/ael_backup_20260818_030000.tar.gz --yes
```

---

## 4. TESTE DE INTEGRIDADE DE RESTAURAÇÃO EM AMBIENTE ISOLADO

Para validar periodicamente se os schemas e estruturas estão 100% íntegros sem afetar a produção:
```bash
node scripts/test_backup_restore.js
```
O script valida a consistência de registros em todas as 11 tabelas críticas do OpenCATS (`candidate`, `joborder`, `candidate_joborder`, `candidate_joborder_status_history`, `activity`, `attachment`, `extra_field`, `candidate_auth`, `company`, `company_department`, `user`).
