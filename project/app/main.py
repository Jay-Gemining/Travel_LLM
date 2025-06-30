from fastapi import FastAPI, HTTPException
from .schemas import PlanRequest, ItineraryResponse
from .services import generate_plan_from_llm, parse_xml_to_json
import logging # 可选：用于更好的日志记录

# 可选：配置日志记录
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="行程AIGC API",
    version="1.0",
    description="使用 LLM 生成旅行行程的 API。"
)

@app.post("/api/plan", response_model=ItineraryResponse)
async def create_plan(request: PlanRequest):
    logger.info(f"收到行程规划请求：城市={request.city}, 天数={request.days}, 兴趣={request.interests}")
    try:
        # 步骤 1：调用 LLM (或模拟器) 获取 XML
        logger.info("正在从 LLM 生成行程计划...")
        xml_response = generate_plan_from_llm(request.city, request.days, request.interests)
        logger.info(f"收到 LLM XML 响应 (前100个字符): {xml_response[:100]}")

        # 步骤 2：解析 XML 并转换为 Pydantic/JSON 模型
        logger.info("正在解析 XML 为 JSON...")
        json_response = parse_xml_to_json(xml_response)
        logger.info("成功将 XML 解析为 JSON。")

        return json_response
    except ValueError as e:
        logger.error(f"行程生成过程中出现 ValueError：{str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM 响应解析错误：{str(e)}")
    except Exception as e:
        logger.error(f"行程生成过程中出现意外错误：{str(e)}")
        raise HTTPException(status_code=500, detail=f"发生意外错误：{str(e)}")

#直接使用 uvicorn 运行的示例 (可选, 便于测试)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
