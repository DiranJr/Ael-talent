/**
 * A&L Talent — Footer Institucional
 */

import logoUrl from '../assets/logo.png'

export function renderFooter() {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.setAttribute('role', 'contentinfo')

  footer.innerHTML = `
    <div class="container">
      <div class="footer-inner">
        <div>
          <a class="header-brand" href="#/" style="display:inline-flex;margin-bottom:1rem;align-items:center;gap:0.75rem;">
            <img src="${logoUrl}" alt="A&L Engenharia" style="height:36px;width:auto;object-fit:contain;" />
            <div>
              <span class="header-brand-name" style="color:white;font-weight:800;font-size:1rem;">A&L Engenharia</span>
              <span class="header-brand-sub" style="color:var(--ael-green-accent);font-size:0.6875rem;font-weight:700;">Carreiras</span>
            </div>
          </a>
          <p class="footer-brand-desc">
            Empresa paraense com mais de 20 anos de Solidez Construtiva, atuando com excelência em mineração, montagem industrial e infraestrutura no Pará e em todo o Brasil.
          </p>
        </div>

        <div class="footer-col">
          <h4>Portal de Carreiras</h4>
          <ul>
            <li><a href="#/">Início</a></li>
            <li><a href="#/jobs">Vagas abertas</a></li>
            <li><a href="#/talent-pool">Banco de Talentos</a></li>
            <li><a href="#/candidato" style="color:var(--ael-green-accent);font-weight:600;">Área do Candidato 👤</a></li>
            <li><a href="#/admin" style="color:rgba(255,255,255,0.65);">Painel do RH 🔒</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>A&L Engenharia</h4>
          <ul>
            <li><a href="https://aelengenharia.com.br/#empresa" target="_blank" rel="noreferrer">Sobre a Empresa</a></li>
            <li><a href="https://aelengenharia.com.br/#servicos" target="_blank" rel="noreferrer">Serviços & Obras</a></li>
            <li><a href="https://aelengenharia.com.br/#contato" target="_blank" rel="noreferrer">Fale Conosco</a></li>
            <li>
              <a href="https://www.linkedin.com/company/aelengenharia/" target="_blank" rel="noreferrer" style="color:var(--ael-green-accent);font-weight:600;">
                LinkedIn Oficial ↗
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} A&L Engenharia. Todos os direitos reservados.</p>
        <p style="color:var(--ael-dark-muted);font-size:0.75rem;">
          Portal de Carreiras & Seleção · Powered by OpenCATS
        </p>
      </div>
    </div>
  `

  return footer
}
