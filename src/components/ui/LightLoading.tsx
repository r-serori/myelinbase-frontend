import { Text } from "./Text";

export default function LightLoading({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/icon.png"
        alt="Myelin Base Logo"
        width={32}
        height={32}
        className={`object-contain ${isLoading ? "animate-bounce" : ""}`}
      />
      <Text variant="xl" color="muted" className="pl-1">
        Loading...
      </Text>
    </div>
  );
}
