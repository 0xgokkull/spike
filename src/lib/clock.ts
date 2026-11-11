let offsetDays = 0;

export const clock = {
  getOffsetDays(): number {
    return offsetDays;
  },

  setOffsetDays(days: number): void {
    offsetDays = days;
  },

  now(): Date {
    const base = new Date();
    if (offsetDays !== 0) {
      base.setDate(base.getDate() + offsetDays);
    }
    return base;
  },

  todayIso(): string {
    return this.now().toISOString().split('T')[0];
  },
};

