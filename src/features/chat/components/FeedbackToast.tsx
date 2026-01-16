"use client";
import { Text } from "@/components/ui/Text";

type FeedbackToastProps = {
  message: string;
};

export default function FeedbackToast({ message }: FeedbackToastProps) {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="max-w-xs rounded-md bg-foreground p-2 shadow-lg">
        <Text variant="sm" color="white" leading="relaxed">
          {message}
        </Text>
      </div>
    </div>
  );
}
