# 长航集团游轮管理系统

## 技术栈
React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + React Router v6 + Zustand + Recharts + lucide-react

## 启动
```
cd "/Users/huangchuhua/AI项目/cruise-management" && npm run dev
```
登录：admin / 123456

## 已完成模块
| 模块 | 路由 | 要点 |
|------|------|------|
| 港口管理 | /resources/ports | 树形表格，父行港口子行码头，表单含码头动态增减 |
| 景点管理 | /resources/attractions | 游览时长字段，景区介绍超3行截断+全文弹窗 |
| 航线管理 | /resources/routes | 动态停靠港表格，起港/止港/途中港交互 |
| 产品管理 | /resources/products | 树形表格，C(n,2)航段生成，基准价配置，库存设置弹窗 |
| 船舶管理 | /resources/ships | 3步向导(基本信息→甲板→舱房)，rowSpan嵌套表 |
| 房间管理 | /resources/rooms | 批量生成房间2步向导，批量改状态/删除 |
| 设施管理 | /resources/facilities | 独立设施池，分类/收费类型/营业状态 |
| 票种管理 | /resources/tickets | 入住类型×价格系数，拼房/加床规则，小费策略 |
| 航次列表 | /voyage/list | 批量状态设置，生成航次弹窗+冲突检测，审批时间轴 |
| 航次模板 | /voyage/templates | 多tab弹窗(库存/行程/定金/计价/销售) |
| 库存看板 | /voyage/inventory | 左月历+右表格，应急库存释放，批量设置 |
| 价格日历 | /voyage/pricing | 月历+价格矩阵，双击编辑弹窗，批量调价 |
| 系统设置 | /system/* | 用户/角色/菜单/数据字典 CRUD |

## 数据层
- mock/data.ts：所有 mock 数据集中管理
- mock/api.ts：createCrudApi 工厂 + 专用 API
- types/index.ts：所有类型定义

## 通用组件
PageHeader / SearchPanel / DataTable / FormDialog / DetailDrawer / ConfirmDialog / StatusBadge

## 关键约定
- 表内 input 一律 w-full，列宽由 th 控制
- 新模块前先列依赖链，检测 prompt 跨模块复制
- 文件在 /Users/huangchuhua/AI项目/cruise-management/，备份在 cruise-management-backup/
