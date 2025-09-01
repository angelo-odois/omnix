import { wahaClient } from '../modules/whatsapp/wahaClient';
import { contactService } from '../modules/contacts/service';
import { aiService } from './aiService';
import prisma from '../lib/database';

interface WorkflowExecutionContext {
  tenantId: string;
  contactPhone: string;
  contactName?: string;
  conversationId: string;
  instanceId: string;
  sessionName: string;
  lastMessage?: string;
  variables: Record<string, any>;
}

interface WorkflowNode {
  id: string;
  type: string;
  data: any;
}

class WorkflowExecutor {
  
  async executeNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    try {
      console.log(`🔄 Executing node ${node.id} of type ${node.type}`);
      
      switch (node.type) {
        case 'whatsappButton':
          return await this.executeWhatsAppButtonNode(node, context);
        
        case 'whatsappList':
          return await this.executeWhatsAppListNode(node, context);
        
        case 'aiResponse':
          return await this.executeAIResponseNode(node, context);
        
        case 'crmLeadScore':
          return await this.executeCRMLeadScoreNode(node, context);
        
        case 'crmFunnel':
          return await this.executeCRMFunnelNode(node, context);
        
        case 'action':
          return await this.executeActionNode(node, context);
        
        default:
          console.warn(`⚠️ Unknown node type: ${node.type}`);
          return { success: false, error: `Unknown node type: ${node.type}` };
      }
    } catch (error: any) {
      console.error(`❌ Error executing node ${node.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  private async executeWhatsAppButtonNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { message, buttons } = node.data;
    
    if (!message || !buttons || buttons.length === 0) {
      return { success: false, error: 'Message and buttons are required' };
    }

    // Send interactive button message via WAHA
    const buttonMessage = {
      text: message,
      buttons: buttons.map((btn: any, index: number) => ({
        id: btn.id || `btn_${index}`,
        title: btn.text
      }))
    };

    try {
      await wahaClient.sendButtonMessage(
        context.sessionName,
        context.contactPhone,
        buttonMessage
      );
      
      console.log(`✅ Button message sent to ${context.contactPhone}`);
      return { success: true, output: { buttonsSent: buttons.length } };
    } catch (error: any) {
      console.error('Error sending button message:', error);
      return { success: false, error: error.message };
    }
  }

  private async executeWhatsAppListNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { title, description, buttonText, sections } = node.data;
    
    if (!title || !sections || sections.length === 0) {
      return { success: false, error: 'Title and sections are required' };
    }

    // Send interactive list message via WAHA
    const listMessage = {
      text: description || title,
      button: buttonText || 'Ver opções',
      sections: sections.map((section: any) => ({
        title: section.title,
        rows: section.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description
        }))
      }))
    };

    try {
      await wahaClient.sendListMessage(
        context.sessionName,
        context.contactPhone,
        listMessage
      );
      
      console.log(`✅ List message sent to ${context.contactPhone}`);
      return { success: true, output: { sectionsCount: sections.length } };
    } catch (error: any) {
      console.error('Error sending list message:', error);
      return { success: false, error: error.message };
    }
  }

  private async executeAIResponseNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { prompt, tone, maxLength, useContext } = node.data;
    
    if (!prompt) {
      return { success: false, error: 'AI prompt is required' };
    }

    try {
      // Get conversation context if requested
      let conversationContext = '';
      if (useContext && context.conversationId) {
        const recentMessages = await prisma.message.findMany({
          where: { conversationId: context.conversationId },
          orderBy: { timestamp: 'desc' },
          take: 10
        });
        
        conversationContext = recentMessages
          .reverse()
          .map(msg => `${msg.isInbound ? 'Cliente' : 'Atendente'}: ${msg.content}`)
          .join('\n');
      }

      // Generate AI response
      const aiResponse = await aiService.generateResponse(
        prompt,
        conversationContext,
        context.contactName,
        { tone, maxLength }
      );

      // Send the AI response
      await wahaClient.sendTextMessage(
        context.sessionName,
        context.contactPhone,
        aiResponse
      );
      
      console.log(`✅ AI response sent to ${context.contactPhone}`);
      return { success: true, output: { response: aiResponse } };
    } catch (error: any) {
      console.error('Error generating/sending AI response:', error);
      return { success: false, error: error.message };
    }
  }

  private async executeCRMLeadScoreNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { scoreRules, threshold, actionOnThreshold } = node.data;
    
    if (!scoreRules || scoreRules.length === 0) {
      return { success: false, error: 'Score rules are required' };
    }

    try {
      // Calculate score based on rules (simplified)
      let totalScore = 0;
      const appliedRules: string[] = [];

      for (const rule of scoreRules) {
        // Simple rule evaluation (can be expanded)
        const ruleApplies = await this.evaluateScoreRule(rule, context);
        if (ruleApplies) {
          totalScore += rule.points;
          appliedRules.push(rule.description);
        }
      }

      // Save score to contact
      const contact = await contactService.findContact(context.tenantId, context.contactPhone);
      if (contact) {
        await contactService.updateContact(contact.id, {
          customFields: {
            ...contact.customFields,
            leadScore: totalScore,
            lastScoreUpdate: new Date().toISOString(),
            appliedRules
          }
        });
      }

      console.log(`📊 Lead score calculated: ${totalScore} points for ${context.contactPhone}`);

      // Check threshold action
      if (threshold && totalScore >= threshold && actionOnThreshold) {
        console.log(`🎯 Threshold reached! Executing: ${actionOnThreshold}`);
        // TODO: Execute threshold action
      }

      return { 
        success: true, 
        output: { 
          score: totalScore, 
          appliedRules,
          thresholdReached: threshold && totalScore >= threshold
        } 
      };
    } catch (error: any) {
      console.error('Error calculating lead score:', error);
      return { success: false, error: error.message };
    }
  }

  private async executeCRMFunnelNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { fromStage, toStage, condition } = node.data;
    
    if (!fromStage || !toStage) {
      return { success: false, error: 'From stage and to stage are required' };
    }

    try {
      // Update contact's funnel stage
      const contact = await contactService.findContact(context.tenantId, context.contactPhone);
      if (contact) {
        await contactService.updateContact(contact.id, {
          customFields: {
            ...contact.customFields,
            funnelStage: toStage,
            previousStage: fromStage,
            stageMovedAt: new Date().toISOString(),
            moveReason: condition || 'Workflow automation'
          }
        });

        console.log(`📈 Contact moved in funnel: ${fromStage} → ${toStage} (${context.contactPhone})`);
      }

      return { 
        success: true, 
        output: { 
          fromStage, 
          toStage, 
          condition,
          movedAt: new Date().toISOString()
        } 
      };
    } catch (error: any) {
      console.error('Error moving contact in funnel:', error);
      return { success: false, error: error.message };
    }
  }

  private async executeActionNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ) {
    const { actionType, message } = node.data;
    
    switch (actionType) {
      case 'SEND_MESSAGE':
        try {
          // Replace variables in message
          const processedMessage = this.processMessageVariables(message, context);
          
          await wahaClient.sendTextMessage(
            context.sessionName,
            context.contactPhone,
            processedMessage
          );
          
          return { success: true, output: { messageSent: processedMessage } };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      
      case 'ADD_TAG':
        try {
          const contact = await contactService.findContact(context.tenantId, context.contactPhone);
          if (contact) {
            const newTags = [...new Set([...contact.tags, node.data.tag])];
            await contactService.updateContact(contact.id, { tags: newTags });
            return { success: true, output: { tagAdded: node.data.tag } };
          }
          return { success: false, error: 'Contact not found' };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      
      default:
        return { success: false, error: `Unknown action type: ${actionType}` };
    }
  }

  private async evaluateScoreRule(rule: any, context: WorkflowExecutionContext): Promise<boolean> {
    // Simplified rule evaluation - can be expanded with complex logic
    const { condition } = rule;
    
    // Example conditions
    if (condition.includes('interesse')) {
      return context.lastMessage?.toLowerCase().includes('interesse') || false;
    }
    
    if (condition.includes('empresa média')) {
      // Check if contact has company size info
      const contact = await contactService.findContact(context.tenantId, context.contactPhone);
      return contact?.customFields?.companySize === 'media' || false;
    }
    
    return false; // Default to false for unknown conditions
  }

  private processMessageVariables(message: string, context: WorkflowExecutionContext): string {
    return message
      .replace(/\{\{contact\.name\}\}/g, context.contactName || 'Cliente')
      .replace(/\{\{contact\.phone\}\}/g, context.contactPhone)
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString('pt-BR'))
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('pt-BR'));
  }
}

export const workflowExecutor = new WorkflowExecutor();
export default workflowExecutor;