export interface ColumnGeometry {
  minWidth: number;
  grow?: number;
}

export function columnWidths(
  width: number,
  cols: ColumnGeometry[],
  spacing = 1,
): number[] {
  width = width - (cols.length - 1) * spacing; // adjust for column spacing
  const total = cols.reduce((sum, x) => sum + x.minWidth, 0);

  if (total > width) {
    const scale = width / total;
    return cols.map((x) => Math.floor(scale * x.minWidth));
  } else {
    const remaining = width - total;
    const divide = cols.reduce((count, x) => count + (x.grow ?? 0), 0);
    if (!divide) {
      return cols.map((x) => x.minWidth);
    }
    return cols.map((x) =>
      x.grow
        ? Math.floor(x.minWidth + (x.grow * remaining) / divide)
        : x.minWidth,
    );
  }
}
