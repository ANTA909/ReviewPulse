# ReviewPulse - 商品评论情感分析可视化系统

一个基于Python Flask和D3.js的商品评论情感分析可视化系统，能够分析商品评论的情感倾向并生成交互式图表。

## 特性

-  **情感分析** - 自动分析评论的情感倾向（积极/消极/中性）
-  **可视化图表** - 使用D3.js生成交互式图表
-  **时间线分析** - 查看情感随时间的变化趋势
-  **关键词词云** - 提取评论中的高频关键词
-  **Web应用** - 响应式设计，支持移动端访问


## 项目结构
ReviewPulse/
├── sentient_api/          # 情感分析API
├── dataclean.py/         # 数据清洗工具
├── style.css/            # 样式文件
├── app.js/            # 前端javascrpt逻辑
└── index/         # 主页面文件
└── requirements.txt/         # Python依赖包列表
└── Magazine_Subscriptions_5/         # 原snap亚马逊杂志购买数据集
└── Magazine_Subscriptions_5_processed/         #处理后只保留有用数据的数据集 

## 快速开始

### 环境要求

- Python 3.7+
- 现代浏览器（Chrome、Firefox、Safari）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/ANTA909/ReviewPulse.git
   cd ReviewPulse
