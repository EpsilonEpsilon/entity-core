import { Injectable } from '@nestjs/common';
import { AppDelayCapability } from './capabilities/app-delay-capability';

@Injectable()
class AppCapabilitiesRegistryService {
  private capabilities = [new AppDelayCapability()] as const;

  getRegistry() {
    return this.capabilities;
  }
}

export default AppCapabilitiesRegistryService;
