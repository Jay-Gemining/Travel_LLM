import openai
import xml.etree.ElementTree as ET
from .schemas import ItineraryResponse, DayPlan, Activity, RegenerateRequest
from .prompt_template import PROMPT_TEMPLATE, REGENERATE_PROMPT_TEMPLATE
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
MODEL = os.environ.get("MODEL")

def _get_openai_client():
    """获取 OpenAI 客户端"""
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

def _call_llm(prompt: str) -> str:
    """调用 LLM 并返回其内容"""
    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"与 OpenAI API 通信时出错: {e}")
        raise

def generate_plan_from_llm(city: str, days: int, interests: list, travel_style: str, must_visit_pois: list) -> str:
    """
    使用真实的 OpenAI API 生成旅行计划。
    """
    interests_str = ", ".join(interests)
    must_visit_pois_str = ", ".join(must_visit_pois) if must_visit_pois else "无"
    prompt = PROMPT_TEMPLATE.format(
        city=city,
        days=days,
        interests_str=interests_str,
        travel_style=travel_style,
        must_visit_pois_str=must_visit_pois_str
    )
    return _call_llm(prompt)

def regenerate_activity_from_llm(request: RegenerateRequest) -> str:
    """
    调用LLM为一个不满意的活动生成新的建议。
    """
    interests_str = ", ".join(request.interests)
    
    # 为了给LLM提供更好的上下文，我们将当天的计划和要替换的活动格式化为字符串
    day_plan_str = "\n".join([f"- {act.poi_name} ({act.time})" for act in request.day_plan.activities])
    activity_to_replace_str = f"- {request.activity_to_replace.poi_name} ({request.activity_to_replace.time})"

    prompt = REGENERATE_PROMPT_TEMPLATE.format(
        city=request.city,
        interests_str=interests_str,
        travel_style=request.travel_style,
        day_plan_str=day_plan_str,
        activity_to_replace_str=activity_to_replace_str
    )
    return _call_llm(prompt)

def _clean_xml_string(xml_string: str) -> str:
    """清理LLM返回的可能包含额外文本的XML字符串"""
    if "```xml" in xml_string:
        xml_string = xml_string.split("```xml")[1].split("```")[0].strip()
    elif "<?xml" in xml_string:
        xml_string = xml_string.split("?>", 1)[-1].strip()
    return xml_string.strip()

def _parse_activity_node(activity_node: ET.Element) -> Activity:
    """从XML节点解析单个活动"""
    return Activity(
        time=activity_node.find("time").text if activity_node.find("time") is not None else "N/A",
        poi_name=activity_node.find("poi_name").text if activity_node.find("poi_name") is not None else "N/A",
        description=activity_node.find("description").text if activity_node.find("description") is not None else "N/A",
        type=activity_node.find("type").text if activity_node.find("type") is not None else "N/A",
        lat=float(activity_node.find("lat").text) if activity_node.find("lat") is not None and activity_node.find("lat").text else 0.0,
        lon=float(activity_node.find("lon").text) if activity_node.find("lon") is not None and activity_node.find("lon").text else 0.0,
        travel_from_previous=activity_node.find("travel_from_previous").text if activity_node.find("travel_from_previous") is not None else "N/A",
    )

def parse_xml_to_json(xml_string: str) -> ItineraryResponse:
    try:
        xml_string = _clean_xml_string(xml_string)
        root = ET.fromstring(xml_string)

        itinerary_data = {
            "city": root.attrib.get("city"),
            "total_days": int(root.attrib.get("total_days")),
            "itinerary": []
        }

        for day_node in root.findall("day"):
            day_plan_data = {
                "day": int(day_node.attrib.get("number")),
                "activities": []
            }
            for activity_node in day_node.findall("activity"):
                day_plan_data["activities"].append(_parse_activity_node(activity_node))
            itinerary_data["itinerary"].append(DayPlan(**day_plan_data))

        return ItineraryResponse(**itinerary_data)
    except (ET.ParseError, ValueError, TypeError) as e:
        raise ValueError(f"解析 LLM XML 输出失败: {e}。收到的XML (前500字符): {xml_string[:500]}...")

def parse_single_activity_xml(xml_string: str) -> Activity:
    """解析用于替换的单个activity XML"""
    try:
        xml_string = _clean_xml_string(xml_string)
        activity_node = ET.fromstring(xml_string)
        return _parse_activity_node(activity_node)
    except (ET.ParseError, ValueError, TypeError) as e:
        raise ValueError(f"解析 LLM 单个活动 XML 输出失败: {e}。收到的XML: {xml_string}")


