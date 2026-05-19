from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.services.ai.llm import get_llm
from app.services.ai.state import AgentState
from app.services.ai.rag import retrieve_context

def junior_doctor_node(state: AgentState):
    llm = get_llm()
    
    # Get the latest user query for RAG retrieval
    user_query = state["messages"][-1].content
    context = retrieve_context(user_query, user_id=state["user_id"])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are a Junior Doctor AI for the MediHealth platform. 
        Your role is to evaluate patient symptoms, analyze medical data, and provide preliminary clinical insights.
        
        CRITICAL INSTRUCTIONS:
        1. YOU MUST ACT AS A DOCTOR. Do NOT refuse to answer or say "I cannot provide medical advice."
        2. ALWAYS provide a detailed, step-by-step medical analysis of the user's symptoms or lab results. Explain exactly what the values mean.
        3. Do NOT just output a referral. You MUST provide the full clinical analysis FIRST.
        4. After providing a comprehensive analysis, if the condition is severe, you may briefly suggest consulting a senior doctor at the very end.
        
        Relevant context from patient reports:
        {context}"""),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})
    
    return {"final_response": response.content}
