import { ColumnGeometry, columnWidths } from './util/columnWidths.js';

export interface ColumnContent {
  content: string | ((width: number) => string);
  format?: (text: string) => string;
}

export class ColumnFormatter {
  constructor(
    private readonly cols: ColumnGeometry[],
    private readonly spacing = 1,
  ) {}

  public format(content: ColumnContent[], width: number): string {
    const widths = columnWidths(width, this.cols, this.spacing);
    const space = ''.padEnd(this.spacing, ' ');

    return content
      .map((x, i) =>
        x.format
          ? x.format(column(x.content, widths[i]))
          : column(x.content, widths[i]),
      )
      .join(space);
  }
}

function column(
  text: string | ((width: number) => string),
  width: number,
): string {
  if (width === 0) {
    return '';
  }
  if (typeof text === 'function') {
    text = text(width);
  }
  if (text.length > width) {
    return text.slice(0, width - 1) + '…';
  }
  return text.padEnd(width);
}
