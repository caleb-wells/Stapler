export function defaultPdfName(firstFileName: string | undefined): string {
  if (!firstFileName) return 'images.pdf';
  const dot = firstFileName.lastIndexOf('.');
  const stem = dot >= 0 ? firstFileName.slice(0, dot) : firstFileName;
  return stem ? `${stem}.pdf` : 'images.pdf';
}

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
