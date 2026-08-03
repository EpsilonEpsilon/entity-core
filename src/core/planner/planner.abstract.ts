import RuntimeContext from '../runtime-context-builder/runtime-context';

export interface PlannerInterface<IContext> {
  plan: (context: RuntimeContext, plannerRequest: IContext) => void;
}
