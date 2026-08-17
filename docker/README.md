# Docker local

A estrutura oficial atual do OpenCATS inclui `docker/docker-compose.yml` com servicos para web, PHP, MariaDB e phpMyAdmin.

Para o laboratorio local, use primeiro o compose do proprio OpenCATS, sem criar uma stack paralela. Isso reduz diferencas em relacao ao upstream e facilita atualizacoes.

Depois de clonar:

```bash
cd opencats/docker
docker compose up -d
```

Antes de qualquer publicacao externa:

- trocar credenciais padrao;
- nao expor MariaDB/phpMyAdmin publicamente;
- configurar HTTPS;
- separar configuracao de desenvolvimento e producao;
- revisar uploads/anexos e permissoes;
- aplicar backup do banco e dos arquivos enviados.
