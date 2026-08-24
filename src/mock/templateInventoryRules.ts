/**
 * 【已移除】旧可售库存模型（区域公共 / 全域公共 / 区域私有 / 私有）。
 *
 * 历史职责：
 * - loadTemplateInventoryRules / saveTemplateInventoryRules：公共库存配额
 * - 经销商区域私有 + 私有分配表
 *
 * 现行替代：
 * - 库存池主数据：`@/mock/inventoryPools`
 * - 模板/航次池配额与已售扣减：`@/mock/templatePoolQuotas`
 * - 谁能扣池：价格政策上的 `inventoryPoolId`
 *
 * 请勿再从此文件导出业务 API；保留文件仅为迁移注释锚点。
 */

export {}
