from fastapi import FastAPI, HTTPException
from .schemas import PlanRequest, ItineraryResponse, RegenerateRequest, Activity
from .services import (
    generate_plan_from_llm, 
    parse_xml_to_json, 
    regenerate_activity_from_llm,
    parse_single_activity_xml
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="行程AIGC API",
    version="1.1",
    description="使用 LLM 生成和修改旅行行程的 API。"
)

@app.post("/api/plan", response_model=ItineraryResponse)
async def create_plan(request: PlanRequest):
    logger.info(f"收到行程规划请求: {request.model_dump_json(indent=2)}")
    try:
        logger.info("正在从 LLM 生成行程计划...")
        xml_response = generate_plan_from_llm(
            request.city, 
            request.days, 
            request.interests,
            request.travel_style,
            request.must_visit_pois
        )
        logger.info(f"收到 LLM XML 响应 (前100个字符): {xml_response[:100]}...")

        logger.info("正在解析 XML 为 JSON...")
        json_response = parse_xml_to_json(xml_response)
        logger.info("成功将 XML 解析为 JSON。")

        return json_response
    except ValueError as e:
        logger.error(f"行程生成过程中出现 ValueError: {e}")
        raise HTTPException(status_code=500, detail=f"LLM 响应解析错误: {e}")
    except Exception as e:
        logger.error(f"行程生成过程中出现意外错误: {e}")
        raise HTTPException(status_code=500, detail=f"发生意外错误: {e}")

@app.post("/api/regenerate-activity", response_model=Activity)
async def regenerate_activity(request: RegenerateRequest):
    logger.info(f"收到活动替换请求: {request.model_dump_json(indent=2)}")
    try:
        logger.info("正在从 LLM 获取新的活动建议...")
        xml_response = regenerate_activity_from_llm(request)
        logger.info(f"收到 LLM XML 响应: {xml_response}")

        logger.info("正在解析单个活动 XML...")
        new_activity = parse_single_activity_xml(xml_response)
        logger.info(f"成功解析新活动: {new_activity.poi_name}")

        return new_activity
    except ValueError as e:
        logger.error(f"活动替换过程中出现 ValueError: {e}")
        raise HTTPException(status_code=500, detail=f"LLM 响应解析错误: {e}")
    except Exception as e:
        logger.error(f"活动替换过程中出现意外错误: {e}")
        raise HTTPException(status_code=500, detail=f"发生意外错误: {e}")

