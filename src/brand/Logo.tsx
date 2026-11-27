export function Brand({ height = 28 }: { height?: number }) {
  return <img src="/brand/wordmark.svg" alt="Flutics" height={height} style={{ height, width: 'auto' }} />;
}
