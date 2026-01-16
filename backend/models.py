from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

class SchemaBase(BaseModel):
    name: str
    description: Optional[str] = None
    json_schema: Dict[str, Any]

class SchemaCreate(SchemaBase):
    pass

class SchemaResponse(SchemaBase):
    version: int
    created_at: str

class SchemaVersion(BaseModel):
    version: int
    json_schema: Dict[str, Any]
    created_at: str

class ValidationRequest(BaseModel):
    schema_name: str
    data: List[Dict[str, Any]]  # For JSON payload validation

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str]

class MappingCreate(BaseModel):
    schema_name: str
    mapping_rules: Dict[str, str]  # e.g., {"source_col": "target_col"}

class MappingResponse(MappingCreate):
    id: int
    created_at: str
