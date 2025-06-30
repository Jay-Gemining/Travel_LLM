from fastapi import FastAPI, HTTPException
from .schemas import PlanRequest, ItineraryResponse
from .services import generate_plan_from_llm, parse_xml_to_json
import logging # Optional: for better logging

# Optional: Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="行程AIGC API",
    version="1.0",
    description="API for generating travel itineraries using an LLM."
)

@app.post("/api/plan", response_model=ItineraryResponse)
async def create_plan(request: PlanRequest):
    logger.info(f"Received plan request: City={request.city}, Days={request.days}, Interests={request.interests}")
    try:
        # Step 1: Call LLM (or simulator) to get XML
        logger.info("Generating plan from LLM...")
        xml_response = generate_plan_from_llm(request.city, request.days, request.interests)
        logger.info(f"LLM XML response received (first 100 chars): {xml_response[:100]}")

        # Step 2: Parse XML and convert to Pydantic/JSON model
        logger.info("Parsing XML to JSON...")
        json_response = parse_xml_to_json(xml_response)
        logger.info("Successfully parsed XML to JSON.")

        return json_response
    except ValueError as e:
        logger.error(f"ValueError during plan generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM Response Parsing Error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during plan generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# Example for running with uvicorn directly (optional, for easy testing)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
