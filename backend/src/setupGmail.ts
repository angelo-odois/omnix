const nodemailer = require('nodemailer');

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     📧 Configuração do Gmail para OmniX                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Para configurar o Gmail como servidor SMTP:

1️⃣  Acesse sua conta Google:
   https://myaccount.google.com/security

2️⃣  Ative a verificação em duas etapas (se ainda não estiver ativa)

3️⃣  Gere uma senha de aplicativo:
   https://myaccount.google.com/apppasswords
   
   - Selecione "Email" como o app
   - Selecione "Outro" como dispositivo
   - Digite "OmniX WhatsApp"
   - Copie a senha gerada (16 caracteres)

4️⃣  Atualize o arquivo .env com:

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ahspimentel@gmail.com
   SMTP_PASS=xgtq aeuk bhyi oznw
   SMTP_FROM="OmniX WhatsApp <ahspimentel@gmail.com>"

5️⃣  Teste o envio:
   npm run test:gmail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exemplo de teste com Gmail:
`);

async function testGmail() {
  // Exemplo de configuração do Gmail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'seu-email@gmail.com',
      pass: 'xxxx xxxx xxxx xxxx' // Senha de app de 16 caracteres
    }
  });

  console.log(`
Após configurar, o sistema enviará emails automaticamente
quando o usuário fizer login no frontend.

Os emails incluirão:
- Código OTP de 6 dígitos
- Link mágico de acesso direto
- Email de boas-vindas para novos usuários
`);
}

testGmail();