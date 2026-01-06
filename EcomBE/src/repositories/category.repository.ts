import prisma from "../config/database";

export interface CreateCategoryData {
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string;
  level?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  parentId?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  level?: number;
  sortOrder?: number;
  isActive?: boolean;
}

class CategoryRepository {
  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  }

  async findChildren(parentId: string | null, activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};
    return prisma.category.findMany({
      where: { parentId, ...where },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findAllActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Find all categories (including inactive)
   */
  async findAll() {
    return prisma.category.findMany({
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });
  }

  /**
   * Find categories by parent ID
   */
  async findByParentId(parentId: string | null) {
    return prisma.category.findMany({
      where: { parentId },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return category !== null;
  }

  async create(data: CreateCategoryData) {
    return prisma.category.create({
      data: {
        parentId: data.parentId ?? null,
        name: data.name,
        slug: data.slug,
        description: data.description,
        level: data.level ?? 0,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateCategoryData) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Hard delete; có thể đổi thành soft delete nếu cần
    return prisma.category.delete({ where: { id } });
  }

  /**
   * Create multiple categories
   */
  async createMany(categories: CreateCategoryData[]) {
    return prisma.category.createMany({
      data: categories.map((cat) => ({
        parentId: cat.parentId ?? null,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        level: cat.level ?? 0,
        sortOrder: cat.sortOrder ?? 0,
        isActive: cat.isActive ?? true,
      })),
    });
  }

  async getCategoryTree(activeOnly: boolean = false) {
    const where = activeOnly ? { isActive: true } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    const map = new Map<string, any>();
    const roots: any[] = [];

    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const node = map.get(cat.id);
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}

export default new CategoryRepository();
