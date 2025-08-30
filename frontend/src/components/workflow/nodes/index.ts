import TriggerNode from './TriggerNode';
import ActionNode from './ActionNode';
import ConditionNode from './ConditionNode';
import DelayNode from './DelayNode';
import EndNode from './EndNode';

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  end: EndNode,
};

export {
  TriggerNode,
  ActionNode,
  ConditionNode,
  DelayNode,
  EndNode,
};