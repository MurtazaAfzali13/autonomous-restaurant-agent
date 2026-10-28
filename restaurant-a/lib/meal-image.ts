
const MEAL_IMAGE_DIR = "/images/meals";

export function resolveMealImage(src?: string | null): string | null {
  const value = src?.trim();
  if (!value) return null;
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/")) return value;
  if (value.startsWith("images/")) return `/${value}`;
  return `${MEAL_IMAGE_DIR}/${value}`;
}
