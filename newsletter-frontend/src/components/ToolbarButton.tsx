import { LucideIcon } from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  active?: boolean;
}

export function ToolbarButton({ onClick, icon: Icon, title, active }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors ${
        active
          ? "bg-purple-100 text-purple-700"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}