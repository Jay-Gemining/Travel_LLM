from pydantic import BaseModel, Field
from typing import List

class PlanRequest(BaseModel):
    city: str
    days: int = Field(..., gt=0, le=7) # gt: greater than, le: less than or equal to
    interests: List[str]

# --- 内部转换模型，后端使用 ---
class Activity(BaseModel):
    time: str
    poi_name: str
    description: str
    type: str

class DayPlan(BaseModel):
    day: int
    activities: List[Activity]

class ItineraryResponse(BaseModel):
    city: str
    total_days: int
    itinerary: List[DayPlan]
