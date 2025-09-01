import TriggerNode from './TriggerNode';
import ActionNode from './ActionNode';
import ConditionNode from './ConditionNode';
import DelayNode from './DelayNode';
import EndNode from './EndNode';
import WhatsAppButtonNode from './WhatsAppButtonNode';
import WhatsAppListNode from './WhatsAppListNode';
import AIResponseNode from './AIResponseNode';
import CRMLeadScoreNode from './CRMLeadScoreNode';
import CRMFunnelNode from './CRMFunnelNode';

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  end: EndNode,
  whatsappButton: WhatsAppButtonNode,
  whatsappList: WhatsAppListNode,
  aiResponse: AIResponseNode,
  crmLeadScore: CRMLeadScoreNode,
  crmFunnel: CRMFunnelNode,
};

export {
  TriggerNode,
  ActionNode,
  ConditionNode,
  DelayNode,
  EndNode,
  WhatsAppButtonNode,
  WhatsAppListNode,
  AIResponseNode,
  CRMLeadScoreNode,
  CRMFunnelNode,
};