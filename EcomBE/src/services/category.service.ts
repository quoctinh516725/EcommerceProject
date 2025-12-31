import categoryRepository from '../repositories/category.repository';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import { generateSlug } from '../utils/slug';
export interface CreateCategoryInput {
  parentId?: string | null;
  name: string;
  slug?: string;
  description?: string;
  level?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  parentId?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  level?: number;
  sortOrder?: number;
  isActive?: boolean;
}

class CategoryService {
  /**
   * Get category tree (all active categories in tree structure)
   */
  async getCategoryTree(activeOnly: boolean = false) {
    return categoryRepository.getCategoryTree(activeOnly);
  }

  /**
   * Get all categories
   */
  async getAllCategories(includeInactive: boolean = false) {
    if (includeInactive) {
      return categoryRepository.findAll();
    }
    return categoryRepository.findAllActive();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  /**
   * Get children of a category
   */
  async getCategoryChildren(parentId: string | null, activeOnly: boolean = false) {
    return categoryRepository.findChildren(parentId, activeOnly);
  }

  /**
   * Create new category
   */
  async createCategory(input: CreateCategoryInput) {
    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.name);

    // Check if slug exists
    const slugExists = await categoryRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError(`Category with slug "${slug}" already exists`);
    }

    // Validate parent if provided
    if (input.parentId) {
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
      // Calculate level based on parent
      input.level = (parent.level || 0) + 1;
    } else {
      input.level = 0;
    }

    const newCategory = await categoryRepository.create({
      parentId: input.parentId ?? null,
      name: input.name,
      slug,
      description: input.description,
      level: input.level,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    });

    // Clear category cache when new category is created
    const { deleteCachePattern } = await import('../utils/cache');
    deleteCachePattern('category:*').catch(console.error);

    return newCategory;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check slug if provided
    if (input.slug && input.slug !== category.slug) {
      const slugExists = await categoryRepository.slugExists(input.slug);
      if (slugExists) {
        throw new ConflictError(`Category with slug "${input.slug}" already exists`);
      }
    }

    // Validate parent if changed
    if (input.parentId !== undefined && input.parentId !== category.parentId) {
      if (input.parentId) {
        const parent = await categoryRepository.findById(input.parentId);
        if (!parent) {
          throw new NotFoundError('Parent category not found');
        }
        // Prevent circular reference
        if (input.parentId === id) {
          throw new ValidationError('Category cannot be its own parent');
        }
        // Check if parent is not a descendant
        const isDescendant = await this.isDescendant(input.parentId, id);
        if (isDescendant) {
          throw new ValidationError('Category cannot be a descendant of itself');
        }
        input.level = (parent.level || 0) + 1;
      } else {
        input.level = 0;
      }
    }

    const updatedCategory = await categoryRepository.update(id, input);

    // If name changed, sync all related products to MeiliSearch
    if (input.name && input.name !== category.name) {
      // Import here to avoid circular dependency
      const productService = (await import('./product.service')).default;
      productService.syncProductsByCategoryId(id).catch(console.error);
    }

    return updatedCategory;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has children
    const children = await categoryRepository.findChildren(id);
    if (children.length > 0) {
      throw new ConflictError('Cannot delete category with children. Please delete or move children first.');
    }

    const deleted = await categoryRepository.delete(id);

    // Clear category cache when deleted
    const { deleteCachePattern } = await import('../utils/cache');
    deleteCachePattern('category:*').catch(console.error);

    return deleted;
  }

  /**
   * Create multiple categories
   */
  async createManyCategories(inputs: CreateCategoryInput[]) {
    if (!inputs || inputs.length === 0) {
      throw new ValidationError('At least one category is required');
    }

    // Validate all inputs and generate slugs
    const categoriesToCreate: Array<{
      parentId: string | null;
      name: string;
      slug: string;
      description?: string;
      level: number;
      sortOrder: number;
      isActive: boolean;
    }> = [];

    // Map to store parent levels for level calculation
    const parentLevelMap = new Map<string, number>();

    for (const input of inputs) {
      // Generate slug if not provided
      const slug = input.slug || generateSlug(input.name);

      // Check if slug exists
      const slugExists = await categoryRepository.slugExists(slug);
      if (slugExists) {
        throw new ConflictError(`Category with slug "${slug}" already exists`);
      }

      // Validate parent if provided
      let level = 0;
      if (input.parentId) {
        const parent = await categoryRepository.findById(input.parentId);
        if (!parent) {
          throw new NotFoundError(`Parent category with ID "${input.parentId}" not found`);
        }
        level = (parent.level || 0) + 1;
        parentLevelMap.set(input.parentId, parent.level || 0);
      } else if (input.level !== undefined) {
        level = input.level;
      }

      categoriesToCreate.push({
        parentId: input.parentId ?? null,
        name: input.name,
        slug,
        description: input.description,
        level,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      });
    }

    // Create all categories
    return categoryRepository.createMany(categoriesToCreate);
  }

  /**
   * Check if category is descendant of another
   */
  private async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const category = await categoryRepository.findById(descendantId);
    if (!category || !category.parentId) {
      return false;
    }
    if (category.parentId === ancestorId) {
      return true;
    }
    return this.isDescendant(ancestorId, category.parentId);
  }
}

export default new CategoryService();

