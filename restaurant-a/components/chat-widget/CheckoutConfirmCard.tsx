// components/chat-widget/CheckoutConfirmCard.tsx
import { CheckCircle2, XCircle } from "lucide-react";
import type { CheckoutInterruptData } from "./types";

interface Props {
  data: CheckoutInterruptData;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}


export function CheckoutConfirmCard({ data, onConfirm, onCancel, disabled }: Props) {
  const items = data.summary.split("\n").filter(Boolean);

  return (
    <div className="max-w-[90%] rounded-2xl border border-amber-400/40 bg-slate-800/80 p-4 shadow-lg shadow-amber-900/10">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Confirmation required to place order
      </div>

      <ul className="mb-3 space-y-1 text-sm text-slate-200">
        {items.map((line, idx) => (
          <li key={idx}>{line.replace(/^-\s*/, "")}</li>
        ))}
      </ul>

      <div className="mb-4 flex items-center justify-between border-t border-slate-700 pt-2 text-sm font-semibold text-white">
        <span>Total</span>
        <span>${data.total}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirm & Submit
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}