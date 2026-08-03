import { AccountCredentials } from '../../entities/account/types';
import { Capability } from '../../common/capability/capability';
import { Observable } from 'rxjs';
import { PlatformEvent } from './events/PlatformEvent';
import { AbstractType } from '../../types';

export enum PlatformRuntimeConnectionState {
  Idle,
  Connected,
  Connecting,
  Disconnected,
  Disconnecting,
}

export abstract class PlatformRuntime {
  public $events: Observable<PlatformEvent>;
  abstract init(credentials: AccountCredentials): Promise<void>;
  public abstract connectionState: PlatformRuntimeConnectionState;
  protected abstract capabilities: Capability[];
  public get<T extends Capability>(capability: AbstractType<T>): T | undefined {
    return this.capabilities.find(
      (platformCapability) => platformCapability instanceof capability,
    ) as T | undefined;
  }

  getAllCapabilities(): Readonly<Capability>[] {
    return this.capabilities as Readonly<Capability>[];
  }

  public has(capability: AbstractType<Capability<any, any>>) {
    return !!this.capabilities.find(
      (platformCapability) => platformCapability instanceof capability,
    );
  }
}
