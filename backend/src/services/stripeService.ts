import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
});

interface CreateCheckoutSessionParams {
  areaCode: string;
  redirectNumber: string;
  displayName: string;
  userEmail: string;
  userId: string;
  tenantId: string;
}

class StripeService {
  // Criar sessão de checkout para pagamento único
  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    try {
      // Criar produto temporário para o número virtual
      const product = await stripe.products.create({
        name: `Número Virtual - DDD ${params.areaCode}`,
        description: `Número virtual com redirecionamento para ${params.redirectNumber}`,
        metadata: {
          areaCode: params.areaCode,
          redirectNumber: params.redirectNumber,
          displayName: params.displayName,
          userId: params.userId,
          tenantId: params.tenantId
        }
      });

      // Criar preço para o produto (pagamento único de setup + primeira mensalidade)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2990, // R$ 29,90 em centavos
        currency: 'brl',
      });

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/instances?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/instances?canceled=true`,
        customer_email: params.userEmail,
        metadata: {
          areaCode: params.areaCode,
          redirectNumber: params.redirectNumber,
          displayName: params.displayName,
          userId: params.userId,
          tenantId: params.tenantId,
          type: 'virtual_number_purchase'
        },
        payment_intent_data: {
          metadata: {
            areaCode: params.areaCode,
            redirectNumber: params.redirectNumber,
            displayName: params.displayName,
            userId: params.userId,
            tenantId: params.tenantId
          }
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar sessão de pagamento'
      };
    }
  }

  // Criar assinatura mensal para número virtual
  async createSubscription(params: CreateCheckoutSessionParams) {
    try {
      // Criar ou buscar produto para assinatura
      const products = await stripe.products.list({ limit: 1 });
      let product = products.data.find(p => p.name === 'Número Virtual - Assinatura');
      
      if (!product) {
        product = await stripe.products.create({
          name: 'Número Virtual - Assinatura',
          description: 'Assinatura mensal de número virtual WhatsApp'
        });
      }

      // Criar ou buscar preço recorrente
      const prices = await stripe.prices.list({ 
        product: product.id,
        type: 'recurring'
      });
      
      let price = prices.data[0];
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: 2990, // R$ 29,90 em centavos
          currency: 'brl',
          recurring: {
            interval: 'month'
          }
        });
      }

      // Criar sessão de checkout para assinatura
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/instances?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/instances?canceled=true`,
        customer_email: params.userEmail,
        metadata: {
          areaCode: params.areaCode,
          redirectNumber: params.redirectNumber,
          displayName: params.displayName,
          userId: params.userId,
          tenantId: params.tenantId,
          type: 'virtual_number_subscription'
        },
        subscription_data: {
          metadata: {
            areaCode: params.areaCode,
            redirectNumber: params.redirectNumber,
            displayName: params.displayName,
            userId: params.userId,
            tenantId: params.tenantId
          }
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar assinatura'
      };
    }
  }

  // Verificar status da sessão
  async retrieveSession(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        success: true,
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          customer_email: session.customer_email,
          metadata: session.metadata
        }
      };
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      return {
        success: false,
        message: error.message || 'Erro ao recuperar sessão'
      };
    }
  }

  // Processar webhook do Stripe
  async handleWebhook(payload: string | Buffer, signature: string) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.log('Webhook secret not configured, skipping signature verification');
        return { success: true, message: 'Webhook processed (no signature verification)' };
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      // Processar diferentes tipos de eventos
      let session: Stripe.Checkout.Session | undefined;
      
      switch (event.type) {
        case 'checkout.session.completed':
          session = event.data.object as Stripe.Checkout.Session;
          console.log('Payment completed for session:', session.id);
          
          // Aqui vamos chamar a criação do número na Salvy
          if (session.metadata?.type === 'virtual_number_purchase' || 
              session.metadata?.type === 'virtual_number_subscription') {
            return {
              success: true,
              action: 'create_virtual_number',
              metadata: session.metadata,
              sessionId: session.id,
              subscriptionId: session.subscription as string
            };
          }
          break;

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription event:', subscription.id, event.type);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true, message: 'Webhook processed successfully', sessionId: session?.id };
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao processar webhook'
      };
    }
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          canceled_at: subscription.canceled_at
        }
      };
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        message: error.message || 'Erro ao cancelar assinatura'
      };
    }
  }
}

export default new StripeService();