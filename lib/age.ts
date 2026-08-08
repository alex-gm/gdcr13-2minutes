export function formatAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 1) return `${months} mo`;
  if (years < 3) return `${years} yr ${months} mo`;
  return `${years} yr`;
}

export function yearsUntilEighteen(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const eighteenth = new Date(birth);
  eighteenth.setFullYear(birth.getFullYear() + 18);
  const now = new Date();
  const diffMs = eighteenth.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}
