import auditLogRepository, {
  AuditLogData,
} from "../repositories/auditLog.repository";
import systemSettingRepository, {
  SystemSettingData,
} from "../repositories/systemSetting.repository";
import { AuditAction, AuditResource } from "../constants";
import { NotFoundError } from "../errors/AppError";

class AdminService {
  private cache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a system setting value by key with in-memory cache
   */
  async getSetting(key: string, defaultValue?: string): Promise<string | null> {
    // Check cache first
    const cachedValue = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);

    if (cachedValue !== undefined && expiry && Date.now() < expiry) {
      return cachedValue;
    }

    // Fetch from database using repository
    const setting = await systemSettingRepository.getByKey(key);
    const value = setting?.value ?? defaultValue ?? null;

    // Update cache
    if (value !== null) {
      this.cache.set(key, value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
    }

    return value;
  }

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

    // Invalidate cache
    this.cache.delete(data.key);
    this.cacheExpiry.delete(data.key);

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

    // Invalidate cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);

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
