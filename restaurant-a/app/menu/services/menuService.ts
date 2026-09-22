import { dishRepository } from "../repositories/dishRepository";
import { Meal } from "../entities/Dish";

export const menuService = {
  async getMenu(): Promise<Meal[]> {
    const dishes = await dishRepository.getAll();
    // می‌توانیم مرتب‌سازی یا فیلتر اضافه کنیم، مثلا بر اساس قیمت یا حروف
    return dishes.sort((a, b) => a.title.localeCompare(b.title));
  }
};
