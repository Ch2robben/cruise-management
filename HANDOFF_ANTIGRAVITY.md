# Cruise Management Handoff

更新时间：2026-05-30

## 当前重点

本轮主要在做两个模块：

1. `资源 -> 房型管理`
2. `航次 -> 航次模板 -> 模板定价弹窗`

## 已完成

### 1. 房型管理

- 已在左侧菜单 `资源` 下新增二级菜单：`房型管理`
- 路由：`/resources/cabins`
- 页面风格已切到项目现有统一风格：
  - `PageHeader`
  - `SearchPanel`
  - `DataTable`
- 已按需求处理：
  - 去掉“添加”功能入口
  - 增加筛选栏：`船舶`
  - 列表增加字段：`船舶`

关键文件：

- `src/pages/resources/CabinPage.tsx`
- `src/routes/index.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Breadcrumb.tsx`

### 2. 航次模板列表

- `发布计划 / 修改计划` 已从行内按钮改为“勾选后顶部按钮”
- 规则：
  - `发布计划`：勾选 1 条或多条后可用，批量发布
  - `修改计划`：仅勾选 1 条时可用，打开该模板编辑

关键文件：

- `src/pages/voyage/TemplatePage.tsx`

### 3. 模板定价

- 已取消独立路由页面，改为 `航次模板` 列表中的 `定价` 弹窗
- 当前交互：
  - 默认查看态
  - 右上角 `编辑` 按钮切换查看 / 编辑
  - 编辑态仅可编辑：`标准间基准价`
- 当前展示口径：
  - 按 `航段` 展示
  - 不显示 `舱房类型`
  - 每个航段只保留一条 `标准间基准价`
- 当前保存逻辑：
  - 弹窗里每个航段只维护一条价格
  - 保存时，会把该航段的 `basePrice` 同步回底层该航段下所有舱型价格

关键文件：

- `src/pages/voyage/TemplatePage.tsx`

## 最新样式状态

模板定价弹窗刚做过一轮样式优化，主要包括：

- 头部改为更强的信息分层
- 增加关联产品 / 规则数量信息块
- 表格外层包卡片
- 基准价查看态用大号数字展示
- 底部按钮区和关闭逻辑已统一

如果继续优化，这一块应该直接改：

- `src/pages/voyage/TemplatePage.tsx`

搜索关键词：

- `pricingOpen`
- `openPricing`
- `savePricing`
- `标准间基准价`

## 已撤销 / 不再使用

- 独立路由页面：`src/pages/voyage/TemplatePricingPage.tsx`
  - 该文件还在仓库里，但路由已移除
  - 当前真实入口是 `TemplatePage.tsx` 里的弹窗
- 路由 `/voyage/template-pricing` 已删除

如果后续确认完全不用，可删除：

- `src/pages/voyage/TemplatePricingPage.tsx`

## 待继续优化的点

### 模板定价弹窗

当前业务表达已经对齐，但视觉还可以继续收：

- 表格列宽还可以更稳
- 查看态数字和标题间距可再压细一点
- 编辑态输入框宽度、对齐方式可再统一
- 若业务确认“系数 1”需要显式展示，可以在头部信息卡加一句说明，而不是放进表格

### 房型管理

当前是静态展示页，没有做新增/编辑/详情/删除逻辑。
这是符合当前用户要求的，因为用户明确说了“不需要新增功能”。

## 验证方式

开发环境：

- 一般访问：`http://localhost:5173/cruise-management/`

重点页面：

- 房型管理：
  - `http://localhost:5173/cruise-management/resources/cabins`
- 航次模板：
  - `http://localhost:5173/cruise-management/voyage/templates`

模板定价验证路径：

1. 进入 `航次模板`
2. 点击某条模板的 `定价`
3. 检查：
   - 是否弹窗打开
   - 是否默认查看态
   - 是否只有 `航段` + `标准间基准价`
   - 点击 `编辑` 后是否可改
   - 保存后是否关闭编辑态并写回产品价格

## 构建状态

最近一次已执行：

```bash
npm run build
```

结果：通过。

仍有旧告警，但不是本轮引入：

- CSS minify warning: `Expected identifier but found "-"`
- chunk size warning > 500k

## 建议下一步

优先顺序建议：

1. 继续微调模板定价弹窗样式
2. 如果用户确认，需要把“标准间=系数1”的规则显式写在 UI 上
3. 如果用户后续要落真实业务，再决定是否把模板定价从“同步到底层所有舱型”升级成正式的模板定价模型
