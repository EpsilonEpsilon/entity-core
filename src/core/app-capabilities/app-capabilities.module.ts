import { Module } from '@nestjs/common';
import AppCapabilitiesRegistryService from './app-capabilities-registry.service';

@Module({
  providers: [AppCapabilitiesRegistryService],
  exports: [AppCapabilitiesRegistryService],
})
class AppCapabilitiesModule {}

export default AppCapabilitiesModule;
