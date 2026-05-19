# 长航集团游轮管理系统 — 业务流程图

## 一、系统三层架构

```mermaid
graph TD
    subgraph L1["🔵 基础资源层 — 定义「有什么」"]
        direction LR
        A1[港口·码头] --- A2[景点] --- A3[船舶·舱房] --- A4[设施] --- A5[票类]
    end

    subgraph L2["🟠 业务编排层 — 定义「怎么卖」"]
        direction LR
        B1[航线] --> B2[产品] --> B3[航次模板]
    end

    subgraph L3["🟢 运营执行层 — 执行「卖多少」"]
        direction LR
        C1[航次列表] --> C2[库存看板]
        C1 --> C3[价格日历]
    end

    L1 --> L2 --> L3
```

## 二、资源准备 → 产品上线（7 步操作流）

```mermaid
flowchart TD
    S1["① 港口<br/>录入码头信息"] --> S4["④ 航线<br/>编排经停港序列"]
    S2["② 景点<br/>关联所属港口"] --> S4
    S3["③ 船舶<br/>配置甲板舱房"] --> S6["⑥ 产品<br/>组合航线+船舶+定价"]
    S4 --> S6
    S5["⑤ 票类<br/>定义客人类型价格"] --> S6
    S6 --> S7["⑦ 航次模板<br/>配置库存/行程/销售规则"]
```

## 三、产品构建核心逻辑

```mermaid
flowchart LR
    subgraph INPUT["输入"]
        R[航线<br/>4个经停港]
        S[船舶<br/>5种舱房]
    end

    subgraph PROCESS["处理"]
        SG["C(n,2)生成航段<br/>4港→6个航段"]
        PC["航段×舱房<br/>6×5=30条定价"]
    end

    subgraph OUTPUT["输出"]
        P[产品: 三峡下水4天3晚]
    end

    R --> SG --> PC --> P
    S --> PC
```

## 四、航次运营全生命周期

```mermaid
flowchart LR
    subgraph PHASE1["1. 模板阶段"]
        T1[草稿] -->|启用| T2[已启用]
    end

    subgraph PHASE2["2. 生成航次"]
        T2 -->|选日期+冲突检测| V1[待售]
    end

    subgraph PHASE3["3. 运营管理"]
        V1 --> V2[售票中]
        V2 --> M1[库存看板]
        V2 --> M2[价格日历]
    end

    subgraph PHASE4["4. 状态变更"]
        V1 -.-> S1[暂停]
        V1 -.-> S2[包船]
        V1 -.-> S3[空放]
    end

    PHASE1 --> PHASE2 --> PHASE3
    PHASE2 -.-> PHASE4
```

## 五、模块依赖关系

```mermaid
graph TD
    PORT[港口] --> ROUTE[航线]
    ATTR[景点] -.-> ROUTE
    SHIP[船舶] --> PROD[产品]
    ROUTE --> PROD
    TICKET[票类] --> PROD
    PROD --> TPL[航次模板]
    TPL --> VOYAGE[航次]
    VOYAGE --> INV[库存看板]
    VOYAGE --> PRICE[价格日历]

    FAC[设施] -.-> SHIP
```

## 六、数据全景

```mermaid
erDiagram
    Port ||--o{ Pier : "内嵌"
    Port ||--o{ Attraction : "portId"
    Port ||--o{ RouteStop : "portId"
    Route ||--o{ RouteStop : "内嵌"
    Route ||--o{ Product : "routeId"
    Ship ||--o{ Deck : "内嵌"
    Deck ||--o{ Cabin : "内嵌"
    Ship ||--o{ Product : "shipId"
    Product ||--o{ ProductSegment : "内嵌"
    Product ||--o{ PricingRow : "内嵌"
    Product ||--o{ VoyageTemplate : "productId"
    VoyageTemplate ||--o{ Voyage : "templateId"
    Voyage ||--o{ VoyageInventory : "voyageId"
    Voyage ||--o{ VoyagePrice : "voyageId"

    Port {
        string id
        string name
        string code
    }
    Route {
        string id
        string code
        string name
        string type
    }
    Product {
        string id
        string name
        string routeId
        string shipId
    }
    VoyageTemplate {
        string id
        string code
        string productId
    }
    Voyage {
        string id
        string voyageNo
        string templateId
        string status
    }
```

## 七、一句话总结

> **港口 + 船舶 → 航线 → 产品 → 模板 → 航次 → 库存/价格**
>
> 每一层都是上一层的组合与实例化，层层递进。
