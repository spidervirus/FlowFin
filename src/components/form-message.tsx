export type Message =
  | { success: string }
  | { error: string }
  | { warning: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-green-500 border-l-2 px-4">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-red-500 border-l-2 px-4">
          {message.error}
        </div>
      )}
      {"warning" in message && (
        <div className="text-amber-500 border-l-2 px-4">
          {message.warning}
        </div>
      )}
      {"message" in message && (
        <div className="text-foreground border-l-2 px-4">{message.message}</div>
      )}
    </div>
  );
}
