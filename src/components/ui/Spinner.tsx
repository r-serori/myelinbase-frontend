export default function Spinner({
  className,
  size = "5",
}: {
  className?: string;
  size?: string;
}) {
  return (
    <div
      className={`animate-spin h-${size} w-${size} border-2 border-gray-900 border-t-transparent rounded-full ${className}`}
    />
  );
}
