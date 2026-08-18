# Padrão de Idioma e Glossário Oficial — A&L Talent

Este documento estabelece as diretrizes de idioma e terminologia para o projeto **A&L Talent**, garantindo consistência técnica e clareza para usuários, recrutadores e mantenedores.

---

## 🎯 Diretriz Fundamental

> **"Português do Brasil para pessoas. Técnico em inglês para contratos de sistema."**

- **Interface do Usuário (UI / UX)**: 100% em Português do Brasil (`pt-BR`).
- **Comunicação Transacional (E-mails / Toasts / Erros)**: 100% em Português do Brasil.
- **Documentação e Guias Operacionais**: 100% em Português do Brasil.
- **Contratos de API, Banco de Dados e Nomes de Tecnologias**: Preservados em inglês técnico para evitar quebras ou complexidade acidental.

---

## 📚 Glossário de Termos de Negócio & RH

| Termo em Inglês | Padrão em Português (pt-BR) | Contexto de Uso |
| :--- | :--- | :--- |
| **Candidate** | **Candidato / Candidata** | Profissional cadastrado ou concorrendo a vagas. |
| **Job / Job Order** | **Vaga / Oportunidade** | Vaga de emprego aberta ou gerenciada pelo RH. |
| **Talent Pool** | **Banco de Talentos** | Base de profissionais cadastrados para oportunidades futuras. |
| **Application** | **Candidatura / Inscrição** | Vínculo de um candidato a uma vaga específica. |
| **Recruiter** | **Recrutador(a)** | Membro do time de Recursos Humanos responsável pela vaga. |
| **Hiring Manager** | **Gestor(a) da Vaga** | Responsável técnico/operacional demandante da posição. |
| **Pipeline / Stages** | **Etapas do Processo Seletivo** | Fluxo de seleção (Triagem, Entrevista, Proposta, etc.). |
| **Dashboard** | **Painel / Visão Geral** | Tela principal com métricas e indicadores de RH. |
| **First Access** | **Primeiro Acesso** | Fluxo de ativação de conta e criação de senha inicial. |
| **Password Reset** | **Redefinição de Senha** | Fluxo de recuperação de credenciais esquecidas. |

---

## 💻 Glossário de UX e Interface

| Termo em Inglês | Padrão em Português (pt-BR) |
| :--- | :--- |
| **Loading...** | **Carregando...** |
| **Saving...** | **Salvando...** |
| **Processing...** | **Processando...** |
| **Sending...** | **Enviando...** |
| **Search** | **Buscar** |
| **Save** | **Salvar** |
| **Submit / Apply** | **Candidatar-se / Enviar Inscrição** |
| **Cancel** | **Cancelar** |
| **Back** | **Voltar** |
| **Next** | **Próximo** |
| **Edit** | **Editar** |
| **Delete / Remove** | **Excluir / Remover** |
| **View / Details** | **Visualizar / Ver Detalhes** |
| **Upload** | **Enviar Arquivo (Currículo/Foto)** |
| **Download** | **Baixar Arquivo** |
| **Sign In / Login** | **Entrar / Acessar** |
| **Sign Out / Logout** | **Sair da Conta** |
| **No results found** | **Nenhum resultado encontrado** |
| **No jobs available** | **Nenhuma vaga disponível no momento** |

---

## 🛡️ Termos Mantidos em Inglês (Contratos Técnicos)

| Termo | Motivo da Preservação |
| :--- | :--- |
| **OpenCATS** | Nome próprio do sistema ATS de backend. |
| **Docker / Docker Compose** | Nome oficial de infraestrutura e conteinerização. |
| **Nginx / MariaDB / Node.js** | Nomes oficiais de ferramentas e serviços de runtime. |
| **API / HTTP / HTTPS / JSON / SQL** | Protocolos e padrões abertos de tecnologia. |
| **Brevo / SMTP Relay** | Provedor e protocolo oficial de e-mail transacional. |
| **CI / CD / GitHub Actions** | Padrões e plataformas de integração e entrega contínua. |
| **scrypt / HMAC / JWT / Bearer** | Algoritmos e padrões de criptografia e autenticação. |
| **Rate Limit / Cooldown** | Conceitos técnicos de segurança e controle de tráfego. |
| **Tabelas (`candidate`, `joborder`, etc.)** | Esquema de banco de dados do OpenCATS. |
| **Campos de API (`success`, `data`, `token`)** | Contratos de resposta JSON para clientes web e mobile. |

---

## 📅 Formatação de Dados e Acessibilidade

- **Datas**: Formato brasileiro `DD/MM/AAAA` (ex: `18/08/2026`).
- **Horários**: Formato 24h `HH:mm` (ex: `14:30`).
- **Telefone**: Padrão brasileiro `(99) 99999-9999`.
- **Valores Monetários**: `R$ 1.250,00` (quando aplicável).
- **Acessibilidade (`aria-label`, `alt`, `title`)**: Todos os atributos textuais devem estar em português (ex: `aria-label="Fechar janela"`, `alt="Logo da A&L Engenharia"`).

---

## 📝 Padrão de Mensagens de Commit Futuras

Commits devem seguir o padrão Conventional Commits com descrição em **português**:

```text
feat(modulo): adiciona ...
fix(modulo): corrige ...
docs(modulo): atualiza documentação de ...
test(modulo): adiciona testes para ...
chore(modulo): atualiza dependências ou tarefas de manutenção ...
refactor(modulo): refatora estrutura de ...
security(modulo): aplica hardening de segurança em ...
```
