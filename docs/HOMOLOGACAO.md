# Relatório Oficial de Homologação Operacional — A&L Talent + OpenCATS

Este documento consolida os testes de homologação operacional de ponta a ponta executados no sistema **A&L Talent**, validando sua integração nativa com o **OpenCATS**, segurança, pipeline de recrutamento, usabilidade do RH e prontidão para implantação.

---

## 1. Princípio Arquitetural Validado

> **"A&L TALENT POR FORA, OPENCATS POR DENTRO"**
> 
> Todas as operações de candidatos, vagas, candidaturas, histórico de pipeline e anexos são mantidas de forma transparente no banco de dados relacional nativo do OpenCATS (`cats`), enquanto o portal moderno (SPA em Vite) e o backend (Express) atuam como camada segura e responsiva de interface.

---

## 2. Matriz de Testes e Resultados

| ID | Cenário / Fluxo Testado | Status | Evidência / Comportamento Observado |
| :---: | :--- | :---: | :--- |
| **01** | **Banco de Talentos SEM Currículo** | **APROVADO** | Cadastro em 6 etapas concluído com sucesso. Perfil estruturado gravado em `candidate` e `extra_field` sem obrigatoriedade de arquivo PDF/DOCX. |
| **02** | **Banco de Talentos COM Currículo (.pdf e .docx)** | **APROVADO** | Upload recebido, sanitizado e gravado na pasta `upload` com registro na tabela `attachment` (`data_item_type = 100`). |
| **03** | **Deduplicação de E-mail** | **APROVADO** | Submissões com variações de caixa alta/baixa e espaços (`  MARCOS@AEL.DEV  `) normalizadas e associadas ao registro existente sem duplicar IDs. |
| **04** | **Inscrição em Múltiplas Vagas** | **APROVADO** | Candidato aplica para uma 2ª vaga: apenas novo `candidate_joborder` é gerado, preservando integridade cadastral sem duplicação de perfil. |
| **05** | **Portal do Candidato (`#/candidato`)** | **APROVADO** | Login por e-mail/senha scrypt, consulta de status em tempo real via `/me`, e alteração de senha segura com atualização de `candidate_auth`. |
| **06** | **Movimentação de Pipeline pelo RH** | **APROVADO** | Mudança de status (100 -> 300 -> 500 -> 600 -> 800) registrada atonicamente em `candidate_joborder`, `candidate_joborder_status_history` e `activity`. |
| **07** | **Filtros e Busca Textual no RH** | **APROVADO** | Busca por palavras-chave (*Datamine*, *AutoCAD*, *NR-35*, *Excel*, *Power BI*) e filtros por área/cidade retornando resultados precisos. |
| **08** | **Ação "+ Vaga" pelo RH** | **APROVADO** | Candidato do Banco de Talentos vinculado diretamente ao pipeline de uma nova vaga aberta com criação de histórico e atividade. |
| **09** | **Validação de Links do WhatsApp** | **APROVADO** | Geração de links `https://wa.me/55...` com DDD sanitizado e mensagem institucional da A&L Engenharia pronta para clique. |
| **10** | **Ciclo de Vida de Vagas pelo RH** | **APROVADO** | Criação, edição, pausa (*On Hold* / ocultada do mural), reabertura (*Active-Share* / visível no mural) e exclusão operacional. |
| **11** | **Gestão de Departamentos pelo RH** | **APROVADO** | Criação de novos centros de custo/departamentos e sincronização dinâmica com os filtros públicos do portal. |
| **12** | **Recuperação de Senha Segura** | **APROVADO** | Token criptográfico de 32 bytes gerado, hash SHA-256 no banco com expiração de 15 minutos e bloqueio estrito contra replay (*single-use*). |

---

## 3. Conformidade LGPD & Privacidade

1. **Consentimento Explícito**: Checkbox obrigatório no cadastro do Banco de Talentos com registro de data/hora e IP na tabela `extra_field`.
2. **Ocultação de PII em Endpoints Públicos**: Rota de lookup retorna apenas boolean e primeiro nome, sem expor e-mails, telefones ou endereços.
3. **Credenciais Isoladas**: Hashes de senha e tokens de recuperação residem exclusivamente na tabela isolada `candidate_auth`, nunca expostos nas interfaces do RH nem nas respostas de API.

---

---

## 4. Correções Pós-Auditoria de Segurança

Após auditoria técnica aprofundada, as seguintes vulnerabilidades e inconsistências foram integralmente corrigidas e validadas por suítes de testes automatizados:

1. **Rate Limit Bypass**: Header `x-test-bypass` desativado globalmente para qualquer ambiente fora de `NODE_ENV === 'test'`. Em produção, staging e desenvolvimento, tentativas de contornar limitadores de taxa por cabeçalho são sumariamente ignoradas.
2. **Primeiro Acesso Protegido contra Account Takeover**: Candidatos legados ou importados sem registro em `candidate_auth` não podem ter suas senhas definidas por terceiros. O endpoint `/login` responde `{ first_access: true }` sem gravar credenciais e `/set-password` exige fluxo seguro de ativação por token criptográfico de uso único.
3. **Correção em `/set-password`**: Substituição da chamada indevida de assinatura por `verifyCandidateToken(token)` e validação rigorosa de Bearer tokens.
4. **Bloqueio de Redefinição via `/register`**: O formulário de cadastro público `/register` foi bloqueado para não alterar nem sobrescrever credenciais de candidatos já existentes na base.
5. **Tokens HMAC Timing-Safe**: Implementação de comparação de assinaturas em tempo constante (`crypto.timingSafeEqual`) para tokens de candidatos e administradores, além de validação estrita contra tokens malformados, truncados ou sem identificadores.
6. **Lookup Seguro e Anti-Enumeração**: Rota `/lookup` padronizada para resposta neutra `{ status: "ok" }`, eliminando enumeração de e-mails e vazamento de PII (`first_name`, `candidate_id`, `has_password`).
7. **Validação de Conteúdo Real em Uploads (Magic Bytes)**: Validação binária em camadas verificando assinaturas reais `%PDF-` para PDFs, pacotes ZIP com estrutura OpenXML para DOCX e OLE Compound para DOC, com descarte e exclusão imediata de executáveis disfarçados ou arquivos corrompidos.
8. **Filtros SQL Nativos e Paginação**: Migração completa dos filtros de área, escolaridade, experiência, cidade, estado e busca textual para consultas SQL nativas (`WHERE` e `EXISTS` em `extra_field`), garantindo que candidatos após a 200ª posição sejam retornados com precisão e paginação escalável.
9. **Endurecimento de Configuração em Produção**: Validação obrigatória na inicialização em produção de `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` e bloqueio estrito de secrets de sessão fracos (< 32 caracteres) ou padrões.

---

## 5. Conclusão da Homologação

**Status:** **HOMOLOGADO PARA PREPARAR DEPLOY**  
**Data da Última Validação Técnica:** 17 de Agosto de 2026  
**Condições:** Todas as suítes de testes de segurança, auditoria, homologação operacional e funcionalidades do recrutador executadas com 100% de aprovação no ambiente integrado A&L Talent + MariaDB OpenCATS.

