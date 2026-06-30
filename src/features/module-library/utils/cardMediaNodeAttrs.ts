/** Read `object_name` from TipTap / ProseMirror attrs (camelCase or snake_case). */
export function readObjectNameFromNodeAttrs(
  attrs: Record<string, unknown>,
): string | null {
  const camel = attrs.objectName;
  if (typeof camel === 'string' && camel.trim()) {
    return camel.trim();
  }
  const snake = attrs.object_name;
  if (typeof snake === 'string' && snake.trim()) {
    return snake.trim();
  }
  return null;
}

export function readLegacySrcFromNodeAttrs(
  attrs: Record<string, unknown>,
): string {
  const src = attrs.src;
  return typeof src === 'string' ? src : '';
}

export function mediaFilenameFromNodeAttrs(
  attrs: Record<string, unknown>,
  fallback: string,
): string {
  if (
    typeof attrs.originalFilename === 'string' &&
    attrs.originalFilename.trim()
  ) {
    return attrs.originalFilename.trim();
  }
  if (typeof attrs.alt === 'string' && attrs.alt.trim()) {
    return attrs.alt.trim();
  }
  const objectName = readObjectNameFromNodeAttrs(attrs);
  if (objectName) {
    const segment = objectName.split('/').pop();
    if (segment) return segment;
  }
  return fallback;
}
