import { test, expect } from '@playwright/test'

test.describe('Jornada do Recrutador / RH (Admin Journey)', () => {
  test('deve efetuar login no painel administrativo e navegar pelo dashboard e vagas', async ({ page }) => {
    await page.goto('/#/admin/login')

    await expect(page.locator('#login-username')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()

    // Preenche credenciais administrativas
    await page.fill('#login-username', 'admin')
    await page.fill('#login-password', 'admin')
    await page.click('#login-submit-btn')

    // Aguarda redirecionamento para o Dashboard
    await expect(page).toHaveURL(/#\/admin/, { timeout: 10000 })
    await expect(page.locator('.admin-shell')).toBeVisible()
    await expect(page.locator('.metrics-grid')).toBeVisible()

    // Navega para Gestão de Vagas
    await page.click('a[href="#/admin/jobs"]')
    await expect(page).toHaveURL(/#\/admin\/jobs/)
    await expect(page.locator('.data-table')).toBeVisible()

    // Navega para Banco de Talentos do RH
    await page.click('a[href="#/admin/talent-pool"]')
    await expect(page).toHaveURL(/#\/admin\/talent-pool/)
    await expect(page.locator('#tp-search-input')).toBeVisible()
  })
})
