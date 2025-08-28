const nodemailer = require('nodemailer');
import createTransporter, { smtpConfig } from '../config/smtp';
import { generateOTP } from '../utils/otp';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: any = null;

  async initialize() {
    this.transporter = await createTransporter();
  }

  async sendEmail(options: EmailOptions) {
    if (!this.transporter) {
      await this.initialize();
    }

    const mailOptions = {
      from: smtpConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    };

    try {
      const info = await this.transporter!.sendMail(mailOptions);
      
      console.log('📨 Email sent:', info.messageId);
      
      // If using Ethereal, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendMagicLink(email: string, token: string) {
    const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OmniX WhatsApp</h1>
            </div>
            <div class="content">
              <h2>Seu link de acesso</h2>
              <p>Olá,</p>
              <p>Você solicitou acesso ao OmniX WhatsApp. Clique no botão abaixo para fazer login:</p>
              <div style="text-align: center;">
                <a href="${magicLink}" class="button">Acessar OmniX</a>
              </div>
              <p style="color: #666; font-size: 14px;">Este link expira em 10 minutos por motivos de segurança.</p>
              <p style="color: #666; font-size: 14px;">Se você não solicitou este acesso, pode ignorar este email.</p>
            </div>
            <div class="footer">
              <p>© 2024 OmniX WhatsApp. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Seu link de acesso - OmniX WhatsApp',
      html,
    });
  }

  async sendOTP(email: string, otp: string, name?: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #667eea; margin: 20px 0; border-radius: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OmniX WhatsApp</h1>
              <p style="margin: 0; opacity: 0.9;">Código de Verificação</p>
            </div>
            <div class="content">
              <h2>Olá${name ? ' ' + name : ''},</h2>
              <p>Use o código abaixo para acessar sua conta:</p>
              <div class="otp-code">${otp}</div>
              <div class="warning">
                <strong>⏰ Atenção:</strong> Este código expira em ${process.env.OTP_EXPIRY_MINUTES || 10} minutos.
              </div>
              <p style="color: #666; font-size: 14px;">Por segurança, não compartilhe este código com ninguém.</p>
              <p style="color: #666; font-size: 14px;">Se você não solicitou este código, pode ignorar este email.</p>
            </div>
            <div class="footer">
              <p>© 2024 OmniX WhatsApp. Todos os direitos reservados.</p>
              <p style="margin-top: 10px;">Este é um email automático, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🔐 Código ${otp} - OmniX WhatsApp`,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { display: flex; align-items: center; margin: 15px 0; }
            .feature-icon { width: 40px; height: 40px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao OmniX WhatsApp!</h1>
            </div>
            <div class="content">
              <h2>Olá ${name},</h2>
              <p>Sua conta foi criada com sucesso! Estamos felizes em ter você conosco.</p>
              
              <h3>O que você pode fazer:</h3>
              <div class="feature">
                <div class="feature-icon">💬</div>
                <div>
                  <strong>Atendimento Multicanal:</strong> Gerencie múltiplas conversas do WhatsApp em um só lugar
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🤖</div>
                <div>
                  <strong>Workflows Inteligentes:</strong> Automatize respostas e triagem com nossa ferramenta visual
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div>
                  <strong>Analytics Completo:</strong> Acompanhe métricas e performance da equipe em tempo real
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">👥</div>
                <div>
                  <strong>Colaboração em Equipe:</strong> Múltiplos operadores no mesmo número
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Acessar Dashboard</a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Precisa de ajuda? Nossa equipe de suporte está disponível 24/7.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 OmniX WhatsApp. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Bem-vindo ao OmniX WhatsApp!',
      html,
    });
  }
}

export default new EmailService();