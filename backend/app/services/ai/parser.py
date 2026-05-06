import json
from typing import List, Dict, Any
from app.services.ai.llm import get_llm
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# Define structured output schema for more robust parsing
class LabResult(BaseModel):
    test_name: str = Field(description="Name of the medical test")
    value: float = Field(description="The numeric result value")
    unit: str = Field(description="The unit of measurement")
    min_ref: float = Field(description="Minimum reference value if available", default=None)
    max_ref: float = Field(description="Maximum reference value if available", default=None)

EXTRACTION_PROMPT_TEMPLATE = """You are a medical data extraction system.
Extract a list of lab results from the following report lines. 
If a reference range is like "70-110", min is 70 and max is 110.

Input Lines:
{lines}

{format_instructions}
"""

def classify_value(value, ref_min, ref_max):
    if ref_min is None or ref_max is None:
        return "NORMAL" # Default to normal if range is unknown
        
    try:
        val = float(value)
        if val < float(ref_min):
            return "LOW"
        elif val > float(ref_max):
            return "HIGH"
        else:
            return "NORMAL"
    except (ValueError, TypeError):
        return "NORMAL"

def categorize_test(test_name: str) -> str:
    name = test_name.lower()
    CATEGORIES = {
        "CBC": ["hemoglobin", "rbc", "wbc", "platelet", "mcv", "mch", "mchc", "hematocrit", "lymphocytes", "neutrophils"],
        "Lipid Profile": ["cholesterol", "triglycerides", "hdl", "ldl", "vldl"],
        "Diabetes": ["glucose", "hba1c", "insulin", "sugar", "diabetic"],
        "Thyroid": ["tsh", "t3", "t4", "thyroxine", "thyroid"],
        "Vitamins": ["vitamin", "b12", "folate", "ferritin", "d3"]
    }
    for category, keywords in CATEGORIES.items():
        if any(keyword in name for keyword in keywords):
            return category
    return "Others"

def parse_lab_report_lines(lines: List[str]) -> List[Dict[str, Any]]:
    if not lines:
        return []

    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=LabResult)
    
    prompt = PromptTemplate(
        template=EXTRACTION_PROMPT_TEMPLATE,
        input_variables=["lines"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    
    lines_input = "\n".join(lines[:100]) # Limit to first 100 lines for prompt safety
    chain = prompt | llm | parser
    
    try:
        results = chain.invoke({"lines": lines_input})
        
        # Ensure results is a list
        if isinstance(results, dict):
            # Sometimes LLM returns a single dict instead of a list of dicts
            results = [results]
        
        # Augment results with status and category
        final_results = []
        for item in results:
            if not isinstance(item, dict): continue
            
            test_name = item.get("test_name", "Unknown Test")
            val = item.get("value")
            
            if val is None: continue

            # Add Status
            item["status"] = classify_value(val, item.get("min_ref"), item.get("max_ref"))
            
            # Add Category
            item["category"] = categorize_test(test_name)
            
            # Normalize for frontend
            final_results.append({
                "test_name": test_name,
                "value": val,
                "unit": item.get("unit", ""),
                "status": item["status"],
                "category": item["category"]
            })
                
        return final_results
            
    except Exception as e:
        print(f"Error parsing lab report: {str(e)}")
        return []
