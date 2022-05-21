import throttle from 'lodash.throttle';
import { Callback, TtyRenderWindowRow } from './TtyRenderWindowRow.js';

export interface TtyRenderWindowOptions {
  disableWordWrap?: boolean;
  fps?: number;
  stream?: NodeJS.WriteStream;
}

export class TtyRenderWindow {
  private readonly _requestRender: Callback;
  private readonly disableWordWrap: boolean;
  private readonly rows: TtyRenderWindowRow[] = [];
  private readonly stream: NodeJS.WriteStream;
  private readonly unsubscribes = new Map<TtyRenderWindowRow, Callback>();

  private deletedRowsSinceLastRender = 0;
  private ended = false;

  /**
   * Whether this instance is connected to a TTY. If not, only interrupts will
   * be rendered.
   */
  public get enabled(): boolean {
    return !!this.stream.isTTY && !this.ended;
  }

  /**
   * Get the number of rows in this window.
   */
  public get height(): number {
    return this.rows.length;
  }

  /**
   * The height of the terminal in characters, if available.
   */
  public get windowHeight(): number {
    return this.stream.isTTY ? this.stream.rows ?? 24 : 0;
  }

  /**
   * The width of the terminal in characters, if available.
   */
  public get windowWidth(): number {
    return this.stream.isTTY ? this.stream.columns ?? 80 : 0;
  }

  /**
   * Create a new instance.
   */
  constructor({
    disableWordWrap = true,
    fps = 15,
    stream = process.stdout,
  }: TtyRenderWindowOptions = {}) {
    this._requestRender = throttle(() => this._render(), 1000 / fps, {
      leading: true,
      trailing: true,
    });
    this.disableWordWrap = disableWordWrap;
    this.stream = stream;
  }

  /**
   * Add a new row to the current instance.
   * @param row The row to add
   * @param index The index to insert the row at. Defaults to the end of the
   * list. If negative, insert this many rows from the end.
   */
  public add(row: TtyRenderWindowRow, index = this.rows.length): void {
    this.rows.splice(index, 0, row);

    if (row.subscribe) {
      this.unsubscribes.set(row, row.subscribe(this._requestRender));
    }

    this._requestRender();
  }

  /**
   * Stop rendering all rows.
   * @param clear True to remove all the output.
   */
  public close(clear = false): void {
    if (clear) {
      this.deletedRowsSinceLastRender += this.rows.length;
      this.rows.splice(0, this.rows.length);
    }
    this._render(!clear);
    this.ended = true;

    for (const [, unsubscribe] of this.unsubscribes) {
      unsubscribe();
    }
    this.unsubscribes.clear();
  }

  /**
   * Interrupt the render window to log a line out to the underlying stream.
   * @param text The text to output to the stream.
   */
  public interrupt(text: string): void {
    this._interruptNoRenderTrigger(text);
    this.render();
  }

  /**
   * Remove the specified row (or row index), optionally replacing it with given
   * text. The replacement text, if given, will always be logged first, followed
   * by the remaining rows in the window on the next render. If no replacement
   * text is given, the last line of the output will be blanked.
   * @param row The row instance, or index to remove.
   * @param replace Optional text to output in place of the row.
   */
  public remove(row: TtyRenderWindowRow | number, replace?: string): void {
    this._removeNoRenderTrigger(row, replace);
    this._requestRender();
  }

  /**
   * Request a render. This will be throttled to the FPS value given in the
   * constructor.
   */
  public render(): void {
    if (!this.enabled) {
      return;
    }
    this._requestRender();
  }

  /**
   * Log the given text and deal with clearing any existing render window
   * output.
   * @param text The text to log.
   */
  private _interruptNoRenderTrigger(text: string): void {
    if (this.enabled) {
      this.stream.cursorTo(0);
      for (const line of text.split('\n')) {
        this.stream.write(line);
        this.stream.clearLine(1);
        this.stream.write('\n');
      }
    } else {
      this.stream.write(text + '\n');
    }
  }

  /**
   * Remove the specified row (or row index), optionally replacing it with given
   * text. The replacement text, if given, will always be logged first, followed
   * by the remaining rows in the window on the next render. If no replacement
   * text is given, the last line of the output will be blanked.
   * @param row The row instance, or index to remove.
   * @param replace Optional text to output in place of the row.
   */
  private _removeNoRenderTrigger(
    row: TtyRenderWindowRow | number,
    replace?: string,
  ): void {
    let index: number;
    let instance: TtyRenderWindowRow;

    if (typeof row === 'number') {
      index = row;
      instance = this.rows[index];

      if (!instance) {
        return;
      }
    } else {
      instance = row;
      index = this.rows.indexOf(instance);

      if (index < 0) {
        return;
      }
    }

    this.rows.splice(index, 1);
    this.unsubscribes.get(instance)?.apply(undefined);

    if (replace) {
      this._interruptNoRenderTrigger(replace);
    } else {
      ++this.deletedRowsSinceLastRender;
    }
  }

  /**
   * Output the row data to the underlying stream, if it is a TTY.
   * @param noResetCursor True to skip resetting the cursor to the start of the
   * window.
   */
  private _render = (noResetCursor = false): number => {
    // first remove any rows which have marked themselves as ended
    for (const row of this.rows) {
      if (row.ended === true) {
        this._removeNoRenderTrigger(row);
      } else if (row.ended) {
        this._removeNoRenderTrigger(row, row.ended);
      }
    }

    // this has to come next so that rows closed above can still emit in non-TTY
    // mode
    if (!this.enabled) {
      return 0;
    }

    const blankRows = noResetCursor ? 0 : this.deletedRowsSinceLastRender;

    if (this.disableWordWrap) {
      // disable word wrap
      this.stream.write('\x1b[?7l');
    }

    let line = 0;

    for (
      ;
      line < this.windowHeight && line < this.rows.length + blankRows;
      ++line
    ) {
      if (line > 0) {
        this.stream.write('\n');
      } else {
        this.stream.cursorTo(0);
      }

      if (line < this.rows.length) {
        this.rows[line].render(this.stream);
      }
      this.stream.clearLine(1);
    }

    if (!noResetCursor) {
      // put the cursor back to the first row of the window
      this.stream.moveCursor(0, -(line - 1));
    } else if (this.deletedRowsSinceLastRender) {
      // we've removed some rows from the end of the output, so put the cursor
      // back to the first non-blank row
      this.stream.moveCursor(0, -this.deletedRowsSinceLastRender);
    }

    if (this.disableWordWrap) {
      // re-enable word wrap
      this.stream.write('\x1b[?7h');
    }

    this.deletedRowsSinceLastRender = 0;
    return line;
  };
}
