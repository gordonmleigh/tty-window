import { RowBase } from "../../RowBase.js";

export class RandomProgressRow extends RowBase {
  private static count = 0;
  private instance = ++RandomProgressRow.count;
  private progress = 0;

  constructor(private readonly emptyClose = false) {
    super();
    setTimeout(this.start, 1000);
  }

  public override render(stream: NodeJS.WriteStream): void {
    const width = stream.columns - 2;
    const bars = Math.floor(this.progress * width);
    stream.write("[");
    stream.write("".padEnd(bars, "="));
    stream.write("".padEnd(width - bars, " "));
    stream.write("]");
  }

  private start = (): void => {
    if (!this.ended) {
      this.progress += Math.min(1, Math.random() / 5);

      if (this.progress >= 1) {
        this.ended = this.emptyClose ? true : `Done ${this.instance}.`;
      } else {
        this.requestRender();
        setTimeout(this.start, 1000);
      }
    }
  };
}
