"use client";

export default function FormError({ error }: { error: string }) {
  if (!error) return null;

  return (
    <p className="text-red-400 font-semibold text-center mt-2">{error}</p>
  );
}
