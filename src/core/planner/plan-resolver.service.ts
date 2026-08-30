import { Injectable, Logger } from '@nestjs/common';
import RuntimeContext from '../runtime-context-builder/runtime-context';
import AppCapabilitiesRegistryService from '../app-capabilities/app-capabilities-registry.service';
import { ConversationRef } from '../platform/common/conversation-ref';
import { IPlan } from './planner';
import { Capability } from '../../common/capability/capability';
import { ZodSchema } from 'zod/v3';

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
    const capabilities = [
      ...context.platform.getAllCapabilities(),
      ...this.appCapabilitiesRegistry.getRegistry(),
    ] as Capability<unknown, ZodSchema>[];
    for (let planItem of plan) {
      const capability: Capability<unknown, ZodSchema> | undefined =
        capabilities.find((el) => el.name === planItem.name);

      try {
        capability?.schema.parse(planItem);
        await capability?.execute(planResolverContext, planItem);
      } catch (err) {
        this.logger.error(
          `Error while resolving capability ${capability?.name}`,
        );
      }
    }
  }
}
