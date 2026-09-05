import { Injectable } from '@nestjs/common';
import { AppDelayCapability } from './capabilities/app-delay-capability';

@Injectable()
class AppCapabilitiesRegistryService {
  private capabilities = [] as const;
  //new AppDelayCapability()

  getRegistry() {
    return this.capabilities;
  }
}

export default AppCapabilitiesRegistryService;
