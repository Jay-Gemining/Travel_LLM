import openai
import xml.etree.ElementTree as ET
from .schemas import ItineraryResponse, DayPlan, Activity
from .prompt_template import PROMPT_TEMPLATE
import os

# openai.api_key = os.environ.get("OPENAI_API_KEY") # Load from environment variables

# Simulated LLM Response for local development without API key
SIMULATED_LLM_XML_OUTPUT = """
<itinerary city="成都" total_days="2">
  <day number="1">
    <activity>
      <time>上午 (09:00-12:00)</time>
      <poi_name>成都大熊猫繁育研究基地</poi_name>
      <description>近距离观察可爱的国宝大熊猫，感受它们的憨态可掬。</description>
      <type>景点</type>
    </activity>
    <activity>
      <time>中午</time>
      <poi_name>陈麻婆豆腐</poi_name>
      <description>品尝正宗川菜麻婆豆腐的发源地，体验麻辣鲜香的极致诱惑。</description>
      <type>美食</type>
    </activity>
    <activity>
      <time>下午 (14:00-17:00)</time>
      <poi_name>宽窄巷子</poi_name>
      <description>漫步清末民初风格的仿古街道，感受成都的悠闲生活和历史韵味。</description>
      <type>景点</type>
    </activity>
  </day>
  <day number="2">
    <activity>
      <time>上午 (10:00-12:00)</time>
      <poi_name>武侯祠</poi_name>
      <description>探访纪念蜀汉丞相诸葛亮的祠堂，了解三国历史文化。</description>
      <type>景点</type>
    </activity>
    <activity>
      <time>中午</time>
      <poi_name>夫妻肺片总店</poi_name>
      <description>尝试另一道成都名菜夫妻肺片，感受其独特的复合味道。</description>
      <type>美食</type>
    </activity>
    <activity>
      <time>下午 (15:00-18:00)</time>
      <poi_name>春熙路</poi_name>
      <description>成都最繁华的商业街之一，尽情享受购物的乐趣。</description>
      <type>购物</type>
    </activity>
  </day>
</itinerary>
"""

def generate_plan_from_llm(city: str, days: int, interests: list) -> str:
    interests_str = ", ".join(interests)
    prompt = PROMPT_TEMPLATE.format(city=city, days=days, interests_str=interests_str)

    # In a real scenario, you would make the OpenAI API call here.
    # For now, we'll return a simulated XML response.
    # print(f"Generated prompt for LLM: {prompt}") # For debugging

    # Simulate LLM call
    # response = openai.chat.completions.create(
    #     model="gpt-4-1106-preview", # or another capable model
    #     messages=[{"role": "user", "content": prompt}],
    #     temperature=0.7,
    # )
    # xml_output = response.choices[0].message.content

    # Returning simulated XML instead of making a real API call
    # This simulation will use the city and days from the request for more dynamic "simulation"
    # but the actual content will be from the hardcoded SIMULATED_LLM_XML_OUTPUT,
    # just with updated city and total_days attributes.

    try:
        root = ET.fromstring(SIMULATED_LLM_XML_OUTPUT)
        root.set("city", city)
        root.set("total_days", str(days))

        # Adjust number of days in the simulated response if different from template
        day_nodes = root.findall("day")
        current_simulated_days = len(day_nodes)

        if days < current_simulated_days:
            for i in range(current_simulated_days - 1, days - 1, -1):
                root.remove(day_nodes[i])
        elif days > current_simulated_days:
            for i in range(current_simulated_days, days):
                new_day_node = ET.SubElement(root, "day")
                new_day_node.set("number", str(i + 1))

                # Add a placeholder activity for new days
                activity_node = ET.SubElement(new_day_node, "activity")
                time_node = ET.SubElement(activity_node, "time")
                time_node.text = "全天"
                poi_node = ET.SubElement(activity_node, "poi_name")
                poi_node.text = f"{city}第{i+1}天自由活动"
                desc_node = ET.SubElement(activity_node, "description")
                desc_node.text = f"根据您的兴趣({interests_str})自由探索{city}。"
                type_node = ET.SubElement(activity_node, "type")
                type_node.text = "体验"

        xml_output = ET.tostring(root, encoding="unicode")
    except Exception: # Fallback if XML manipulation fails
        xml_output = SIMULATED_LLM_XML_OUTPUT # return the original simulation

    return xml_output

def parse_xml_to_json(xml_string: str) -> ItineraryResponse:
    try:
        # Sanitize input: LLMs can sometimes include markdown or other text outside the XML
        if "```xml" in xml_string:
            xml_string = xml_string.split("```xml")[1].split("```")[0].strip()
        elif "<?xml" in xml_string: # Handle if prolog is present
             xml_string = xml_string.split("?>", 1)[-1].strip()


        root = ET.fromstring(xml_string)

        itinerary_data = {
            "city": root.attrib.get("city"),
            "total_days": int(root.attrib.get("total_days")),
            "itinerary": []
        }

        for day_node in root.findall("day"):
            day_plan_data = { # Changed variable name to avoid conflict with DayPlan model
                "day": int(day_node.attrib.get("number")),
                "activities": []
            }
            for activity_node in day_node.findall("activity"):
                activity_data = {
                    "time": activity_node.find("time").text if activity_node.find("time") is not None else "N/A",
                    "poi_name": activity_node.find("poi_name").text if activity_node.find("poi_name") is not None else "N/A",
                    "description": activity_node.find("description").text if activity_node.find("description") is not None else "N/A",
                    "type": activity_node.find("type").text if activity_node.find("type") is not None else "N/A",
                }
                day_plan_data["activities"].append(Activity(**activity_data))
            itinerary_data["itinerary"].append(DayPlan(**day_plan_data))

        return ItineraryResponse(**itinerary_data)
    except ET.ParseError as e:
        raise ValueError(f"Failed to parse LLM XML output (ParseError): {e}. XML received: {xml_string[:500]}...") # Include start of XML for debugging
    except Exception as e:
        # Handle other parsing errors, LLM might return malformed XML
        raise ValueError(f"Failed to parse LLM XML output (General Error): {e}. XML received: {xml_string[:500]}...")
