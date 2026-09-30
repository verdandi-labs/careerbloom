import { Trash2 } from "lucide-react";

export function ConversationDeleteControl({
  isDeleting,
  onDelete,
  onCancel,
  onConfirm,
}: {
  isDeleting: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (isDeleting) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground/60">Delete?</span>
        <button
          onClick={onCancel}
          className="text-xs text-foreground/40 hover:text-foreground"
        >
          No
        </button>
        <button
          onClick={onConfirm}
          className="text-xs font-medium text-rose-500 hover:text-rose-700"
        >
          Yes
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onDelete}
      className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-foreground/60 hover:bg-white"
      title="Delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
