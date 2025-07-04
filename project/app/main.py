from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from .schemas import (
    PlanRequest, 
    ItineraryResponse, 
    RegenerateRequest, 
    ItineraryItem, 
    SaveResponse
)
from .services import (
    generate_plan_from_llm, 
    parse_xml_to_json, 
    regenerate_activity_from_llm,
    parse_single_activity_xml,
    save_itinerary_to_file,
    recalculate_itinerary_travel_times
)
import logging

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---
app = FastAPI(
    title="行程AIGC API",
    version="1.2",
    description="使用 LLM 生成、修改和保存旅行行程的 API。"
)

# --- API Endpoints ---

@app.post("/api/plan", response_model=ItineraryResponse)
async def create_plan(request: PlanRequest):
    """Receives travel preferences and returns a fully generated itinerary."""
    logger.info(f"Received itinerary planning request for {request.city}")
    try:
        logger.info("Generating itinerary plan from LLM...")
        xml_response = await generate_plan_from_llm(request)
        logger.info(f"Received LLM XML response snippet: {xml_response[:150]}...")

        logger.info("Parsing XML to JSON...")
        json_response = parse_xml_to_json(xml_response)
        logger.info("Successfully parsed XML to JSON.")

        return json_response
    except ValueError as e:
        logger.error(f"ValueError during plan generation: {e}")
        raise HTTPException(status_code=500, detail=f"LLM response parsing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during plan generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/api/regenerate-activity", response_model=ItineraryItem)
async def regenerate_activity(request: RegenerateRequest):
    """Receives context and an activity to replace, returns a new activity."""
    logger.info(f"Received activity regeneration request for '{request.activity_to_replace.poi_name}'")
    try:
        logger.info("Getting new activity suggestion from LLM...")
        xml_response = await regenerate_activity_from_llm(request)
        logger.info(f"Received LLM XML response: {xml_response}")

        logger.info("Parsing single activity XML...")
        new_activity = parse_single_activity_xml(xml_response)
        logger.info(f"Successfully parsed new activity: {new_activity.poi_name}")

        return new_activity
    except ValueError as e:
        logger.error(f"ValueError during activity regeneration: {e}")
        raise HTTPException(status_code=500, detail=f"LLM response parsing error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during activity regeneration: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/api/save-itinerary", response_model=SaveResponse)
async def save_itinerary(itinerary: ItineraryResponse = Body(...)):
    """Receives a complete itinerary and saves it to a file."""
    logger.info(f"Received request to save itinerary for {itinerary.city}")
    try:
        save_result = save_itinerary_to_file(itinerary)
        if save_result.success:
            logger.info(f"Successfully saved itinerary with ID: {save_result.itinerary_id}")
            return save_result
        else:
            logger.error(f"Failed to save itinerary: {save_result.message}")
            raise HTTPException(status_code=500, detail=save_result.message)
    except Exception as e:
        logger.error(f"Unexpected error during itinerary save: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")

@app.post("/api/update-itinerary", response_model=ItineraryResponse)
async def update_itinerary(request_plan: ItineraryResponse = Body(...)):
    """
    Receives a potentially modified itinerary, recalculates travel times using LLM,
    and returns the updated itinerary.
    """
    logger.info(f"Received itinerary update request for {request_plan.city}")
    try:
        logger.info("Recalculating travel times for the itinerary using LLM...")
        # The service function returns an XML string
        updated_xml_response = await recalculate_itinerary_travel_times(request_plan)
        logger.info(f"Received updated LLM XML response snippet: {updated_xml_response[:150]}...")

        logger.info("Parsing updated XML to JSON...")
        # Use the existing XML parsing function
        json_response = parse_xml_to_json(updated_xml_response)
        logger.info("Successfully parsed updated XML to JSON.")

        # Optionally, one might want to save this updated itinerary here as well.
        # For now, just returning the updated version.
        # save_itinerary_to_file(json_response) 

        return json_response
    except ValueError as e:
        logger.error(f"ValueError during itinerary update: {e}")
        raise HTTPException(status_code=500, detail=f"LLM response parsing error during update: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during itinerary update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during update: {e}")
