import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import userAddressService from '../services/userAddress.service';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../errors/AppError';

class ProfileController {
  /**
   * GET /profile
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getCurrentUserProfile(userId);
      sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /profile
   * Update current user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { fullName, phone, gender, dateOfBirth } = req.body;

      // Validate dateOfBirth if provided
      let parsedDateOfBirth: Date | undefined;
      if (dateOfBirth) {
        parsedDateOfBirth = new Date(dateOfBirth);
        if (isNaN(parsedDateOfBirth.getTime())) {
          throw new ValidationError('Invalid date format for dateOfBirth');
        }
      }

      const updatedUser = await userService.updateCurrentUserProfile(userId, {
        fullName,
        phone,
        gender,
        dateOfBirth: parsedDateOfBirth,
      });

      sendSuccess(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /profile/avatar
   * Update user avatar
   */
  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        throw new ValidationError('avatarUrl is required');
      }

      const updatedUser = await userService.updateUserAvatar(userId, avatarUrl);
      sendSuccess(res, updatedUser, 'Avatar updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /profile/addresses
   * Get all addresses of current user
   */
  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const addresses = await userAddressService.getUserAddresses(userId);
      sendSuccess(res, addresses, 'Addresses retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /profile/addresses
   * Create new address
   */
  createAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { receiverName, receiverPhone, receiverAddress, isDefault } = req.body;

      if (!receiverName || !receiverPhone || !receiverAddress) {
        throw new ValidationError('receiverName, receiverPhone, and receiverAddress are required');
      }

      const address = await userAddressService.createAddress(userId, {
        receiverName,
        receiverPhone,
        receiverAddress,
        isDefault,
      });

      sendSuccess(res, address, 'Address created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /profile/addresses/:id
   * Update address
   */
  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { receiverName, receiverPhone, receiverAddress, isDefault } = req.body;

      const address = await userAddressService.updateAddress(id, userId, {
        receiverName,
        receiverPhone,
        receiverAddress,
        isDefault,
      });

      sendSuccess(res, address, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /profile/addresses/:id
   * Delete address
   */
  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await userAddressService.deleteAddress(id, userId);
      sendSuccess(res, null, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export default new ProfileController();


