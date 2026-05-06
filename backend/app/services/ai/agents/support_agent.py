from langchain_core.prompts import PromptTemplate
from app.services.ai.llm import get_llm
from app.services.ai.state import AgentState

# Pydantic is not strictly needed for basic JSON output from Llama3 if we prompt correctly,
# but using structured output is best. We'll use simple prompting for the router.
ROUTER_PROMPT = """You are the Support Agent for a Healthcare AI System.
Your job is to analyze the user's query and classify it into one of the following categories:

1. "junior_doctor": For normal or low-severity health issues, general symptoms, or reading basic patient reports.
2. "senior_doctor": For complex, high-severity cases, chronic illnesses, or cases requiring deep diagnosis and tool usage.
3. "nutrition": For queries strictly related to diet, food, lifestyle, and nutrition.
4. "general": For non-medical questions, greetings, or general support queries.

User Query: {query}

Respond with exactly ONE word representing the category:
(junior_doctor, senior_doctor, nutrition, general)
"""

def support_agent_node(state: AgentState):
    llm = get_llm()
    prompt = PromptTemplate.from_template(ROUTER_PROMPT)
    
    # Get the latest user message
    user_query = state["messages"][-1].content
    
    chain = prompt | llm
    response = chain.invoke({"query": user_query})
    
    classification = response.content.strip().lower()
    
    # Handle unexpected outputs
    valid_categories = ["junior_doctor", "senior_doctor", "nutrition", "general"]
    if classification not in valid_categories:
        classification = "general"
        
    return {
        "classification": classification,
        "next_agent": classification
    }
