# Procedimentos Operacionais: Backup e Restauração (Disaster Recovery)

Este documento estabelece as diretrizes e comandos oficiais para rotinas de backup, integridade e restauração do ecossistema **A&L Talent + OpenCATS**.

---

## 1. Componentes Críticos do Sistema

Para um backup integral e consistente, dois elementos são estritamente necessários:
1. **Banco de Dados Relacional (MariaDB `cats`)**: Contém todas as tabelas nativas de candidatos, vagas, candidaturas, histórico de pipeline, permissões do RH, extra fields e credenciais em `candidate_auth`.
2. **Volume de Anexos Físicos (`opencats/upload/` ou `/uploads`)**: Armazena os arquivos físicos de currículos em formato PDF/DOC/DOCX associados à tabela `attachment`.

---

## 2. Procedimento de Backup

### 2.1 Backup do Banco de Dados (MariaDB)
Execute o utilitário `mysqldump` com a flag `--single-transaction` para garantir consistência transacional em tabelas InnoDB:

```bash
# Backup via Docker
docker exec ael_db mysqldump -u root -proot_ael_2024 --single-transaction --routines --triggers cats > backups/backup_ael_talent_$(date +%Y%m%d_%H%M%S).sql

# Backup em Servidor Dedicado
mysqldump -u ael_dev -p -h localhost --single-transaction cats > backups/backup_ael_talent_$(date +%Y%m%d_%H%M%S).sql
```

### 2.2 Backup dos Arquivos de Currículo
Compacte o diretório de uploads mantendo a estrutura de diretórios:

```bash
# Compactar diretório de uploads
tar -czvf backups/uploads_ael_talent_$(date +%Y%m%d_%H%M%S).tar.gz opencats/upload/
```

---

## 3. Procedimento de Restauração (Restore)

### 3.1 Restauração do Banco de Dados
Para restaurar a base em um novo ambiente ou recuperar de um incidente:

```bash
# 1. Criação da base limpa
docker exec -i ael_db mariadb -u root -proot_ael_2024 -e "DROP DATABASE IF EXISTS cats; CREATE DATABASE cats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Ingestão do dump SQL
docker exec -i ael_db mariadb -u root -proot_ael_2024 cats < backups/backup_ael_talent_20260817.sql
```

### 3.2 Restauração dos Anexos
Descompacte os arquivos de currículo para o diretório configurado em `UPLOAD_PATH`:

```bash
tar -xzvf backups/uploads_ael_talent_20260817.tar.gz -C ./
```

---

## 4. Teste Automatizado de Integridade

O sistema possui um script oficial para validação de integridade pós-backup:

```bash
cd frontend
node test_backup_restore.js
```

O script cria um namespace temporário de tabelas, replica os dados linha a linha, valida a paridade de contadores (100% íntegro) e limpa os artefatos de teste sem interromper a operação.

---

## 5. Política Recomendada de Retenção

| Tipo | Frequência | Retenção | Destino |
| :--- | :--- | :--- | :--- |
| **Diário (Snapshot)** | Todos os dias às 02h00 | 14 dias | Storage em Nuvem / S3 |
| **Semanal (Full)** | Todo domingo às 03h00 | 8 semanas | Cold Storage / Backup Imutável |
| **Mensal (Consolidado)** | 1º dia do mês | 12 meses | Armazenamento de Longo Prazo |
