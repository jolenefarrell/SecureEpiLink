from pydantic import BaseModel
from typing import Optional 

class AnalysisRunCreate(BaseModel):
    """
    Schema for creating a new AnalysisRun.
    """
    analysis_id: str
    analysis_version: str  
    pathogen: str  # Pathogen for which the analysis is being run


class AnalysisRunCreateResponse(BaseModel):
    """
    Response schema for creating an AnalysisRun.
    """

