import userAddressRepository from '../repositories/userAddress.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError';

export interface CreateAddressInput {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  isDefault?: boolean;
}

class UserAddressService {
  /**
   * Get all addresses of current user
   */
  async getUserAddresses(userId: string) {
    return userAddressRepository.findByUserId(userId);
  }

  /**
   * Get address by ID (check ownership)
   */
  async getAddressById(addressId: string, userId: string) {
    const address = await userAddressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this address');
    }

    return address;
  }

  /**
   * Create new address
   */
  async createAddress(userId: string, input: CreateAddressInput) {
    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(input.receiverPhone)) {
      throw new ValidationError('Invalid phone format');
    }

    return userAddressRepository.create({
      userId,
      receiverName: input.receiverName,
      receiverPhone: input.receiverPhone,
      receiverAddress: input.receiverAddress,
      isDefault: input.isDefault || false,
    });
  }

  /**
   * Update address (check ownership)
   */
  async updateAddress(addressId: string, userId: string, input: UpdateAddressInput) {
    const address = await userAddressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this address');
    }

    // Validate phone if provided
    if (input.receiverPhone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(input.receiverPhone)) {
        throw new ValidationError('Invalid phone format');
      }
    }

    return userAddressRepository.update(addressId, input);
  }

  /**
   * Delete address (check ownership)
   */
  async deleteAddress(addressId: string, userId: string) {
    const address = await userAddressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this address');
    }

    await userAddressRepository.delete(addressId);
  }
}

export default new UserAddressService();


