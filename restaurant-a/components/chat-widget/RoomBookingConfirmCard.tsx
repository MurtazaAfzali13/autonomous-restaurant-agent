// components/chat-widget/RoomBookingConfirmCard.tsx
import { BedDouble, CheckCircle2, XCircle } from "lucide-react";
import type { RoomBookingInterruptData } from "./types";

interface Props {
  data: RoomBookingInterruptData;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}


export function RoomBookingConfirmCard({ data, onConfirm, onCancel, disabled }: Props) {
  return (
    <div className="max-w-[90%] rounded-2xl border border-sky-400/40 bg-slate-800/80 p-4 shadow-lg shadow-sky-900/10">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-sky-300">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        Confirmation required to book
      </div>

      <div className="mb-3 flex items-start gap-2 text-sm text-slate-200">
        <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div className="space-y-0.5">
          <p className="font-semibold text-white">{data.room_name}</p>
          <p className="text-slate-400">
            {data.check_in} to {data.check_out} · {data.nights} nights
          </p>
        </div>
      </div>

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
          Confirm & Book
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