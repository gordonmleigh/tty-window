import { ColumnContent, ColumnFormatter } from './ColumnFormatter.js';
import { RowBase } from './RowBase.js';
import { ColumnGeometry } from './util/columnWidths.js';

export class ColumnTextRow extends RowBase {
  public static fromGeometry(
    cols: ColumnGeometry[],
    spacing = 1,
  ): ColumnTextRow {
    return new this(new ColumnFormatter(cols, spacing));
  }

  constructor(
    public readonly formatter: ColumnFormatter,
    public content: ColumnContent[] = [],
  ) {
    super();
  }

  public override render(stream: NodeJS.WriteStream): void {
    stream.write(this.formatter.format(this.content, stream.columns));
  }
}
