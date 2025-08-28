// Script para configurar webhook no WAHA
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

async function configureWebhook() {
  try {
    const sessionName = 'tenant-1_own_1756353500704';
    const tenantId = 'tenant-1';
    
    // Criar webhook através do backend OmniX primeiro
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id: 'test-user',
        email: 'ahspimentel@gmail.com',
        tenantId: 'tenant-1',
        role: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // Gerar webhook através do OmniX
    console.log('Generating webhook through OmniX backend...');
    const webhookResponse = await axios.post(
      'http://localhost:3000/api/waha/sessions/generate-webhook',
      {
        displayName: 'Angelo'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Webhook generated:', webhookResponse.data);
    const { webhookUrl, webhookToken } = webhookResponse.data;
    
    // Agora vamos configurar o webhook no WAHA usando o método SET
    const wahaUrl = process.env.WAHA_BASE_URL || 'https://waha.nexuso2.com';
    const wahaApiKey = process.env.WAHA_API_KEY;
    
    console.log('\nConfiguring webhook in WAHA...');
    console.log('Session:', sessionName);
    console.log('Webhook URL:', webhookUrl);
    
    // Usar o endpoint correto do WAHA para configurar webhooks
    const setWebhookResponse = await axios.post(
      `${wahaUrl}/api/sessions/${sessionName}/webhooks`,
      {
        url: webhookUrl,
        events: ['message', 'message.any', 'message.ack', 'session.status'],
        hmac: {
          key: webhookToken
        }
      },
      {
        headers: {
          'X-Api-Key': wahaApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\nWebhook configured successfully!');
    console.log('Response:', setWebhookResponse.data);
    
    // Verificar se o webhook foi configurado
    const webhooksResponse = await axios.get(
      `${wahaUrl}/api/sessions/${sessionName}/webhooks`,
      {
        headers: {
          'X-Api-Key': wahaApiKey
        }
      }
    );
    
    console.log('\nCurrent webhooks:');
    console.log(JSON.stringify(webhooksResponse.data, null, 2));
    
    // Importante: precisamos garantir que o webhook está persistido no OmniX também
    console.log('\n=== IMPORTANT ===');
    console.log('Webhook is now configured in WAHA');
    console.log('The OmniX backend should now receive messages at:', webhookUrl);
    console.log('\nTest by sending a message to the WhatsApp number: 5561936182610');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error('\nThe session might not exist or the endpoint is not available');
      console.error('Try creating a new session with webhook from the start');
    }
  }
}

configureWebhook();