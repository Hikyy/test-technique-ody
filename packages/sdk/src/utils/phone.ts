export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

export function phoneMatches(phone: string | null | undefined, needle: string): boolean {
  if (!phone) return false;
  if (!needle.trim()) return true;

  const phoneDigits = digitsOnly(phone);
  const needleDigits = digitsOnly(needle);

  if (needleDigits.length > 0 && phoneDigits.includes(needleDigits)) return true;

  return phone.toLowerCase().includes(needle.toLowerCase());
}
