"use client";

type ToastProps = {
  message: string;
  position?: "bottom-left" | "bottom-right";
};

export default function Toast({ message, position = "bottom-left" }: ToastProps) {
  const positionClass =
    position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6";

  return (
    <div className={`fixed ${positionClass} z-50`}>
      <div className="max-w-xs rounded-md bg-gray-900 text-white text-xs px-4 py-3 shadow-lg">
        {message}
      </div>
    </div>
  );
}


