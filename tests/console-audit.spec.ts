import { test, expect } from '@playwright/test';

test.describe('Auditoria de Qualidade do Console', () => {
  test('A tela de Telemetria não deve conter erros de React no console', async ({ page, context }) => {
    // 1. Blindagem de Rede (Custo Zero e Determinismo)
    await context.route('**/*', (route) => {
        const url = route.request().url();
        const excludeList = [
            'googlemaps', 'googleapis', 'gstatic', 'osm.org', 
            'tile.openstreetmap', 'mapbox', 'facebook', 'analytics',
            'fonts.googleapis', 'fonts.gstatic'
        ];
        if (excludeList.some(domain => url.includes(domain))) {
            return route.abort();
        }
        return route.continue();
    });

    const errors: string[] = [];

    // "Sensor" de erros de console
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Ignorar erros de faturamento do Google Maps que são comuns em ambiente de teste/dev sem chave ativa
        if (text.includes('BillingNotEnabledMapError')) return;
        // Ignorar erros de rede causados propositalmente pela blindagem
        if (text.includes('net::ERR_ABORTED')) return;
        if (text.includes('net::ERR_FAILED')) return;
        if (text.includes('Failed to load resource')) return;
        errors.push(text);
      }
    });

    // "Sensor" de erros de script não tratados
    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto('/telemetry-test');
    
    // Espera um pouco para garantir que o React renderizou tudo
    await page.waitForTimeout(2000);

    // Se houver algum erro no console, o teste FALHA aqui
    expect(errors, `Erros encontrados no console:\n${errors.join('\n')}`).toHaveLength(0);
  });
});
