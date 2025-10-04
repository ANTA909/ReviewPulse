# ReviewPulse - 商品评论情感分析可视化系统

一个基于Python Flask和D3.js的商品评论情感分析可视化系统，能够分析商品评论的情感倾向并生成交互式图表。本系统由于考虑到初始阶段性能问题，只采用了SNAP数据集中亚马逊的杂志类购买数据。后续仍会更新使用其他数据集，目标是能嵌入到各大购物应用里以进行实时数据情感分析。

## 特性

-  **情感分析** - 自动分析评论的情感倾向（积极/消极/中性）
-  **可视化图表** - 使用D3.js生成交互式图表
-  **时间线分析** - 查看情感随时间的变化趋势
-  **关键词词云** - 提取评论中的高频关键词
-  **Web应用** - 响应式设计，支持移动端访问


## 项目结构

ReviewPulse/
├── app.js   # 前端javascrpt逻辑
├── index.html    #主页面  
├── style.css   # 样式文件
├── dateclean   # 数据清洗工具
├── Magazine_Subscriptions_5.json   # 原snap亚马逊杂志购买数据集
├── Magazine_Subscriptions_5_processed.json    #处理后只保留有用数据的数据集  
├── requirements.txt   # Python依赖包列表
└── sentiment_api   # 情感分析API


## 快速开始

### 环境要求

- Python 3.7+
- 现代浏览器（Chrome、Firefox、Safari）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/ANTA909/ReviewPulse.git
   cd ReviewPulse
