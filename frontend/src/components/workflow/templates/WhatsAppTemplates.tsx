import React from 'react';
import { MessageSquare, Bot, ShoppingCart, Users, Star, Zap } from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'welcome' | 'sales' | 'support' | 'crm';
  nodes: any[];
  connections: any[];
  preview: string;
}

export const whatsappTemplates: WorkflowTemplate[] = [
  {
    id: 'welcome-sequence',
    name: 'Sequência de Boas-vindas',
    description: 'Recebe novos contatos com mensagem personalizada e menu de opções',
    icon: MessageSquare,
    color: 'bg-primary-500',
    category: 'welcome',
    preview: 'Olá! Bem-vindo à nossa empresa. Como posso ajudar você hoje?',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Nova Mensagem',
          triggerType: 'MESSAGE_RECEIVED',
          conditions: { firstTime: true }
        }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 100, y: 200 },
        data: {
          label: 'Mensagem de Boas-vindas',
          actionType: 'SEND_MESSAGE',
          message: 'Olá! 👋 Bem-vindo à nossa empresa!\n\nComo posso ajudar você hoje?'
        }
      },
      {
        id: 'action-2',
        type: 'whatsappButton',
        position: { x: 100, y: 350 },
        data: {
          label: 'Menu Principal',
          message: 'Escolha uma das opções abaixo:',
          buttons: [
            { id: '1', text: '💼 Vendas', type: 'reply' },
            { id: '2', text: '🛠️ Suporte', type: 'reply' },
            { id: '3', text: '📞 Falar com Humano', type: 'reply' }
          ]
        }
      }
    ],
    connections: [
      { id: 'e1', source: 'trigger-1', target: 'action-1' },
      { id: 'e2', source: 'action-1', target: 'action-2' }
    ]
  },

  {
    id: 'lead-qualification',
    name: 'Qualificação de Leads',
    description: 'Coleta informações do lead e calcula score automaticamente',
    icon: Star,
    color: 'bg-yellow-500',
    category: 'crm',
    preview: 'Vou fazer algumas perguntas para entender melhor suas necessidades...',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Interesse em Vendas',
          triggerType: 'KEYWORD',
          keywords: ['vendas', 'comprar', 'preço']
        }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 100, y: 200 },
        data: {
          label: 'Qualificar Lead',
          actionType: 'SEND_MESSAGE',
          message: 'Ótimo! 🎯 Vou fazer algumas perguntas para entender melhor suas necessidades...'
        }
      },
      {
        id: 'action-2',
        type: 'whatsappList',
        position: { x: 100, y: 350 },
        data: {
          label: 'Tamanho da Empresa',
          title: 'Qual o tamanho da sua empresa?',
          description: 'Isso nos ajuda a oferecer a melhor solução',
          buttonText: 'Selecionar',
          sections: [
            {
              title: 'Tamanho',
              rows: [
                { id: 'micro', title: '1-10 funcionários', description: 'Microempresa' },
                { id: 'pequena', title: '11-50 funcionários', description: 'Pequena empresa' },
                { id: 'media', title: '51-200 funcionários', description: 'Média empresa' }
              ]
            }
          ]
        }
      },
      {
        id: 'crm-1',
        type: 'crmLeadScore',
        position: { x: 400, y: 350 },
        data: {
          label: 'Calcular Score',
          scoreRules: [
            { condition: 'Empresa média/grande', points: 20, description: '+20 pts por porte' },
            { condition: 'Interesse em vendas', points: 15, description: '+15 pts por interesse' },
            { condition: 'Respondeu perguntas', points: 10, description: '+10 pts por engajamento' }
          ],
          threshold: 30,
          actionOnThreshold: 'Notificar equipe de vendas'
        }
      }
    ],
    connections: [
      { id: 'e1', source: 'trigger-1', target: 'action-1' },
      { id: 'e2', source: 'action-1', target: 'action-2' },
      { id: 'e3', source: 'action-2', target: 'crm-1' }
    ]
  },

  {
    id: 'ai-support',
    name: 'Suporte com IA',
    description: 'Atendimento automatizado com IA para dúvidas comuns',
    icon: Bot,
    color: 'bg-purple-500',
    category: 'support',
    preview: 'Vou analisar sua pergunta e gerar uma resposta personalizada...',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Keyword Suporte',
          triggerType: 'KEYWORD',
          keywords: ['suporte', 'ajuda', 'problema', 'dúvida']
        }
      },
      {
        id: 'ai-1',
        type: 'aiResponse',
        position: { x: 100, y: 250 },
        data: {
          label: 'Resposta IA',
          prompt: 'Você é um assistente de suporte técnico. Analise a pergunta do cliente e forneça uma resposta útil e profissional.',
          tone: 'professional',
          maxLength: 500,
          useContext: true
        }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 100, y: 400 },
        data: {
          label: 'Problema Resolvido?',
          conditionType: 'USER_RESPONSE',
          expectedResponses: ['sim', 'resolvido', 'obrigado']
        }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 300, y: 500 },
        data: {
          label: 'Encerrar Atendimento',
          actionType: 'SEND_MESSAGE',
          message: 'Fico feliz em ter ajudado! 😊 Se precisar de mais alguma coisa, é só chamar!'
        }
      },
      {
        id: 'action-2',
        type: 'action',
        position: { x: -100, y: 500 },
        data: {
          label: 'Transferir para Humano',
          actionType: 'ASSIGN_AGENT',
          message: 'Vou transferir você para um de nossos especialistas. Um momento...'
        }
      }
    ],
    connections: [
      { id: 'e1', source: 'trigger-1', target: 'ai-1' },
      { id: 'e2', source: 'ai-1', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', target: 'action-1', label: 'Sim' },
      { id: 'e4', source: 'condition-1', target: 'action-2', label: 'Não' }
    ]
  },

  {
    id: 'sales-funnel',
    name: 'Funil de Vendas',
    description: 'Move leads através do funil de vendas baseado em interações',
    icon: ShoppingCart,
    color: 'bg-green-500',
    category: 'sales',
    preview: 'Identifica interesse de compra e move pelo funil automaticamente',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Interesse em Produto',
          triggerType: 'KEYWORD',
          keywords: ['preço', 'valor', 'comprar', 'orçamento']
        }
      },
      {
        id: 'crm-1',
        type: 'crmFunnel',
        position: { x: 100, y: 250 },
        data: {
          label: 'Mover para Interesse',
          fromStage: 'lead',
          toStage: 'interesse',
          condition: 'Demonstrou interesse em produto',
          stages: [
            { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
            { id: 'interesse', name: 'Interesse', color: 'bg-yellow-500' },
            { id: 'proposta', name: 'Proposta', color: 'bg-orange-500' },
            { id: 'fechamento', name: 'Fechamento', color: 'bg-green-500' }
          ]
        }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 100, y: 450 },
        data: {
          label: 'Enviar Catálogo',
          actionType: 'SEND_MEDIA',
          message: 'Aqui está nosso catálogo completo! 📋',
          mediaType: 'document'
        }
      },
      {
        id: 'action-2',
        type: 'action',
        position: { x: 400, y: 250 },
        data: {
          label: 'Notificar Vendedor',
          actionType: 'NOTIFY_TEAM',
          team: 'vendas',
          message: 'Novo lead qualificado: {{contact.name}} demonstrou interesse'
        }
      }
    ],
    connections: [
      { id: 'e1', source: 'trigger-1', target: 'crm-1' },
      { id: 'e2', source: 'crm-1', target: 'action-1' },
      { id: 'e3', source: 'crm-1', target: 'action-2' }
    ]
  }
];

export default whatsappTemplates;