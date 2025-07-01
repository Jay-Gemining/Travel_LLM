from pydantic import BaseModel, Field
from typing import List, Optional

# --- API 请求与响应模型 ---

class PlanRequest(BaseModel):
    city: str
    days: int = Field(..., gt=0, le=7)
    interests: List[str]
    travel_style: str = "普通" # "悠闲", "普通", "紧凑"
    must_visit_pois: Optional[List[str]] = []

class Activity(BaseModel):
    time: str
    poi_name: str
    description: str
    type: str
    lat: float
    lon: float
    travel_from_previous: str

class DayPlan(BaseModel):
    day: int
    activities: List[Activity]

class ItineraryResponse(BaseModel):
    city: str
    total_days: int
    itinerary: List[DayPlan]

class RegenerateRequest(BaseModel):
    city: str
    day_plan: DayPlan # 当天的完整计划，用于提供上下文
    activity_to_replace: Activity # 需要被替换的活动
    interests: List[str]
    travel_style: str
