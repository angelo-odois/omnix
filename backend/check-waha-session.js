// Script para verificar detalhes da sessão no WAHA
const axios = require('axios');
require('dotenv').config();

async function checkSession() {
  try {
    const sessionName = 'tenant-1_own_1756353500704';
    const wahaUrl = process.env.WAHA_BASE_URL || 'https://waha.nexuso2.com';
    const wahaApiKey = process.env.WAHA_API_KEY;
    
    console.log('Checking session:', sessionName);
    
    // Buscar detalhes da sessão
    const sessionResponse = await axios.get(
      `${wahaUrl}/api/sessions/${sessionName}`,
      {
        headers: {
          'X-Api-Key': wahaApiKey
        }
      }
    );
    
    console.log('\nSession details:');
    console.log(JSON.stringify(sessionResponse.data, null, 2));
    
    // Verificar se tem webhooks configurados
    if (sessionResponse.data.config?.webhooks) {
      console.log('\nWebhooks configured:');
      console.log(JSON.stringify(sessionResponse.data.config.webhooks, null, 2));
    } else {
      console.log('\nNo webhooks configured for this session');
    }
    
    // Como a sessão foi criada sem webhook, precisamos recriá-la
    console.log('\n=== SOLUTION ===');
    console.log('This session was created without a webhook.');
    console.log('WAHA does not allow adding webhooks to existing sessions.');
    console.log('\nOptions:');
    console.log('1. Delete this session and create a new one with webhook');
    console.log('2. Use a polling mechanism to fetch messages periodically');
    console.log('3. Re-create the session with proper webhook configuration');
    
    // Vamos implementar a opção 3 - recriar com webhook
    console.log('\n=== Recreating session with webhook ===');
    console.log('We will:');
    console.log('1. Stop the current session');
    console.log('2. Delete it');
    console.log('3. Create a new one with webhook configured');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkSession();