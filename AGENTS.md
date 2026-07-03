# 长航集团游轮管理系统

## 技术栈
React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + React Router v6 + Zustand + Recharts + lucide-react

## 启动
```
cd "/Users/huangchuhua/AI项目/cruise-management" && npm run dev
```
登录：admin / 123456

## 系统架构
- 管理端：MainLayout，路由前缀 `/`，默认跳转 `/voyage/list`
- 经销商端：DealerLayout，路由前缀 `/dealer`

---

## 已完成模块 — 管理端

### 资源管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 港口管理 | /resources/ports | 树形表格，父行港口子行码头，表单含码头动态增减 |
| 景点管理 | /resources/attractions | 游览时长字段，景区介绍超3行截断+全文弹窗 |
| 航线管理 | /resources/routes | 动态停靠港表格，起港/止港/途中港交互 |
| 行程管理 | /resources/itineraries | 行程编排，港口停靠计划 |
| 产品管理 | /resources/products | 树形表格，C(n,2)航段生成，基准价配置，库存设置弹窗 |
| 船舶管理 | /resources/ships | 3步向导(基本信息→甲板→舱房)，rowSpan嵌套表 |
| 房间管理 | /resources/rooms | 批量生成房间2步向导，批量改状态/删除 |
| 船舱管理 | /resources/cabins | 船舱定义与配置 |
| 房型管理 | /resources/sell-room-type-configs | 售卖房型定价配置 |
| 设施管理 | /resources/facilities | 独立设施池，分类/收费类型/营业状态 |
| 票类管理 | /resources/tickets | 入住类型×价格系数，拼房/加床规则，小费策略 |

### 航次管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 航次列表 | /voyage/list | 批量状态设置，生成航次弹窗+冲突检测，审批时间轴 |
| 航次模板 | /voyage/templates | 多tab弹窗(库存/行程/定金/计价/销售) |
| 航次价格配置 | /voyage/price-templates | 模板下各航次价格独立配置 |
| 航次库存配置 | /voyage/inventory-templates | 模板下各航次库存独立配置 |
| 日历看板 | /voyage/calendar-board | 日历视图总览航次排期 |
| 库存看板 | /voyage/inventory | 左月历+右表格，应急库存释放，批量设置 |
| 库存调配工作台 | /voyage/inventory-allocation | 跨航次库存调配操作 |
| 价格日历 | /voyage/pricing | 月历+价格矩阵，双击编辑弹窗，批量调价 |
| 销售控制 | /voyage/sales-control | 航次销售状态管控 |
| 价格管理 | /voyage/price-management | 价格策略统一管理 |
| 房型定价规则 | /voyage/pricing-rules | 房型维度定价规则配置 |

### 订单管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 订单列表 | /orders/list | 订单CRUD、补款、价格变更、房间分配、快照、日志 |
| 航次旅客房型 | /orders/voyage-passenger-rooms | 航次维度旅客与房型对照 |

### 分销合作
| 模块 | 路由 | 要点 |
|------|------|------|
| 合作分销商 | /distribution/dealers | 分销商管理与合作规则 |
| 合作审核 | /distribution/dealer-approvals | 分销商入驻审批 |
| 分销商变更记录 | /distribution/dealer-change-logs | 分销商信息变更日志 |
| 锁舱记录 | /distribution/cabin-holds | 锁舱操作记录与查询 |

### 服务运营
| 模块 | 路由 | 要点 |
|------|------|------|
| 包船订单 | /service/charter-orders | 包船业务订单管理 |
| 客诉工单 | /service/complaints | 客户投诉工单处理 |

### 客户管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 客户档案 | /customer/profiles | 客户信息档案管理 |
| 用户管理 | /user-management | 用户中心管理 |

### 财务管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 对账批次 | /finance/reconciliations | 财务对账批次管理 |
| 补款单管理 | /finance/supplementary-payments | 订单补款单管理 |

### 报表中心
| 模块 | 路由 | 要点 |
|------|------|------|
| 数据报表 | /report/data-reports | 综合数据报表 |

### 基础设置
| 模块 | 路由 | 要点 |
|------|------|------|
| 节假日设置 | /basic/holidays | 节假日日历配置 |
| 证件类型管理 | /basic/id-types | 证件类型字典 |
| 年龄段管理 | /basic/age-groups | 年龄段定义与优惠关联 |
| 层级字典 | /basic/hierarchical-dictionaries | 活动分类等多级字典 |

### 系统设置
| 模块 | 路由 | 要点 |
|------|------|------|
| 用户管理 | /system/users | 系统用户CRUD |
| 角色管理 | /system/roles | 角色与权限配置 |
| 菜单管理 | /system/menus | 动态菜单配置 |
| 数据字典 | /system/dictionaries | 通用数据字典 |
| 审批流配置 | /system/approval-flows | 审批流程定义 |

### 规则中心
| 模块 | 路由 | 要点 |
|------|------|------|
| 定金规则 | /rule/deposit | 定金收取与退还规则 |
| 船款规则 | /rule/payment | 船款支付节点规则 |
| 罚金规则 | /rule/penalty | 罚金计算规则 |
| 罚金处理规则 | /rule/penalty-handling | 罚金类型字典与处理方式 |
| 申请合作规则 | /rule/dealer-cooperation | 分销商入驻门槛与条件 |
| 内外宾优惠政策 | /rule/discount | 内外宾差异化折扣 |
| 价格政策类型 | /rule/price-type | 价格政策分类管理 |
| 返利政策 | /rule/rebate | 分销商返利计算规则 |
| 返利任务指标 | /rule/rebate-targets | 返利门槛指标配置 |
| 小费标准 | /rule/tip | 小费收取标准管理 |
| 订单有效期规则 | /rule/order-validity | 订单有效时长配置 |
| 预警规则 | /rule/warning | 库存/价格等预警阈值 |
| 组团社权限 | /rule/group-auth | 组团社操作权限管理 |
| 退票费规则 | /rule/refund | 分销商退票手续费 |
| 船舶权限 | /rule/ship-auth | 船舶操作权限管控 |
| 关团规则 | /rule/close | 订单取消关闭规则 |
| 绩效系数 | /rule/performance | 绩效考核系数配置 |

---

## 已完成模块 — 经销商端

### 工作台
| 模块 | 路由 | 要点 |
|------|------|------|
| 工作台首页 | /dealer/home | 经销商概览仪表盘 |

### 产品预定
| 模块 | 路由 | 要点 |
|------|------|------|
| 游轮预定 | /dealer/booking/cruise | 6步下单流程(航线选择→房间预订→旅客信息→确认→定金→完成) |
| 特价申请 | /dealer/booking/special-price | 特价舱位申请流程 |
| 城市游船预定 | /dealer/booking/boat | 城市游船产品预定 |
| 航班查询 | /dealer/booking/flight | 航班信息查询 |
| 组合产品售票 | /dealer/booking/combo-sales | 组合产品销售 |

### 订单管理
| 模块 | 路由 | 要点 |
|------|------|------|
| 游轮订单 | /dealer/orders/cruise | 经销商游轮订单列表 |
| 特价申请单 | /dealer/orders/special-price | 特价申请单管理 |

### 数据统计
| 模块 | 路由 | 要点 |
|------|------|------|
| 游轮销售统计 | /dealer/stats/cruise-sales | 经销商游轮销售数据统计 |

> 注：经销商端侧边栏已配置「游船订单 / 组合产品订单 / 财务管理 / 发票管理 / 系统管理」菜单项，对应路由页面尚未实现。

---

## 数据层
- mock/data.ts：所有 mock 数据集中管理
- mock/api.ts：createCrudApi 工厂 + 专用 API
- types/index.ts：所有类型定义
- mock/ 下另有 orderStore / orderLogStore / inventoryAllocation / specialPriceApplications / voyageOversellRules 等独立 store 文件

## 通用组件
PageHeader / SearchPanel / DataTable / FormDialog / DetailDrawer / ConfirmDialog / StatusBadge / CoefficientStepper

## 关键约定
- 表内 input 一律 w-full，列宽由 th 控制
- 新模块前先列依赖链，检测 prompt 跨模块复制
- 文件在 /Users/huangchuhua/AI项目/cruise-management/，备份在 cruise-management-backup/
