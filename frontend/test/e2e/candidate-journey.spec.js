import { test, expect } from '@playwright/test'

test.describe('Jornada do Candidato (Public Journey)', () => {
  test('deve navegar pela Home, listar vagas e acessar o detalhe de uma oportunidade', async ({ page }) => {
    await page.goto('/#/')

    // Verifica elementos do Header e Hero
    await expect(page.locator('.site-header .header-brand')).toBeVisible()
    await expect(page.locator('.hero')).toBeVisible()

    // Aguarda cards de vagas serem renderizados
    const jobCards = page.locator('.job-card')
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 })
    const count = await jobCards.count()
    expect(count).toBeGreaterThan(0)

    // Clica no primeiro card de vaga
    const firstJobTitle = await jobCards.first().locator('.job-card-title').innerText()
    await jobCards.first().click()

    // Aguarda transição para JobDetail
    await expect(page).toHaveURL(/#\/jobs\/\d+/)
    await expect(page.locator('#job-detail-title')).toBeVisible()
    const detailTitle = await page.locator('#job-detail-title').innerText()
    expect(detailTitle.trim()).toBe(firstJobTitle.trim())

    // Verifica presença do botão de candidatura
    await expect(page.locator('#open-apply-btn')).toBeVisible()
  })

  test('deve acessar o Banco de Talentos e a tela de cadastro estruturado', async ({ page }) => {
    await page.goto('/#/banco-talentos')

    await expect(page.locator('.hero-section').first()).toBeVisible()
    const registerBtn = page.locator('a[href="#/talent-pool/register"]').first()
    await expect(registerBtn).toBeVisible()

    // Clica para cadastrar currículo estruturado
    await registerBtn.click()
    await expect(page).toHaveURL(/#\/talent-pool\/register/)

    // Verifica campos essenciais do formulário da Etapa 1
    await expect(page.locator('#tp-first-name')).toBeVisible()
    await expect(page.locator('#tp-last-name')).toBeVisible()
    await expect(page.locator('#tp-email')).toBeVisible()
    await expect(page.locator('#tp-phone')).toBeVisible()
    await expect(page.locator('#next-step-btn')).toBeVisible()
  })

  test('deve acessar a tela de login do Portal do Candidato', async ({ page }) => {
    await page.goto('/#/candidato')

    await expect(page.locator('#cand-login-email')).toBeVisible()
    await expect(page.locator('#cand-login-password')).toBeVisible()
    await expect(page.locator('#cand-login-btn')).toBeVisible()
    await expect(page.locator('#cand-forgot-pwd-btn')).toBeVisible()
  })
})
