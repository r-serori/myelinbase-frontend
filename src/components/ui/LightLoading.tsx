import Image from "next/image";

import { Text } from "./Text";

export default function LightLoading() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/images/icon.png"
        alt="Myelin Base Logo"
        width={32}
        height={32}
        className="object-contain"
      />
      <Text variant="xl" color="muted" className="pl-1 thinking-text">
        Loading...
      </Text>
    </div>
  );
}
