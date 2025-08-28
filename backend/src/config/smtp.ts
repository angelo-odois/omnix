const nodemailer = require('nodemailer');
import dotenv from 'dotenv';

dotenv.config();

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export const smtpConfig: SMTPConfig = {
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'contato@odois.com.br',
    pass: process.env.SMTP_PASS || 'K4rlb0hm@!',
  },
  from: process.env.SMTP_FROM || 'OmniX <noreply@omnix.com>',
};

export const createTransporter = async () => {
  let transporter;

  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    // Create a test account if no SMTP credentials are provided
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 465,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('📧 Using Ethereal test account for emails');
    console.log(`   Preview emails at: https://ethereal.email`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
  } else {
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ SMTP Server connection verified');
    } catch (error) {
      console.error('❌ SMTP Server connection failed:', error);
    }
  }

  return transporter;
};

export default createTransporter;