import openai
import xml.etree.ElementTree as ET
from .schemas import (
    ItineraryResponse, DayPlan, ItineraryItem, RegenerateRequest, PlanRequest, 
    FoodPreferences, SaveResponse
)
from .prompt_template import PROMPT_TEMPLATE, REGENERATE_PROMPT_TEMPLATE
import os
import uuid
import json
from openai import OpenAI
from dotenv import load_dotenv

# --- Environment and API Key Setup ---
load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
MODEL = os.environ.get("MODEL")

# --- Utility Functions ---

def _get_openai_client():
    """Initializes and returns the OpenAI client."""
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

def _call_llm(prompt: str) -> str:
    """Calls the LLM and returns its content, with error handling."""
    try:
        client = _get_openai_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8, # Increased temperature slightly for more creative/varied results
            # response_format={"type": "text"}, # Ensuring text output
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error communicating with OpenAI API: {e}")
        raise

def _clean_xml_string(xml_string: str) -> str:
    """Cleans the XML string returned by the LLM."""
    # More robust cleaning to handle markdown code blocks and potential leading/trailing text
    if "```xml" in xml_string:
        xml_string = xml_string.split("```xml")[1].split("```")[0].strip()
    elif "<?xml" in xml_string:
        xml_string = xml_string.split("?>", 1)[-1].strip()
    return xml_string.strip()

# --- Core Service Functions ---

def generate_plan_from_llm(request: PlanRequest) -> str:
    """Generates a travel plan by formatting a prompt and calling the LLM."""
    prompt = PROMPT_TEMPLATE.format(
        city=request.city,
        days=request.days,
        interests_str=", ".join(request.interests),
        travel_style=request.travel_style,
        must_visit_pois_str=", ".join(request.must_visit_pois) if request.must_visit_pois else "无",
        budget=request.budget,
        food_price_range=request.food_preferences.price_range,
        food_cuisine_types=", ".join(request.food_preferences.cuisine_types),
        food_dietary_restrictions=request.food_preferences.dietary_restrictions or "无"
    )
    return _call_llm(prompt)

def regenerate_activity_from_llm(request: RegenerateRequest) -> str:
    """Generates a new activity suggestion by calling the LLM."""
    day_plan_str = "\n".join([f"- {act.poi_name} ({act.time}, {act.category})" for act in request.day_plan.activities])
    activity_to_replace_str = f"- {request.activity_to_replace.poi_name} ({request.activity_to_replace.time}, {request.activity_to_replace.category})"

    prompt = REGENERATE_PROMPT_TEMPLATE.format(
        city=request.city,
        interests_str=", ".join(request.interests),
        travel_style=request.travel_style,
        budget=request.budget,
        food_price_range=request.food_preferences.price_range,
        food_cuisine_types=", ".join(request.food_preferences.cuisine_types),
        food_dietary_restrictions=request.food_preferences.dietary_restrictions or "无",
        day_plan_str=day_plan_str,
        activity_to_replace_str=activity_to_replace_str
    )
    return _call_llm(prompt)

# --- XML Parsing Functions ---

def _parse_itinerary_item_node(item_node: ET.Element) -> ItineraryItem:
    """Parses a single <item> XML node into an ItineraryItem object."""
    def get_text(element_name: str, default="N/A"): # Helper to avoid repetition
        element = item_node.find(element_name)
        return element.text.strip() if element is not None and element.text else default

    return ItineraryItem(
        category=get_text("category", "景点"),
        time=get_text("time"),
        poi_name=get_text("poi_name"),
        description=get_text("description"),
        lat=float(get_text("lat", "0.0")),
        lon=float(get_text("lon", "0.0")),
        travel_from_previous=get_text("travel_from_previous"),
        opening_hours=get_text("opening_hours"),
        booking_info=get_text("booking_info"),
        price=get_text("price"),
        local_tip=get_text("local_tip"),
    )

def parse_xml_to_json(xml_string: str) -> ItineraryResponse:
    """Parses the full itinerary XML string into an ItineraryResponse object."""
    try:
        cleaned_xml = _clean_xml_string(xml_string)
        root = ET.fromstring(cleaned_xml)

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
            for item_node in day_node.findall("item"):
                day_plan_data["activities"].append(_parse_itinerary_item_node(item_node))
            itinerary_data["itinerary"].append(DayPlan(**day_plan_data))

        return ItineraryResponse(**itinerary_data)
    except (ET.ParseError, ValueError, TypeError, KeyError) as e:
        raise ValueError(f"Failed to parse LLM XML output: {e}. Received XML (first 500 chars): {xml_string[:500]}...")

def parse_single_activity_xml(xml_string: str) -> ItineraryItem:
    """Parses a single <item> XML string for regeneration purposes."""
    try:
        cleaned_xml = _clean_xml_string(xml_string)
        item_node = ET.fromstring(cleaned_xml)
        return _parse_itinerary_item_node(item_node)
    except (ET.ParseError, ValueError, TypeError, KeyError) as e:
        raise ValueError(f"Failed to parse single item XML from LLM: {e}. Received XML: {xml_string}")

# --- Itinerary Persistence ---

ITINERARY_STORAGE_PATH = "./saved_itineraries"

def save_itinerary_to_file(itinerary: ItineraryResponse) -> SaveResponse:
    """Saves a full itinerary to a JSON file."""
    try:
        if not os.path.exists(ITINERARY_STORAGE_PATH):
            os.makedirs(ITINERARY_STORAGE_PATH)
        
        itinerary_id = str(uuid.uuid4())
        file_path = os.path.join(ITINERARY_STORAGE_PATH, f"{itinerary_id}.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(itinerary.model_dump(), f, ensure_ascii=False, indent=4)
            
        return SaveResponse(success=True, message="行程保存成功！", itinerary_id=itinerary_id)
    except IOError as e:
        print(f"Error saving itinerary to file: {e}")
        return SaveResponse(success=False, message=f"文件写入失败: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during save: {e}")
        return SaveResponse(success=False, message=f"发生未知错误: {e}")