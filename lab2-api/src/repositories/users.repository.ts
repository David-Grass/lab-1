import type { User } from "../types/index.js";

export class UsersRepository {
  private items: User[] = [];

  getAll(): User[] {
    return [...this.items];
  }

  getById(id: number): User | undefined {
    return this.items.find((item) => item.id === id);
  }

  getByEmail(email: string): User | undefined {
    return this.items.find((item) => item.email === email.toLowerCase());
  }

  add(user: User): User {
    this.items.push(user);
    return user;
  }

  update(
    id: number,
    patch: Partial<Pick<User, "name" | "email">>,
  ): User | undefined {
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

export const usersRepository = new UsersRepository();
