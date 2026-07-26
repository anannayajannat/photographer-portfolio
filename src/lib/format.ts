export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/** Rough print size at a standard 300dpi — genuinely useful for a buyer
 * deciding if a file is large enough for the print size they have in mind,
 * not a precise guarantee (actual print quality also depends on viewing
 * distance, paper, etc.). */
export function estimatePrintSize(width: number, height: number): string {
  const DPI = 300;
  const w = (width / DPI).toFixed(1);
  const h = (height / DPI).toFixed(1);
  return `${w} × ${h} in`;
}
