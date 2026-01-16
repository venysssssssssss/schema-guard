from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import json

from models import SchemaCreate, SchemaResponse, ValidationRequest, ValidationResult, MappingCreate
from services import register_schema, get_latest_schema, validate_payload, diff_schemas, save_mapping, apply_mapping_rules, get_latest_mapping
from database import init_db, get_connection

app = FastAPI(title="Schema Guard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/schemas", response_model=SchemaResponse)
def create_schema(schema: SchemaCreate):
    return register_schema(schema)

@app.get("/schemas", response_model=List[SchemaResponse])
def list_schemas():
    conn = get_connection()
    try:
        results = conn.execute("""
            SELECT s.name, s.description, v.version, v.json_schema, v.created_at
            FROM schemas s
            JOIN schema_versions v ON s.name = v.schema_name
            WHERE v.version = (SELECT MAX(version) FROM schema_versions WHERE schema_name = s.name)
        """).fetchall()
        
        schemas = []
        for r in results:
            schemas.append(SchemaResponse(
                name=r[0],
                description=r[1],
                version=r[2],
                json_schema=json.loads(r[3]) if isinstance(r[3], str) else r[3],
                created_at=str(r[4])
            ))
        return schemas
    finally:
        conn.close()

@app.get("/schemas/{name}/latest", response_model=SchemaResponse)
def read_latest_schema(name: str):
    schema = get_latest_schema(name)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema

@app.post("/validate", response_model=ValidationResult)
def validate_json(request: ValidationRequest):
    result = validate_payload(request.schema_name, request.data)
    return ValidationResult(**result)

@app.post("/validate-file")
async def validate_file(schema_name: str, file: UploadFile = File(...), apply_mapping: bool = False):
    # Read file
    content = await file.read()
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(content))
        # Handle nan as None for JSON compatibility
        df = df.where(pd.notnull(df), None)
        data = df.to_dict(orient='records')
    elif file.filename.endswith('.json'):
        data = json.loads(content)
        if not isinstance(data, list):
            data = [data]
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Apply mapping if requested
    if apply_mapping:
        mapping_rules = get_latest_mapping(schema_name)
        if mapping_rules:
            data = apply_mapping_rules(data, mapping_rules)
    
    result = validate_payload(schema_name, data)
    return result

@app.get("/schemas/{name}/diff")
def get_diff(name: str, v1: int, v2: int):
    return diff_schemas(name, v1, v2)

@app.post("/schemas/mapping")
def create_mapping(mapping: MappingCreate):
    id = save_mapping(mapping.schema_name, mapping.mapping_rules)
    return {"id": id, "status": "created"}
