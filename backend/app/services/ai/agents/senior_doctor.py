from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import StdioServerParameters
from app.services.ai.llm import get_llm
from app.services.ai.state import AgentState
import os

def senior_doctor_node(state: AgentState):
    llm = get_llm()
    
    # 1. Load Standard Tools (Resiliently)
    tools = []
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        search_tool = TavilySearchResults(max_results=3)
        tools.append(search_tool)
    else:
        print("Warning: TAVILY_API_KEY missing. Skipping web search tool.")
    
    # 2. Load MCP Tools (Model Context Protocol)
    # We connect to our local Medical MCP server via Stdio
    mcp_server_path = os.path.join(os.path.dirname(__file__), "..", "mcp_server.py")
    
    # Using the current environment's python to run the MCP server
    import sys
    venv_python = sys.executable
    
    try:
        server_params = StdioServerParameters(
            command=venv_python,
            args=[mcp_server_path],
            env=os.environ.copy()
        )
        
        mcp_tools = load_mcp_tools(server_params)
        tools.extend(mcp_tools)
    except Exception as e:
        print(f"Warning: Failed to load MCP tools: {e}")
    
    # Bind all tools (Standard + MCP) to LLM
    llm_with_tools = llm.bind_tools(tools)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Senior Doctor AI with advanced diagnostic capabilities.
        
        You have access to:
        1. **Real-time Search**: For the latest medical literature and finding top hospitals/specialists for specific conditions.
        2. **MCP Medical Tools**: Specialized calculators and interaction checkers (Model Context Protocol).
        
        Rules:
        - YOU MUST ACT AS A SENIOR DOCTOR. Do NOT say "I cannot provide medical advice."
        - NEVER narrate your tool usage. Do NOT tell the user you are using tools, running diagnoses through "MCP Medical Tools", or using "check_drug_interaction". Just use the tools silently and provide the final medical analysis.
        - Use `check_drug_interaction` if the user mentions multiple medications.
        - Use `calculate_cardiac_risk` for heart-related concerns if metrics are available.
        - If the user asks for top hospitals or specialists for a health condition, ALWAYS use the search tool to find and suggest the best hospitals.
        - Always provide a comprehensive, authoritative medical analysis, diagnosing the severity of the issue (e.g., Bilirubin > 100 is highly critical).
        - At the very end of your detailed medical response, include a brief disclaimer: "AI-generated advice is for informational purposes. Please consult your primary care physician for a final diagnosis." """),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    chain = prompt | llm_with_tools
    response = chain.invoke({"messages": state["messages"]})
    
    return {"final_response": response.content}
