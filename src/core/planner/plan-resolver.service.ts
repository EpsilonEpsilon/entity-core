import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import AppCapabilitiesRegistryService from '../app-capabilities/app-capabilities-registry.service';
import { ConversationRef } from '../platform/common/ConversationRef';

interface IPlanResolverContext {
  conversation?: ConversationRef;
}
@Injectable()
export class PlaneResolverService {
  constructor(
    private appCapabilitiesRegistry: AppCapabilitiesRegistryService,
  ) {}
  private logger = new Logger(PlaneResolverService.name);
  async resolve(
    context: RuntimeContext,
    planResolverContext: IPlanResolverContext,
    plan: IPlan[],
  ) {
    this.logger.log(`Resolving plan -> ${JSON.stringify(plan, null, 2)}`);
    const compatibilities = [
      ...context.platform.getAllCapabilities(),
      ...this.appCapabilitiesRegistry.getRegistry(),
    ];
    for (let planItem of plan) {
      const compatibility = compatibilities.find(
        (el) => el.name === planItem.name,
      );
      await compatibility?.execute(planResolverContext, planItem);
    }
  }
}
