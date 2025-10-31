// 工具配置
export * from "./tools-config";

// 当前时间工具
export * from "./current-time-tool";

// 家电工具
export * from "./appliance-tools";

// 工具实例导入
import { getProductDetailsTool } from "./get-product-details-tool";
import { filterItemsTool } from "./filter-items-tool";
import { currentTimeTool } from "./current-time-tool";
import {
  applianceSearchTool,
  applianceCompareTool,
  applianceRecommendTool,
} from "./appliance-tools";

// 工具集合
export const productTools = {
  getProductDetails: getProductDetailsTool,
  filterItems: filterItemsTool,
};

export const utilityTools = {
  currentTime: currentTimeTool,
};

export const applianceTools = {
  search: applianceSearchTool,
  compare: applianceCompareTool,
  recommend: applianceRecommendTool,
};

// 所有工具的集合
export const allTools = {
  ...productTools,
  ...utilityTools,
  ...applianceTools,
};

// 工具管理器
export class ToolManager {
  private tools = allTools;

  /**
   * 获取工具实例
   */
  getTool<T extends keyof typeof allTools>(name: T): (typeof allTools)[T] {
    return this.tools[name];
  }

  /**
   * 获取所有工具
   */
  getAllTools() {
    return this.tools;
  }

  /**
   * 获取工具状态
   */
  getToolsStatus() {
    return {
      getProductDetailsTool: getProductDetailsTool.getStatus(),
      filterItemsTool: filterItemsTool.getStatus(),
      // currentTimeTool 是通过 createTool 创建的，没有 getStatus 方法
    };
  }

  /**
   * 清理所有工具资源
   */
  cleanup() {
    filterItemsTool.cleanup();
  }
}

// 创建工具管理器实例
export const toolManager = new ToolManager();

// 默认导出
export const tools = allTools;
