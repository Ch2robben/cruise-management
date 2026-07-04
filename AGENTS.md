# 长航集团游轮管理系统 — Codex 交接文档

## 项目概述

本项目是**长航集团游轮管理系统**的前端 Demo，面向公司内部运营人员的 B 端管理后台，包含管理端和经销商端两套界面。所有数据为前端 mock，无真实后端。

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | React 18 + Vite 5 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 3 |
| 路由 | React Router v6（Hash 路由） |
| 状态 | Zustand（仅 authStore） |
| 图表 | Recharts |
| 图标 | lucide-react |

---

## 运行方式

```bash
cd "/Users/huangchuhua/AI项目/cruise-management"
npm run dev
```

登录账号：`admin` / `123456`

访问地址：`http://localhost:5173`（Hash 路由，实际路径如 `/#/voyage/list`）

---

## 目录结构

```
src/
├── components/
│   ├── common/          # 通用组件（见下方说明）
│   └── layout/          # 布局组件：MainLayout、DealerLayout、Sidebar、Breadcrumb
├── layouts/             # AuthLayout、MainLayout、DealerLayout 包装层
├── mock/                # 所有 mock 数据（见下方说明）
├── pages/               # 页面组件（见下方完整路由表）
├── routes/              # index.tsx — 全部路由注册
├── stores/              # authStore.ts — 登录态
└── types/               # index.ts — 全部 TypeScript 类型
```

---

## 通用组件（src/components/common/）

| 组件名 | 用途 |
|---|---|
| `PageHeader` | 页面顶部标题+描述，统一使用 |
| `DataTable` | 通用表格，支持 columns + data props |
| `SearchPanel` | 搜索区域面板 |
| `FormDialog` | 弹窗表单容器 |
| `DetailDrawer` | 右侧抽屉详情 |
| `ConfirmDialog` | 二次确认对话框（危险操作） |
| `StatusBadge` | 状态标签（统一颜色语义） |
| `CoefficientStepper` | 系数步进器 |

> **重要约定**：新建页面必须优先复用上述组件，不自行封装同类组件。

---

## 数据层（src/mock/）

| 文件 | 内容 |
|---|---|
| `data.ts` | 所有 mock 实体数据（港口、航线、行程、产品、船舶、航次等） |
| `api.ts` | `createCrudApi` 工厂函数 + 专用 API |
| `orderStore.ts` | 订单状态管理 |
| `orderLogStore.ts` | 订单操作日志 |
| `orderListData.ts` | 订单列表 mock |
| `inventoryAllocation.ts` | 库存调配数据 |
| `specialPriceApplications.ts` | 特价申请单 |
| `supplementaryPayment.ts` | 补款单 |
| `templatePriceRules.ts` | 模板价格规则 |
| `templateInventoryRules.ts` | 模板库存规则 |
| `sellRoomTypeConfig.ts` | 售卖房型配置 |
| `ticketClasses.ts` | 票类定义 |
| `itineraryPlanStore.ts` | 行程编排数据 |
| `voyageOversellRules.ts` | 航次超售规则 |
| 其他 | 地区、里程、导航时间等辅助数据 |

---

## 完整路由表

### 管理端（MainLayout，路由前缀 `/`）

**资源管理**

| 路由 | 页面文件 | 说明 |
|---|---|---|
| `/resources/ports` | PortPage | 港口管理，树形表格（港口→码头），表单含码头动态增减 |
| `/resources/attractions` | AttractionPage | 景点管理，游览时长字段，描述超3行截断+全文弹窗 |
| `/resources/routes` | RoutePage | 航线管理，动态停靠港表格，起港/止港/途中港交互 |
| `/resources/itineraries` | ItineraryManagementPage | 行程管理，港口停靠计划编排，**无速度录入字段** |
| `/resources/products` | ProductPage | 产品管理，树形表格，C(n,2)航段生成，基准价+库存配置 |
| `/resources/ships` | ShipPage | 船舶管理，3步向导（基本信息→甲板→舱房），rowSpan嵌套表 |
| `/resources/rooms` | RoomPage | 房间管理，批量生成向导，批量改状态/删除 |
| `/resources/cabins` | CabinPage | 船舱定义与配置 |
| `/resources/sell-room-type-configs` | SellRoomTypeConfigPage | 售卖房型定价配置 |
| `/resources/facilities` | FacilityPage | 设施管理，分类/收费类型/营业状态 |
| `/resources/tickets` | TicketPage | 票类管理，入住类型×价格系数，拼房/加床规则，小费策略 |

**航次管理**

| 路由 | 页面文件 | 说明 |
|---|---|---|
| `/voyage/list` | VoyagePage | 航次列表，批量状态设置，生成航次弹窗+冲突检测，审批时间轴 |
| `/voyage/templates` | TemplatePage | 航次模板，多Tab弹窗（库存/行程/定金/计价/销售） |
| `/voyage/price-templates` | VoyagePriceTemplatePage | 模板价格列表 |
| `/voyage/price-templates/:id` | TemplatePricePage | 单模板下各航次价格独立配置 |
| `/voyage/inventory-templates` | VoyageInventoryTemplatePage | 模板库存列表 |
| `/voyage/calendar-board` | CalendarBoardPage | 日历看板，日历视图总览航次排期 |
| `/voyage/inventory` | InventoryPage | 库存看板，左月历+右表格，应急库存释放，批量设置 |
| `/voyage/inventory-allocation` | InventoryAllocationPage | 库存调配工作台，跨航次调配 |
| `/voyage/pricing` | PricingPage | 价格日历，月历+价格矩阵，双击编辑，批量调价 |
| `/voyage/pricing-rules` | PricingRulePage | 房型定价规则 |
| `/voyage/sales-control` | SalesControlPage | 航次销售状态管控 |
| `/voyage/price-management` | PriceManagementPage | 价格策略统一管理 |

**订单管理**

| 路由 | 页面文件 | 说明 |
|---|---|---|
| `/orders/list` | OrderListPage | 订单CRUD，补款、价格变更、房间分配、快照、日志 |
| `/orders/voyage-passenger-rooms` | VoyagePassengerRoomPage | 航次维度旅客与房型对照 |

**分销中心**

| 路由 | 页面文件 | 说明 |
|---|---|---|
| `/distribution/cooperation` | CooperationManagementPage | 合作管理，5个Tab（合作分销商/合作审核/充值授信/操作记录/账单） |
| `/distribution/distribution-mgmt` | DistributionManagementPage | 分销管理，5个Tab（分销价格/调整记录/政策类型/价格政策/退改政策） |
| `/distribution/ota` | OtaDistributionPage | OTA平台分销，4个Tab（OTA管理/船票/套票/期票配置） |
| `/distribution/dealers` | DealerPage | 合作分销商（旧页面，保留路由） |
| `/distribution/dealer-approvals` | DealerPage | 合作审核（旧页面，保留路由） |
| `/distribution/dealer-change-logs` | DealerPage | 分销商变更记录（旧页面，保留路由） |
| `/distribution/cabin-holds` | CabinHoldPage | 锁舱记录 |

**服务运营 / 客户 / 财务 / 报表 / 基础设置 / 系统**

| 路由 | 页面文件 |
|---|---|
| `/service/charter-orders` | CharterOrderPage |
| `/service/complaints` | ComplaintTicketPage |
| `/customer/profiles` | CustomerProfilePage |
| `/user-management` | UserManagementPage |
| `/finance/reconciliations` | ReconciliationPage |
| `/finance/supplementary-payments` | SupplementaryPaymentPage |
| `/report/data-reports` | DataReportPage |
| `/basic/holidays` | HolidayPage |
| `/basic/id-types` | IdTypePage |
| `/basic/age-groups` | AgeGroupPage |
| `/basic/hierarchical-dictionaries` | HierarchicalDictionaryPage |
| `/system/users` | UserPage |
| `/system/roles` | RolePage |
| `/system/menus` | MenuPage |
| `/system/dictionaries` | DictionaryPage |
| `/system/approval-flows` | ApprovalFlowPage |

**规则中心（`/rule/*`）**

定金规则、船款规则、罚金规则、罚金处理规则、申请合作规则、内外宾优惠政策、价格政策类型、返利政策、返利任务指标、小费标准、订单有效期规则、预警规则、组团社权限、退票费规则、船舶权限、关团规则、绩效系数。

---

### 经销商端（DealerLayout，路由前缀 `/dealer`）

| 路由 | 页面文件 | 说明 |
|---|---|---|
| `/dealer/home` | DealerHomePage | 概览仪表盘 |
| `/dealer/booking/cruise` | CruiseBookingPage | 游轮预定，6步下单流程 |
| `/dealer/booking/special-price` | SpecialPriceBookingPage | 特价申请 |
| `/dealer/booking/boat` | BoatBookingPage | 城市游船预定 |
| `/dealer/booking/flight` | FlightQueryPage | 航班查询 |
| `/dealer/booking/combo-sales` | ComboSalesPage | 组合产品售票 |
| `/dealer/orders/cruise` | DealerCruiseOrderPage | 游轮订单 |
| `/dealer/orders/special-price` | DealerSpecialPriceApplicationPage | 特价申请单 |
| `/dealer/stats/cruise-sales` | DealerCruiseSalesStatsPage | 销售统计 |

---

## 编码规范（必须遵守）

### B 端设计原则
- 本系统是 **B 端管理后台**，优先效率和信息密度，不做 C 端视觉效果
- **禁止**：渐变大图、glassmorphism、弹跳动画、卡片流布局
- **要做**：DataTable 表格、侧边栏+面包屑、弹窗表单、Toast 轻提示

### 样式约定
- 背景：白色 + `bg-gray-50`
- 主操作按钮：`bg-blue-600`
- 危险操作：`bg-red-600` 或 `text-red-500`
- 次要按钮：白底灰边框
- 表格内 input：`w-full`，列宽由 `<th>` 控制

### 交互约定
- 弹窗宽度：普通表单 `max-w-lg`/`max-w-xl`，复杂多列 `max-w-2xl`/`max-w-4xl`
- 主操作（保存/提交）在弹窗右下角；取消在左边
- 破坏性操作（删除/重置）须经 `ConfirmDialog` 二次确认
- 状态展示用 `StatusBadge` 组件
- 操作反馈用顶部 Toast（`fixed top-6 left-1/2`，2.5s 后消失）
- 必填字段 label 后跟红色 `*`

### 字段规范
- 航行时间：上水/下水分列，纯分钟数字录入，展示用 `formatDurationMinutes(min)`
- 物理距离（km）：只展示一列
- 行程管理中**不录入速度**，系统默认使用预设值

---

## 需求文档

`docs/游船需求规格说明书.md`（约 6658 行）

关键章节：
- **2.3.3 合作管理**（第 2345 行）
- **2.3.4 分销管理**（第 2810 行）
- **2.3.5 OTA平台分销**（第 3066 行）
- **第 5 章** — 功能规格详细说明

---

## 当前状态与待做事项

### 已完成
- 管理端全部核心模块（资源/航次/订单/分销中心/服务/客户/财务/报表/规则/系统）
- 经销商端：工作台、产品预定（6步流程）、订单管理、销售统计
- 分销中心三大模块全交互：合作管理、分销管理、OTA平台分销

### 经销商端侧边栏已配置但页面未实现
- 游船订单（`/dealer/orders/boat`）
- 组合产品订单（`/dealer/orders/combo`）
- 财务管理（`/dealer/finance/*`）
- 发票管理（`/dealer/invoice/*`）
- 系统管理（`/dealer/system/*`）

---

## 注意事项

1. **所有数据均为 mock**，新增页面直接在文件内定义 `initXxx` 数组，无需对接后端
2. 新建页面前先检查 `src/mock/data.ts` 是否已有可复用的实体数据
3. 新建路由时，两处都要改：`src/routes/index.tsx`（注册路由）+ `src/components/layout/Sidebar.tsx`（菜单项）
4. TypeScript 类型统一在 `src/types/index.ts` 维护
5. 项目无测试框架，验证方式为 `npx tsc --noEmit` 类型检查后人工浏览器验证
