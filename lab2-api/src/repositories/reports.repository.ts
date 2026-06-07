import type { Report } from "../types/index.js";

export class ReportsRepository {
  private items: Report[] = [];

  getAll(): Report[] {
    return [...this.items];
  }

  getById(id: number): Report | undefined {
    return this.items.find((item) => item.id === id);
  }

  findDuplicate(
    title: string,
    reporter: string,
    excludeId?: number,
  ): Report | undefined {
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedReporter = reporter.trim().toLowerCase();

    return this.items.find(
      (item) =>
        item.id !== excludeId &&
        item.title.trim().toLowerCase() === normalizedTitle &&
        item.reporter.trim().toLowerCase() === normalizedReporter,
    );
  }

  add(report: Report): Report {
    this.items.push(report);
    return report;
  }

  update(id: number, patch: Partial<Omit<Report, "id">>): Report | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    this.items[index] = { ...this.items[index], ...patch };
    return this.items[index];
  }

  delete(id: number): boolean {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }
}

export const reportsRepository = new ReportsRepository();
