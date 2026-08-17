/**
 * A&L Talent — Landing Page do Banco de Talentos
 * Rota: #/talent-pool
 */

export function renderTalentPool(params, appEl) {
  appEl.innerHTML = `
    <!-- HERO BANCO DE TALENTOS -->
    <section class="hero-section" style="padding-top: calc(var(--ael-header-h) + 2.5rem); padding-bottom: 4rem;">
      <div class="container hero-container" style="text-align: center; max-width: 860px; margin-inline: auto;">
        <div class="hero-badge" style="margin-inline: auto;">
          <span class="hero-badge-dot"></span>
          <span>Oportunidades Futuras · A&L Engenharia</span>
        </div>

        <h1 class="hero-title" style="font-size: clamp(2.25rem, 5vw, 3.5rem); margin-top: 1rem;">
          Faça parte da nossa história.<br>
          <span class="text-gradient">Construa sua carreira na A&L.</span>
        </h1>

        <p class="hero-sub" style="margin-inline: auto; max-width: 680px; font-size: 1.125rem;">
          Cadastre seu perfil profissional no nosso <strong>Banco de Talentos oficial</strong>.
          Conforme novas oportunidades surgem em nossos projetos de infraestrutura e mineração,
          nossa equipe de RH entra em contato direto com você.
        </p>

        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2.25rem; flex-wrap: wrap;">
          <a href="#/talent-pool/register" class="btn btn-primary btn-lg" style="box-shadow: 0 8px 24px rgba(0, 230, 118, 0.25);">
            <span>Cadastrar Meu Perfil Profissional</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a href="#/jobs" class="btn btn-dark btn-lg">
            <span>Ver Vagas Abertas</span>
          </a>
        </div>
      </div>
    </section>

    <!-- FAIXA DE ESTATÍSTICAS OFICIAIS A&L -->
    <section class="stats-strip" aria-label="Estatísticas da A&L Engenharia">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">20</span>
            <span class="stat-label">Anos de atuação com solidez construtiva</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">+500</span>
            <span class="stat-label">Obras e projetos entregues com excelência</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">+30</span>
            <span class="stat-label">Grandes clientes e parceiros atendidos</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">+1000</span>
            <span class="stat-label">Colaboradores construindo o futuro</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">+200</span>
            <span class="stat-label">Equipamentos pesados próprios</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">5</span>
            <span class="stat-label">Cidades com presença e bases operacionais</span>
          </div>
        </div>
      </div>
    </section>

    <!-- COMO FUNCIONA O BANCO DE TALENTOS -->
    <section style="padding-block: 5rem; background: var(--ael-bg-white);">
      <div class="container">
        <div style="text-align: center; max-width: 640px; margin-inline: auto; margin-bottom: 3.5rem;">
          <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-green-base); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.5rem;">
            Processo Simples & Rápido
          </span>
          <h2 style="font-size: 2rem; font-weight: 800; color: var(--ael-ink);">
            Como funciona o nosso Banco de Talentos?
          </h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
          <div style="
            background: var(--ael-surface);
            border: 1px solid var(--ael-line);
            border-radius: var(--ael-radius-lg);
            padding: 2rem;
            position: relative;
          ">
            <div style="
              width: 48px; height: 48px; border-radius: var(--ael-radius-md);
              background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
              display: flex; align-items: center; justify-content: center;
              font-weight: 800; font-size: 1.25rem; margin-bottom: 1.25rem;
            ">1</div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 0.5rem;">
              Preencha seu Perfil
            </h3>
            <p style="font-size: 0.9375rem; color: var(--ael-text); line-height: 1.6;">
              Informe suas áreas de interesse, experiência profissional, formação e competências técnicas em nosso formulário intuitivo em etapas.
            </p>
          </div>

          <div style="
            background: var(--ael-surface);
            border: 1px solid var(--ael-line);
            border-radius: var(--ael-radius-lg);
            padding: 2rem;
            position: relative;
          ">
            <div style="
              width: 48px; height: 48px; border-radius: var(--ael-radius-md);
              background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
              display: flex; align-items: center; justify-content: center;
              font-weight: 800; font-size: 1.25rem; margin-bottom: 1.25rem;
            ">2</div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 0.5rem;">
              Triagem Direta do RH
            </h3>
            <p style="font-size: 0.9375rem; color: var(--ael-text); line-height: 1.6;">
              Quando uma nova oportunidade for aberta em qualquer uma de nossas obras ou escritórios, nossa equipe busca perfis alinhados no banco.
            </p>
          </div>

          <div style="
            background: var(--ael-surface);
            border: 1px solid var(--ael-line);
            border-radius: var(--ael-radius-lg);
            padding: 2rem;
            position: relative;
          ">
            <div style="
              width: 48px; height: 48px; border-radius: var(--ael-radius-md);
              background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
              display: flex; align-items: center; justify-content: center;
              font-weight: 800; font-size: 1.25rem; margin-bottom: 1.25rem;
            ">3</div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink); margin-bottom: 0.5rem;">
              Contato Imediato
            </h3>
            <p style="font-size: 0.9375rem; color: var(--ael-text); line-height: 1.6;">
              Se o seu perfil for selecionado, você receberá o contato dos nossos recrutadores diretamente pelo WhatsApp ou telefone para agendar entrevista.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CARD CTA FINAL -->
    <section style="padding-block: 4rem 6rem; background: var(--ael-surface);">
      <div class="container">
        <div style="
          background: linear-gradient(135deg, var(--ael-green-dark) 0%, var(--ael-green-base) 100%);
          border-radius: var(--ael-radius-xl);
          padding: clamp(2.5rem, 5vw, 4rem);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        ">
          <div style="max-width: 540px;">
            <h2 style="font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; color: #ffffff; margin-bottom: 0.75rem;">
              Pronto para construir o futuro conosco?
            </h2>
            <p style="color: rgba(255,255,255,0.85); font-size: 1rem; line-height: 1.6;">
              Leva menos de 3 minutos para cadastrar seu perfil estruturado. O envio do currículo em PDF é opcional.
            </p>
          </div>

          <a href="#/talent-pool/register" class="btn btn-primary btn-lg" style="box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);">
            <span>Cadastrar Meu Perfil Agora</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </section>
  `
}
