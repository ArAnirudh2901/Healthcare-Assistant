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
        ("system", f"""You are a Junior Doctor AI.
        You handle normal or low-severity healthcare cases and read basic patient reports.
        If a case seems too severe or complex, you should advise the patient to consult a senior doctor.
        
        Relevant context from patient reports:
        {context}"""),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})
    
    return {"final_response": response.content}
