from typing import List, Dict, Any
from app.schemas.risk import RiskAssessment, RiskAssessmentResponse
from datetime import datetime

def calculate_diabetes_risk(lab_data: List[Dict[str, Any]]) -> RiskAssessment:
    """
    Simulates a Diabetes Risk Assessment based on Glucose and HbA1c levels.
    """
    glucose = next((i for i in lab_data if "glucose" in i["test_name"].lower()), None)
    hba1c = next((i for i in lab_data if "hba1c" in i["test_name"].lower()), None)
    
    score = 0.0
    factors = []
    
    if glucose:
        val = float(glucose["value"])
        if val > 126:
            score += 0.6
            factors.append(f"High Fasting Glucose ({val} {glucose['unit']})")
        elif val > 100:
            score += 0.3
            factors.append(f"Borderline Glucose ({val} {glucose['unit']})")
            
    if hba1c:
        val = float(hba1c["value"])
        if val > 6.5:
            score += 0.8
            factors.append(f"Critical HbA1c Level ({val}%)")
        elif val > 5.7:
            score += 0.4
            factors.append(f"Pre-diabetic HbA1c Level ({val}%)")
            
    # Normalize score
    score = min(score, 1.0)
    
    level = "LOW"
    if score > 0.7: level = "HIGH"
    elif score > 0.3: level = "MODERATE"
    
    return RiskAssessment(
        condition="Type 2 Diabetes",
        risk_level=level,
        score=score,
        contributing_factors=factors if factors else ["No significant markers found"],
        recommendation="Maintain a low-glycemic diet and consult a doctor if score is HIGH."
    )

def calculate_cvd_risk(lab_data: List[Dict[str, Any]]) -> RiskAssessment:
    """
    Simulates Cardiovascular Disease Risk based on Lipid Profile.
    """
    ldl = next((i for i in lab_data if "ldl" in i["test_name"].lower()), None)
    hdl = next((i for i in lab_data if "hdl" in i["test_name"].lower() and "vldl" not in i["test_name"].lower()), None)
    chol = next((i for i in lab_data if "cholesterol" in i["test_name"].lower() and "ldl" not in i["test_name"].lower() and "hdl" not in i["test_name"].lower()), None)
    
    score = 0.0
    factors = []
    
    if ldl and float(ldl["value"]) > 160:
        score += 0.5
        factors.append(f"High LDL Cholesterol ({ldl['value']})")
    
    if hdl and float(hdl['value']) < 40:
        score += 0.3
        factors.append(f"Low HDL 'Good' Cholesterol ({hdl['value']})")
        
    if chol and float(chol['value']) > 240:
        score += 0.4
        factors.append(f"High Total Cholesterol ({chol['value']})")
        
    score = min(score, 1.0)
    level = "LOW"
    if score > 0.6: level = "HIGH"
    elif score > 0.3: level = "MODERATE"
    
    return RiskAssessment(
        condition="Cardiovascular Disease",
        risk_level=level,
        score=score,
        contributing_factors=factors if factors else ["Lipid profile within normal ranges"],
        recommendation="Regular aerobic exercise and a heart-healthy diet are recommended."
    )

def perform_full_risk_assessment(lab_data: List[Dict[str, Any]]) -> RiskAssessmentResponse:
    if not lab_data:
        return RiskAssessmentResponse(
            overall_status="INSUFFICIENT_DATA",
            assessments=[],
            last_updated=datetime.now().isoformat()
        )
        
    assessments = [
        calculate_diabetes_risk(lab_data),
        calculate_cvd_risk(lab_data)
    ]
    
    # Determine overall status
    high_risks = [a for a in assessments if a.risk_level == "HIGH"]
    if high_risks:
        status = "CRITICAL"
    elif any(a for a in assessments if a.risk_level == "MODERATE"):
        status = "ATTENTION_REQUIRED"
    else:
        status = "HEALTHY"
        
    return RiskAssessmentResponse(
        overall_status=status,
        assessments=assessments,
        last_updated=datetime.now().isoformat()
    )
