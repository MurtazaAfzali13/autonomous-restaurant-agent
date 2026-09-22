"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-teal-600 hover:bg-teal-500 transition p-3 rounded-md text-white font-semibold"
    >
      {pending ? "Sending..." : "Add Meal"}
    </button>
  );
}
