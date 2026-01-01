import prisma from "../config/database";

export interface SystemSettingData {
  key: string;
  value: string;
  description?: string;
}

class SystemSettingRepository {
  /**
   * Get all settings
   */
  async getAll() {
    return prisma.systemSetting.findMany();
  }

  /**
   * Get setting by key
   */
  async getByKey(key: string) {
    return prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  /**
   * Create or update setting (Upsert)
   */
  async upsert(data: SystemSettingData) {
    return prisma.systemSetting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        description: data.description,
      },
      create: {
        key: data.key,
        value: data.value,
        description: data.description,
      },
    });
  }

  /**
   * Delete setting by key
   */
  async deleteByKey(key: string) {
    return prisma.systemSetting.delete({
      where: { key },
    });
  }
}

export default new SystemSettingRepository();
