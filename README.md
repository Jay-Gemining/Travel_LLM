# 行程AIGC (Travel_LLM)

<p align="center">
  <strong>您的动态、贴心、可执行的私人旅行管家。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Framework-FastAPI-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-React-blue.svg" alt="React">
  <img src="https://img.shields.io/badge/Styling-TailwindCSS-cyan.svg" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-ISC-lightgrey.svg" alt="License">
</p>

---

## 🌟 产品简介

行程AIGC (Travel_LLM) 是一个基于大型语言模型（LLM）的智能旅行规划应用。它允许用户通过输入目的地城市、旅行天数、预算、餐饮偏好和个人兴趣，快速生成一份结构清晰、内容丰富、可执行的个性化旅行日程。不仅如此，它还支持对生成的行程进行**动态编辑**，如修改时间、删除活动，并由AI自动更新交通信息，实现真正的“所见即所得”规划体验。

<!-- 在此插入应用截图 -->
<!-- ![App Screenshot](placeholder.png) -->

## ✨ 核心功能

- **深度个性化规划**: 用户可输入目的地、天数、旅行风格、必游景点，并新增**预算控制**和**餐饮偏好**，获得真正量身定制的行程。
- **智能美食融合**: AI不仅规划景点，更将符合预算和口味的餐厅智能穿插在午餐和晚餐时段。
- **可执行的详细信息**: 每个活动和美食点都附带**开放时间**、**预订链接/电话**、**人均消费**和**当地人贴士**，告别二次搜索。
- **动态行程调整**:
  - **替换活动**: 对不满意的活动可一键“换一个”，AI将根据上下文提供新的建议。
  - **编辑活动**: 可直接**删除**不喜欢的活动，或**修改**活动的时间安排。
  - **智能更新**: 每次编辑后，AI会自动**重新计算**并更新活动间的交通时间。
- **保存与分享**: 支持将满意行程保存，并生成文本分享给同伴。

## 🛠️ 技术栈

- **后端**:
  - **框架**: FastAPI
  - **语言**: Python 3.8+
  - **数据校验**: Pydantic
  - **AI**: OpenAI / SiliconFlow API
  - **服务器**: Uvicorn
- **前端**:
  - **框架**: React
  - **构建工具**: Vite
  - **样式**: Tailwind CSS
  - **HTTP客户端**: Axios

## 🚀 快速开始

请确保你的环境中已安装 Python 3.8+, Node.js 16+ 和 npm。

### 1. 克隆仓库

```bash
git clone https://github.com/Jay-Gemining/Travel_LLM.git
cd Travel_LLM
```

### 2. 后端设置

```bash
# (在项目根目录 Travel_LLM 下执行)

# 1. 创建并激活Python虚拟环境
python -m venv project/venv
# Windows
# project\venv\Scripts\activate
# macOS/Linux
source project/venv/bin/activate

# 2. 安装依赖
pip install -r project/requirements.txt

# 3. 设置环境变量
# 复制 project/.env.example (如果存在) 或直接创建 project/.env 文件
# 在 project/.env 文件中填入你的API密钥
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1" # 或者你的代理地址，例如 https://api.siliconflow.cn/v1
MODEL="gpt-4-turbo" # 推荐模型，或使用代理支持的模型，如 deepseek-ai/DeepSeek-R1
```

### 3. 前端设置

```bash
# (仍在项目根目录 Travel_LLM 下)
# 安装npm依赖
npm install
```

### 4. 运行应用

1.  **启动后端服务**:
    在项目根目录 `Travel_LLM` 下，运行:
    ```bash
    uvicorn project.app.main:app --reload --port 8000
    ```
    后端服务将在 `http://localhost:8000` 启动。

2.  **启动前端开发服务**:
    在项目根目录 `Travel_LLM` 下，运行:
    ```bash
    npm run dev
    ```
    前端应用将在 `http://localhost:5173` (或Vite指定的其他端口) 启动，并自动代理 `/api` 请求到后端。

3.  在浏览器中打开前端地址即可开始使用！

## 🗺️ API 端点

- `POST /api/plan`: 根据用户偏好生成完整行程。
- `POST /api/regenerate-activity`: 替换行程中的单个活动。
- `POST /api/save-itinerary`: 保存生成的行程。
- `POST /api/update-itinerary`: 在用户编辑后，接收行程并返回更新了交通时间的新行程。

## 🔮 未来规划

- **V2.0 (中期)**:
  - **全功能行程编辑**: 允许用户拖拽排序、手动添加活动。
  - **交互式地图视图**: 在地图上可视化行程路线。
  - **天气应变计划**: 根据天气预报，为户外活动提供“Plan B”备选方案。
- **V2.1 (长期)**:
  - **住宿推荐**: 根据预算和行程地点，推荐酒店或民宿。
  - **精细化交通规划**: 提供详细的市内交通方式（公交、地铁线路）。
  - **多语言支持**。

## 🤝 贡献

欢迎各种形式的贡献！如果你有任何想法或建议，请随时提交 Pull Request 或创建 Issue。

## 📄 许可证

本项目采用 [ISC](https://opensource.org/licenses/ISC) 许可证。
