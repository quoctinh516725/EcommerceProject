import shopRepository from '../../repositories/shop.repository';
import { NotFoundError, ValidationError } from '../../errors/AppError';
import { ShopStatus } from '../../constants';

export interface ReviewShopApprovalInput {
  shopId: string;
  status: string;
  reason?: string;
}  
class StaffShopService {
  /**
   * Get shops pending approval
   */
  async getPendingShops(page: number = 1, limit: number = 20) {
    const { shops, total } = await shopRepository.findByStatus(ShopStatus.PENDING_APPROVAL, page, limit);
    return {
      items: shops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all shops with status filter
   */
  async getAllShops(status?: string, page: number = 1, limit: number = 20) {
    const { shops, total } = await shopRepository.findAll(status, page, limit);
    return {
      items: shops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get shop by ID
   */
  async getShopById(shopId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Review shop approval (approve or reject)
   */
  async reviewShopApproval(staffId: string, input: ReviewShopApprovalInput) {
    const { shopId, status, reason } = input;
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    if (shop.status !== ShopStatus.PENDING_APPROVAL) {
      throw new ValidationError('Shop is not pending approval');
    }

    // Validate status
    const allowedStatuses = [ShopStatus.ACTIVE, ShopStatus.REJECTED];
    if (!allowedStatuses.includes(status as any)) {
      throw new ValidationError(`Status must be ${ShopStatus.ACTIVE} or ${ShopStatus.REJECTED}`);
    }

    // If rejecting, require rejection reason
    if (status === ShopStatus.REJECTED && !reason) {
      throw new ValidationError('Rejection reason is required when rejecting a shop');
    }

    const updatedShop = await shopRepository.update(shopId, {
      status,
    });

    // TODO: Send notification to seller about approval/rejection
    // TODO: Log action in audit log

    return updatedShop;
  }

  /**
   * Suspend shop (for policy violations)
   */
  async bannedShop(staffId: string, shopId: string, reason: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    if (!reason) {
      throw new ValidationError('Suspension reason is required');
    }

    const updatedShop = await shopRepository.update(shopId, {
      status: ShopStatus.BANNED,
    });

    // TODO: Send notification to seller
    // TODO: Log action in audit log

    return updatedShop;
  }

  /**
   * Activate shop (unban)
   */
  async activateShop(staffId: string, shopId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    const updatedShop = await shopRepository.update(shopId, {
      status: ShopStatus.ACTIVE,
    });

    // TODO: Send notification to seller
    // TODO: Log action in audit log

    return updatedShop;
  }

  /**
   * Update shop status (general method)
   */
  async updateShopStatus(staffId: string, shopId: string, status: string, reason?: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Validate status
    const allowedStatuses = [
      ShopStatus.ACTIVE,
      ShopStatus.INACTIVE,
      ShopStatus.BANNED,
      ShopStatus.REJECTED,
    ];
    if (!allowedStatuses.includes(status as any)) {
      throw new ValidationError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    // Require reason for BANNED or REJECTED
    if ((status === ShopStatus.BANNED || status === ShopStatus.REJECTED) && !reason) {
      throw new ValidationError('Reason is required for banning or rejecting a shop');
    }

    const updatedShop = await shopRepository.update(shopId, {
      status,
    });

    // TODO: Send notification if needed
    // TODO: Log action in audit log

    return updatedShop;
  }
}

export default new StaffShopService();

