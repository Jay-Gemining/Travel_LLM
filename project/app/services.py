import openai
import xml.etree.ElementTree as ET
from .schemas import ItineraryResponse, DayPlan, Activity
from .prompt_template import PROMPT_TEMPLATE
import os

# openai.api_key = os.environ.get("OPENAI_API_KEY") # 从环境变量加载 OpenAI API密钥

# 用于本地开发且无API密钥时的模拟LLM响应
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

    # 在真实场景中，你会在这里进行 OpenAI API 调用。
    # 目前，我们将返回一个模拟的 XML 响应。
    # print(f"为 LLM 生成的提示: {prompt}") # 用于调试

    # 模拟 LLM 调用
    # response = openai.chat.completions.create(
    #     model="gpt-4-1106-preview", # 或其他有能力的模型
    #     messages=[{"role": "user", "content": prompt}],
    #     temperature=0.7,
    # )
    # xml_output = response.choices[0].message.content

    # 返回模拟的 XML 而不是进行真实的 API 调用
    # 这个模拟会使用请求中的城市和天数，以实现更动态的“模拟”，
    # 但实际内容将来自硬编码的 SIMULATED_LLM_XML_OUTPUT，
    # 只是更新了 city 和 total_days 属性。

    try:
        root = ET.fromstring(SIMULATED_LLM_XML_OUTPUT)
        root.set("city", city)
        root.set("total_days", str(days))

        # 如果请求的天数与模板不同，则调整模拟响应中的天数
        day_nodes = root.findall("day")
        current_simulated_days = len(day_nodes)

        if days < current_simulated_days:
            # 如果请求天数较少，则删除多余的天
            for i in range(current_simulated_days - 1, days - 1, -1):
                root.remove(day_nodes[i])
        elif days > current_simulated_days:
            # 如果请求天数较多，则添加新的天
            for i in range(current_simulated_days, days):
                new_day_node = ET.SubElement(root, "day")
                new_day_node.set("number", str(i + 1))

                # 为新的天添加占位活动
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
    except Exception: # 如果XML操作失败，则回退
        xml_output = SIMULATED_LLM_XML_OUTPUT # 返回原始模拟数据

    return xml_output

def parse_xml_to_json(xml_string: str) -> ItineraryResponse:
    try:
        # 清理输入：LLM有时可能在XML之外包含markdown或其他文本
        if "```xml" in xml_string:
            xml_string = xml_string.split("```xml")[1].split("```")[0].strip()
        elif "<?xml" in xml_string: # 处理XML声明存在的情况
             xml_string = xml_string.split("?>", 1)[-1].strip()


        root = ET.fromstring(xml_string)

        itinerary_data = {
            "city": root.attrib.get("city"),
            "total_days": int(root.attrib.get("total_days")),
            "itinerary": []
        }

        for day_node in root.findall("day"):
            day_plan_data = { # 更改变量名以避免与DayPlan模型冲突
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
        raise ValueError(f"解析 LLM XML 输出失败 (ParseError): {e}。收到的XML (前500字符): {xml_string[:500]}...") # 包含XML的开头部分以便调试
    except Exception as e:
        # 处理其他解析错误，LLM可能返回格式错误的XML
        raise ValueError(f"解析 LLM XML 输出失败 (General Error): {e}。收到的XML (前500字符): {xml_string[:500]}...")
