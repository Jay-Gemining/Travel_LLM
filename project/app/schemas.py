from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

# --- Nested Models ---

class FoodPreferences(BaseModel):
    price_range: str
    cuisine_types: List[str]
    dietary_restrictions: Optional[str] = ""

class ItineraryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for the itinerary item")
    category: str = Field(..., description="类别，例如 '景点', '美食', '购物', '体验'")
    time: str
    poi_name: str
    description: str
    lat: float
    lon: float
    travel_from_previous: str
    opening_hours: str
    booking_info: str
    price: str
    local_tip: str

class DayPlan(BaseModel):
    day: int
    activities: List[ItineraryItem]

# --- API Request Models ---

class PlanRequest(BaseModel):
    city: str
    days: int = Field(..., gt=0, le=7)
    interests: List[str]
    travel_style: str = "普通"
    must_visit_pois: Optional[List[str]] = []
    budget: str = "标准"
    food_preferences: FoodPreferences

class RegenerateRequest(BaseModel):
    city: str
    day_plan: DayPlan
    activity_to_replace: ItineraryItem
    interests: List[str]
    travel_style: str
    budget: str
    food_preferences: FoodPreferences

# --- API Response Models ---

class ItineraryResponse(BaseModel):
    city: str
    total_days: int
    itinerary: List[DayPlan]

class SaveResponse(BaseModel):
    success: bool
    message: str
    itinerary_id: Optional[str] = None