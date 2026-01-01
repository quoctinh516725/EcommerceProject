import productService from '../product.service';
import productRepository from '../../repositories/product.repository';
import { NotFoundError, ValidationError } from '../../errors/AppError';
import { ProductStatus } from '../../constants';

export interface ReviewProductApprovalInput {
  productId: string;
  status: string;
  reason?: string;
}

class StaffProductService {
  /**
   * Get products pending approval
   */
  async getPendingProducts(page: number = 1, limit: number = 20) {
    const { products, total } = await productRepository.findByStatus(
      ProductStatus.PENDING_APPROVAL,
      page,
      limit
    );

    return {
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all products with status filter (for staff review)
   */
  async getAllProducts(status?: string, page: number = 1, limit: number = 20) {
    const { products, total } = await productRepository.findAll(status, page, limit);

    return {
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by ID (staff can view any product)
   */
  async getProductById(productId: string) {
    return productService.getProductById(productId);
  }

  /**
   * Review product approval (approve or reject)
   */
  async reviewProductApproval(staffId: string, input: ReviewProductApprovalInput) {
    const { productId, status, reason } = input;

    // Get product
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Validate status
    const allowedStatuses = [ProductStatus.ACTIVE, ProductStatus.REJECTED];
    if (!allowedStatuses.includes(status as any)) {
      throw new ValidationError(`Status must be ${ProductStatus.ACTIVE} or ${ProductStatus.REJECTED}`);
    }

    // If rejecting, require rejection reason
    if (status === ProductStatus.REJECTED && !reason) {
      throw new ValidationError('Rejection reason is required when rejecting a product');
    }

    // Update product status
    const updatedProduct = await productService.updateProduct(productId, {
      status,
    });

    // TODO: Send notification to seller about approval/rejection
    // TODO: Log action in audit log

    return updatedProduct;
  }

  /**
   * Ban product (for policy violations)
   */
  async banProduct(staffId: string, productId: string, reason: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!reason) {
      throw new ValidationError('Ban reason is required');
    }

    // Update to BANNED status
    const updatedProduct = await productService.updateProduct(productId, {
      status: ProductStatus.BANNED,
    });

    // TODO: Send notification to seller with reason
    // TODO: Log action in audit log

    return updatedProduct;
  }
}

export default new StaffProductService();

