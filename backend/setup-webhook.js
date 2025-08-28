// Script para configurar webhook no WAHA para sessão existente
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

async function setupWebhook() {
  try {
    const sessionName = 'tenant-1_own_1756353500704';
    const tenantId = 'tenant-1';
    
    // Gerar token único para o webhook
    const webhookToken = crypto.randomBytes(32).toString('hex');
    const webhookUrl = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000'}/api/waha/webhook/${webhookToken}`;
    
    console.log('Setting up webhook for session:', sessionName);
    console.log('Webhook URL:', webhookUrl);
    
    // Configurar webhook no WAHA
    const wahaUrl = process.env.WAHA_BASE_URL || 'https://waha.nexuso2.com';
    const wahaApiKey = process.env.WAHA_API_KEY;
    
    // Primeiro, vamos verificar a configuração atual
    try {
      const currentConfig = await axios.get(
        `${wahaUrl}/api/sessions/${sessionName}/config`,
        {
          headers: {
            'X-Api-Key': wahaApiKey
          }
        }
      );
      
      console.log('\nCurrent webhook config:');
      console.log(JSON.stringify(currentConfig.data?.webhooks, null, 2));
    } catch (error) {
      console.log('Could not get current config:', error.message);
    }
    
    // Configurar novo webhook
    const webhookConfig = {
      webhooks: [
        {
          url: webhookUrl,
          events: [
            'message',
            'message.any',
            'message.ack',
            'session.status',
            'state.change'
          ],
          hmac: {
            key: crypto.randomBytes(32).toString('hex')
          }
        }
      ]
    };
    
    console.log('\nConfiguring webhook with:', JSON.stringify(webhookConfig, null, 2));
    
    const response = await axios.patch(
      `${wahaUrl}/api/sessions/${sessionName}/config`,
      webhookConfig,
      {
        headers: {
          'X-Api-Key': wahaApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\nWebhook configured successfully!');
    console.log('Response:', response.data);
    
    // Salvar informações do webhook para o backend poder processar
    console.log('\n=== IMPORTANT ===');
    console.log('Webhook Token:', webhookToken);
    console.log('Session Name:', sessionName);
    console.log('Tenant ID:', tenantId);
    console.log('\nThe backend needs to know about this webhook.');
    console.log('The webhook service should store this token to validate incoming requests.');
    
    // Testar se o webhook está acessível
    console.log('\n=== Testing Webhook Accessibility ===');
    try {
      const testResponse = await axios.post(webhookUrl, {
        event: 'test',
        data: { test: true }
      });
      console.log('Webhook test response:', testResponse.data);
    } catch (error) {
      console.log('Webhook not accessible from here:', error.message);
      console.log('This is expected if BACKEND_PUBLIC_URL is not set correctly');
      console.log('Make sure BACKEND_PUBLIC_URL in .env points to a publicly accessible URL');
    }
    
  } catch (error) {
    console.error('Error setting up webhook:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('Authentication failed. Check WAHA_API_KEY in .env');
    }
  }
}

setupWebhook();