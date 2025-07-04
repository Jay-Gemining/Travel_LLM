import openai
import xml.etree.ElementTree as ET
import asyncio
from .schemas import (
    ItineraryResponse, DayPlan, ItineraryItem, RegenerateRequest, PlanRequest,
    FoodPreferences, SaveResponse
)
from .prompt_template import PROMPT_TEMPLATE, REGENERATE_PROMPT_TEMPLATE, RECALCULATE_TRAVEL_PROMPT_TEMPLATE
import os
import uuid
import xml.etree.ElementTree as ET
import json
from openai import OpenAI
from dotenv import load_dotenv

# --- Environment and API Key Setup ---
load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
MODEL = os.environ.get("MODEL")

# --- Utility Functions ---

def _get_openai_client_sync():
    """Initializes and returns the synchronous OpenAI client."""
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

async def _get_openai_client_async():
    """Initializes and returns the asynchronous OpenAI client."""
    # Assuming the OpenAI library supports an async client or we use httpx for async calls
    # For now, let's use the sync client in a thread to avoid blocking
    # This is a common pattern if the SDK doesn't have a native async client or if it's complex to switch
    # from openai import AsyncOpenAI # This would be ideal if available and configured
    # return AsyncOpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
    #
    # Using a placeholder for actual async call for now, or run sync in executor
    # For simplicity in this step, we'll run the sync call in an executor
    import asyncio
    return _get_openai_client_sync() # Placeholder, will be used with run_in_executor


async def _call_llm_async(prompt: str) -> str:
    """Calls the LLM asynchronously and returns its content, with error handling."""
    try:
        # Ideal: client = await _get_openai_client_async()
        # response = await client.chat.completions.create(...)
        # For now, running the synchronous call in an executor
        client = _get_openai_client_sync() # This is sync
        
        # Wrap the synchronous SDK call in asyncio.to_thread (Python 3.9+)
        # or loop.run_in_executor for broader compatibility.
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, # Uses the default thread pool executor
            lambda: client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error communicating with OpenAI API: {e}")
        raise

# This synchronous version might still be needed if called from non-async code,
# but FastAPI endpoints should use the async version.
def _call_llm_sync(prompt: str) -> str:
    """Synchronous LLM call (original _call_llm renamed)."""
    try:
        client = _get_openai_client_sync()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8, 
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

async def generate_plan_from_llm(request: PlanRequest) -> str:
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
    return await _call_llm_async(prompt)

async def regenerate_activity_from_llm(request: RegenerateRequest) -> str:
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
    return await _call_llm_async(prompt)

# --- Itinerary to XML Conversion for Recalculation ---
def _itinerary_response_to_xml_string(plan: ItineraryResponse) -> str:
    """Converts an ItineraryResponse object to an XML string for the recalculation prompt."""
    root = ET.Element("itinerary")
    root.set("city", plan.city)
    root.set("total_days", str(plan.total_days))

    for day_plan in plan.itinerary:
        day_el = ET.SubElement(root, "day")
        day_el.set("number", str(day_plan.day))
        for activity in day_plan.activities:
            item_el = ET.SubElement(day_el, "item")
            
            ET.SubElement(item_el, "category").text = activity.category
            ET.SubElement(item_el, "time").text = activity.time
            ET.SubElement(item_el, "poi_name").text = activity.poi_name
            ET.SubElement(item_el, "description").text = activity.description
            ET.SubElement(item_el, "lat").text = str(activity.lat)
            ET.SubElement(item_el, "lon").text = str(activity.lon)
            # For recalculation, travel_from_previous might be stale, but we send it as is.
            # The LLM is tasked to recalculate this specific field.
            ET.SubElement(item_el, "travel_from_previous").text = activity.travel_from_previous
            ET.SubElement(item_el, "opening_hours").text = activity.opening_hours
            ET.SubElement(item_el, "booking_info").text = activity.booking_info
            ET.SubElement(item_el, "price").text = activity.price
            ET.SubElement(item_el, "local_tip").text = activity.local_tip
            
    # Convert the XML tree to a string
    # ET.indent(root) # For pretty printing, if supported and desired (Python 3.9+)
    return ET.tostring(root, encoding="unicode")

async def recalculate_itinerary_travel_times(plan: ItineraryResponse) -> str:
    """
    Takes an existing itinerary, converts it to XML, sends it to the LLM (asynchronously)
    for travel time recalculation, and returns the new XML itinerary.
    """
    itinerary_xml_str = _itinerary_response_to_xml_string(plan)
    
    prompt = RECALCULATE_TRAVEL_PROMPT_TEMPLATE.format(
        city=plan.city,
        total_days=plan.total_days,
        itinerary_xml_string=itinerary_xml_str
    )
    
    # The LLM is expected to return a full XML itinerary string with updated travel times.
    # This string will then be parsed by parse_xml_to_json by the caller in main.py
    return await _call_llm_async(prompt)

# --- XML Parsing Functions ---

def _parse_itinerary_item_node(item_node: ET.Element) -> ItineraryItem:
    """Parses a single <item> XML node into an ItineraryItem object."""
    def get_text(element_name: str, default="N/A"): # Helper to avoid repetition
        element = item_node.find(element_name)
        return element.text.strip() if element is not None and element.text else default

    return ItineraryItem(
        id=str(uuid.uuid4()), # Generate a unique ID for each item
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