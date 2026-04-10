/**
 * Generate default tour slot dates for the next N weeks.
 * Returns an array of Date objects for Mondays (1) and Fridays (5).
 */
export function getDefaultSlotDates(weeks: number = 8): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    if (day === 1 || day === 5) {
      // Monday or Friday
      dates.push(d);
    }
  }

  return dates;
}

export function formatSlotDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
