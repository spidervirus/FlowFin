import React from "react";

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  );
} 