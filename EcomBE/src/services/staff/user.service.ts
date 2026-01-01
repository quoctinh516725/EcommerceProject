import userRepository from "../../repositories/user.repository";
import { NotFoundError, ValidationError } from "../../errors/AppError";
import { UserStatus } from "../../constants";
import auditLogRepository from "../../repositories/auditLog.repository";
import { AuditAction, AuditResource } from "../../constants";

class StaffUserService {
  /**
   * Get all users with status filter
   */
  async getAllUsers(status?: string, page: number = 1, limit: number = 20) {
    const { users, total } = await userRepository.findAll(status, page, limit);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  /**
   * Lock user account
   */
  async lockUser(staffId: string, userId: string, reason: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!reason) {
      throw new ValidationError("Lock reason is required");
    }

    const updatedUser = await userRepository.update(userId, {
      status: UserStatus.INACTIVE,
    });

    // TODO: Send notification to user

    // Log action in audit log
    await auditLogRepository.create({
      userId: staffId,
      action: AuditAction.LOCK_USER,
      resource: AuditResource.USER,
      resourceId: userId,
      details: JSON.stringify({ reason }),
    });

    return updatedUser;
  }

  /**
   * Unlock user account
   */
  async unlockUser(staffId: string, userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await userRepository.update(userId, {
      status: UserStatus.ACTIVE,
    });

    // TODO: Send notification to user

    // Log action in audit log
    await auditLogRepository.create({
      userId: staffId,
      action: AuditAction.UNLOCK_USER,
      resource: AuditResource.USER,
      resourceId: userId,
    });

    return updatedUser;
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    staffId: string,
    userId: string,
    status: string,
    reason?: string
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Validate status
    const allowedStatuses = [UserStatus.ACTIVE, UserStatus.INACTIVE];
    if (!allowedStatuses.includes(status as any)) {
      throw new ValidationError(
        `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
      );
    }

    // Require reason for INACTIVE
    if (status === UserStatus.INACTIVE && !reason) {
      throw new ValidationError("Reason is required for deactivating a user");
    }

    const updatedUser = await userRepository.update(userId, {
      status: status as UserStatus,
    });

    // TODO: Send notification if needed

    // Log action in audit log
    await auditLogRepository.create({
      userId: staffId,
      action: AuditAction.UPDATE_USER_STATUS,
      resource: AuditResource.USER,
      resourceId: userId,
      details: JSON.stringify({ status, reason }),
    });

    return updatedUser;
  }
}

export default new StaffUserService();
