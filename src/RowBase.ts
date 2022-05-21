import { Callback, TtyRenderWindowRow } from './TtyRenderWindowRow.js';

export abstract class RowBase implements TtyRenderWindowRow {
  private readonly listeners: Callback[] = [];

  public get active(): boolean {
    return this.listeners.length > 0;
  }

  public get ended(): boolean | string {
    return this._ended;
  }
  public set ended(value: boolean | string) {
    this._ended = value;
    this.requestRender();
  }
  private _ended: boolean | string = false;

  public abstract render(stream: NodeJS.WriteStream): void;

  public subscribe(listener: Callback): Callback {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  protected requestRender(): void {
    for (const listener of this.listeners.slice()) {
      listener();
    }
  }
}
