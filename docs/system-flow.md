# 长航集团游轮管理系统 — 业务流程与架构图

## 一、系统总览

```mermaid
graph TB
    subgraph 基础资源层["基础资源层"]
        PORT[港口 & 码头]
        ATTR[景点]
        SHIP[船舶<br/>甲板 → 舱房]
        FAC[设施]
        TICKET[票类]
    end

    subgraph 业务编排层["业务编排层"]
        ROUTE[航线<br/>经停港 + 上下客]
        PRODUCT[产品<br/>航段 × 基准价]
        TEMPLATE[航次模板<br/>库存/行程/定金/销售规则]
    end

    subgraph 运营执行层["运营执行层"]
        VOYAGE[航次列表<br/>状态/审批流转]
        INVENTORY[库存看板]
        PRICING[价格日历]
    end

    subgraph 系统支撑层["系统支撑层"]
        USER[用户管理]
        ROLE[角色管理]
        MENU[菜单管理]
        DICT[数据字典]
    end

    PORT --> ROUTE
    ATTR --> ROUTE
    SHIP --> PRODUCT
    ROUTE --> PRODUCT
    TICKET --> PRODUCT
    PRODUCT --> TEMPLATE
    FAC --> SHIP
    TEMPLATE --> VOYAGE
    VOYAGE --> INVENTORY
    VOYAGE --> PRICING
```

## 二、基础资源准备流程

```mermaid
flowchart LR
    A["1. 创建港口<br/>+ 关联码头"] --> B["2. 创建景点<br/>关联港口"]
    C["3. 创建船舶<br/>甲板 → 舱房 → 设施"] --> D["4. 创建航线<br/>选择经停港/码头<br/>设置上下客"]
    A --> D
    B -.-> D
    E["5. 创建票类<br/>客人类型/价格系数"] --> F["6. 创建产品"]
    C --> F
    D --> F
    F --> G["7. 创建航次模板<br/>库存/行程/定金/销售规则"]
```

## 三、产品构建流程（核心）

```mermaid
flowchart TD
    ROUTE["航线<br/>经停港序列 A→B→C→D"] -->|"C(n,2) 生成航段"| SEG["航段<br/>A-B, A-C, A-D<br/>B-C, B-D, C-D"]
    SHIP["船舶<br/>舱房类型"] --> PRICE["基准价配置<br/>航段 × 舱房类型"]
    SEG --> PRICE
    PRICE -->|"组合为产品"| PRODUCT["产品<br/>三峡经典下水之旅"]
    PRODUCT -->|"关联"| TICKET["票类<br/>成人/儿童/婴儿"]
```

## 四、航次全生命周期

```mermaid
flowchart TD
    TEMPLATE["航次模板<br/>状态: 草稿"] -->|"启用"| ENABLED["模板: 已启用"]
    ENABLED -->|"生成航次<br/>选择日期范围<br/>冲突检测"| PENDING["航次: 待售 pending"]
    
    PENDING -->|"开售"| TICKETING["航次: 售票中 ticketing"]
    PENDING -->|"暂停"| SUSPENDED["航次: 已暂停 suspended"]
    PENDING -->|"包船"| CHARTERED["航次: 已包船 chartered"]
    PENDING -->|"空放"| DEADHEAD["航次: 空放 deadhead"]
    PENDING -->|"调拨"| TRANSFER["航次: 调拨 transfer"]
    
    TICKETING -->|"管理库存"| INVENTORY["库存看板<br/>物理容量/已售/锁定<br/>维护/应急库存"]
    TICKETING -->|"管理价格"| PRICING["价格日历<br/>日期 × 舱房类型<br/>批量调价"]
    
    TICKETING -->|"审批流"| APPROVAL["审批时间轴<br/>pending → approved/rejected"]
```

## 五、模块依赖链（开发顺序）

```mermaid
flowchart LR
    L0["独立模块<br/>港口·船舶·设施·票类"] --> L1["景点<br/>关联港口"]
    L0 --> L2["航线<br/>关联港口/码头"]
    L1 -.-> L2
    L2 --> L3["产品<br/>关联航线+船舶"]
    L0 --> L3
    L3 --> L4["航次模板<br/>关联产品"]
    L4 --> L5["航次<br/>关联模板"]
    L5 --> L6["库存看板<br/>关联航次"]
    L5 --> L7["价格日历<br/>关联航次"]
```

## 六、核心实体关系

| 实体 | 关键外键 | 说明 |
|------|----------|------|
| Port | — | 港口，内嵌 Pier[]（码头含位置） |
| Attraction | portId | 景点归属港口 |
| Route | stops[].portId, stops[].pierId | 航线经停港序列 |
| Ship | — | 船舶，内嵌 Deck[] → Cabin[] |
| Product | routeId, shipId | 产品 = 航线 + 船舶 + 航段 + 基准价 |
| VoyageTemplate | productId | 模板含库存/行程/定金/退款规则 |
| Voyage | templateId, productId, shipId, routeId | 航次 = 模板实例化 |
| VoyageInventory | voyageId | 按舱房类型的库存快照 |
| VoyagePrice | voyageId | 按日期 × 舱房类型的价格矩阵 |
