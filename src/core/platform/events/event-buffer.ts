import { PlatformEvent } from './platform-event';

export class EventBuffer<TEvent extends PlatformEvent = PlatformEvent> {
  constructor(
    public readonly groupedBy: string,
    private readonly items: TEvent[],
  ) {}

  get events(): readonly TEvent[] {
    return this.items;
  }

  get first(): TEvent | undefined {
    return this.items[0];
  }

  get last(): TEvent | undefined {
    return this.items.at(-1);
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  every<T extends PlatformEvent>(
    predicate: (event: PlatformEvent) => event is T,
  ): this is EventBuffer<T> {
    return this.events.every(predicate);
  }
}
