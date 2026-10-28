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
    <div className="max-w-[90%] rounded-2xl border border-amber-300 bg-white p-4 shadow-lg shadow-orange-900/10">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Confirmation required to book
      </div>

      <div className="mb-3 flex items-start gap-2 text-sm text-stone-700">
        <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-0.5">
          <p className="font-semibold text-stone-900">{data.room_name}</p>
          <p className="text-stone-500">
            {data.check_in} to {data.check_out} · {data.nights} nights
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between border-t border-orange-100 pt-2 text-sm font-semibold text-stone-900">
        <span>Total</span>
        <span>${data.total}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirm & Book
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
