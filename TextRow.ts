import { RowBase } from "./RowBase.js";

export class TextRow extends RowBase {
  constructor(initialText = "") {
    super();
    this._text = initialText;
  }

  public get text(): string {
    return this._text;
  }
  public set text(value: string) {
    this._text = value;
    this.requestRender();
  }
  private _text: string;

  public render(stream: NodeJS.WriteStream): void {
    stream.write(this.text);
  }
}
