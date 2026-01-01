import auditLogRepository, {
  AuditLogData,
} from "../repositories/auditLog.repository";
import systemSettingRepository, {
  SystemSettingData,
} from "../repositories/systemSetting.repository";
import { AuditAction, AuditResource } from "../constants";
import { NotFoundError } from "../errors/AppError";

class AdminService {
  /**
   * Get all system settings
   */
  async getSystemSettings() {
    return systemSettingRepository.getAll();
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(adminId: string, data: SystemSettingData) {
    const oldValue = await systemSettingRepository.getByKey(data.key);
    const setting = await systemSettingRepository.upsert(data);

    // Log action
    await auditLogRepository.create({
      userId: adminId,
      action: AuditAction.UPDATE_SYSTEM_SETTING,
      resource: AuditResource.SYSTEM_SETTING,
      resourceId: setting.key,
      details: JSON.stringify({
        oldValue: oldValue?.value,
        newValue: data.value,
      }),
    });

    return setting;
  }

  /**
   * Delete system setting
   */
  async deleteSystemSetting(adminId: string, key: string) {
    const setting = await systemSettingRepository.getByKey(key);
    if (!setting) {
      throw new NotFoundError("System setting not found");
    }

    await systemSettingRepository.deleteByKey(key);

    // Log action
    await auditLogRepository.create({
      userId: adminId,
      action: AuditAction.DELETE_SYSTEM_SETTING,
      resource: AuditResource.SYSTEM_SETTING,
      resourceId: key,
      details: JSON.stringify({ deletedValue: setting.value }),
    });

    return true;
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters: AuditLogData, page: number, limit: number) {
    return auditLogRepository.getAll(filters, page, limit);
  }
}

export default new AdminService();
