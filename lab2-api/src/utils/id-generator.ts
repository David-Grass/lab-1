export function createCounter(): () => number {
  let next = 0;
  return () => {
    next += 1;
    return next;
  };
}

export const nextUserId = createCounter();
export const nextReportId = createCounter();
