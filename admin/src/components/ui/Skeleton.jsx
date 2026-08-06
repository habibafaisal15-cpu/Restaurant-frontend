export default function Skeleton({
  width = '100%',
  height = 16,
  circle = false,
  className = '',
}) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : undefined,
  };

  return (
    <div
      className={`skeleton skeleton-component ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}
