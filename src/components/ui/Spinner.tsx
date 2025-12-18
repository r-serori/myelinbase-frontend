export default function Spinner({
  className,
  size = "5",
  color = "background",
}: {
  className?: string;
  size?: string;
  color?: string;
}) {
  return (
    <div
      className={`animate-spin size-${size} border-2 border-${color} border-t-transparent rounded-full ${className}`}
    />
  );
}
