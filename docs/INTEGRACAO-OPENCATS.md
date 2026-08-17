# Plano de integracao OpenCATS -> A&L Carreiras

## Fase 1 - laboratorio local

- Clonar OpenCATS oficial.
- Subir stack Docker oficial.
- Finalizar install wizard.
- Criar um usuario RH.
- Criar uma vaga ficticia.
- Publicar no Career Portal.
- Fazer uma candidatura ficticia.
- Confirmar que o candidato aparece no painel.

## Fase 2 - mapear pontos de customizacao

O repositorio atual possui `careers/` e `careersPage.css`, portanto a primeira tentativa deve ser remodelar a apresentacao do portal existente, mantendo as rotas e a logica do OpenCATS.

Mapear:

1. template da lista de vagas;
2. template da pagina da vaga;
3. formulario de candidatura;
4. formulario do banco de talentos;
5. mensagens de sucesso/erro;
6. cabecalho e rodape;
7. campos adicionais realmente necessarios para a A&L.

## Fase 3 - identidade A&L

Direcao visual baseada no site institucional atual:

- verde institucional escuro como cor dominante;
- grandes titulos com alto contraste;
- secoes amplas em branco/cinza muito claro;
- blocos verdes de destaque;
- composicao editorial limpa;
- linguagem direta e institucional;
- foco regional, seguranca, pessoas e excelencia.

Os tokens iniciais estao em `branding/tokens.css` e devem ser refinados ao integrar os assets oficiais da marca.

## Fase 4 - painel RH

Nao reconstruir regras ja resolvidas pelo OpenCATS. Primeiro simplificar a experiencia existente e validar:

- criar vaga;
- editar;
- publicar/despublicar;
- encerrar;
- listar candidatos;
- acompanhar etapas;
- registrar notas/atividades.

## Fase 5 - futuras integracoes

Somente depois do MVP:

- SharePoint para documentos e backup/referencia documental;
- Power Automate / Microsoft Graph;
- leitura de curriculos;
- IA para extracao, tags e matching;
- protecao contra prompt injection;
- relatorios e dashboards.
