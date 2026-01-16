import json
import duckdb
import jsonschema
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
from database import get_connection
from models import SchemaCreate, SchemaResponse

def register_schema(schema_data: SchemaCreate) -> SchemaResponse:
    conn = get_connection()
    try:
        # Check if schema exists
        exists = conn.execute("SELECT name FROM schemas WHERE name = ?", [schema_data.name]).fetchone()
        
        if not exists:
            conn.execute("INSERT INTO schemas (name, description) VALUES (?, ?)", 
                         [schema_data.name, schema_data.description])
            version = 1
        else:
            # Get latest version
            last_version = conn.execute("SELECT MAX(version) FROM schema_versions WHERE schema_name = ?", 
                                        [schema_data.name]).fetchone()
            version = (last_version[0] or 0) + 1
            
        # Insert new version
        json_str = json.dumps(schema_data.json_schema)
        conn.execute("INSERT INTO schema_versions (schema_name, version, json_schema) VALUES (?, ?, ?)",
                     [schema_data.name, version, json_str])
        
        created_at = datetime.now().isoformat() # Placeholder, ideally fetch from DB
        
        return SchemaResponse(
            name=schema_data.name,
            description=schema_data.description,
            json_schema=schema_data.json_schema,
            version=version,
            created_at=created_at
        )
    finally:
        conn.close()

def get_latest_schema(name: str) -> Optional[SchemaResponse]:
    conn = get_connection()
    try:
        result = conn.execute("""
            SELECT s.name, s.description, v.version, v.json_schema, v.created_at
            FROM schemas s
            JOIN schema_versions v ON s.name = v.schema_name
            WHERE s.name = ?
            ORDER BY v.version DESC
            LIMIT 1
        """, [name]).fetchone()
        
        if result:
            return SchemaResponse(
                name=result[0],
                description=result[1],
                version=result[2],
                json_schema=json.loads(result[3]) if isinstance(result[3], str) else result[3],
                created_at=str(result[4])
            )
        return None
    finally:
        conn.close()

def validate_payload(schema_name: str, data: List[Dict[str, Any]]) -> Dict[str, Any]:
    schema_obj = get_latest_schema(schema_name)
    if not schema_obj:
        return {"valid": False, "errors": [f"Schema '{schema_name}' not found"]}
    
    schema = schema_obj.json_schema
    validator = jsonschema.Draft7Validator(schema)
    
    errors = []
    for idx, item in enumerate(data):
        for error in validator.iter_errors(item):
            errors.append(f"Row {idx}: {error.message}")
            
    if errors:
        return {"valid": False, "errors": errors}
    
    return {"valid": True, "errors": []}

def diff_schemas(schema_name: str, v1: int, v2: int) -> Dict[str, Any]:
    conn = get_connection()
    try:
        def get_ver(v):
            r = conn.execute("SELECT json_schema FROM schema_versions WHERE schema_name = ? AND version = ?", 
                             [schema_name, v]).fetchone()
            return json.loads(r[0]) if r and isinstance(r[0], str) else (r[0] if r else None)
            
        s1 = get_ver(v1)
        s2 = get_ver(v2)
        
        if not s1 or not s2:
            return {"error": "One or both versions not found"}
            
        # Simple diff logic (properties level)
        props1 = s1.get("properties", {})
        props2 = s2.get("properties", {})
        
        added = [k for k in props2 if k not in props1]
        removed = [k for k in props1 if k not in props2]
        modified = []
        
        for k in props1:
            if k in props2:
                if props1[k] != props2[k]:
                    modified.append({"field": k, "from": props1[k], "to": props2[k]})
                    
        return {
            "added": added,
            "removed": removed,
            "modified": modified
        }
    finally:
        conn.close()

def save_mapping(schema_name: str, rules: Dict[str, str]):
    conn = get_connection()
    try:
        rules_json = json.dumps(rules)
        # simplistic: just insert, id via sequence
        next_id = conn.execute("SELECT nextval('mapping_id_seq')").fetchone()[0]
        conn.execute("INSERT INTO mappings (id, schema_name, mapping_rules) VALUES (?, ?, ?)",
                     [next_id, schema_name, rules_json])
        return next_id
    finally:
        conn.close()

def get_latest_mapping(schema_name: str) -> Optional[Dict[str, str]]:
    conn = get_connection()
    try:
        # Get latest mapping by ID (assuming higher ID = newer)
        result = conn.execute("""
            SELECT mapping_rules FROM mappings 
            WHERE schema_name = ? 
            ORDER BY id DESC LIMIT 1
        """, [schema_name]).fetchone()
        
        if result:
            return json.loads(result[0]) if isinstance(result[0], str) else result[0]
        return None
    finally:
        conn.close()

def apply_mapping_rules(data: List[Dict[str, Any]], rules: Dict[str, str]) -> List[Dict[str, Any]]:
    # Simple rename
    new_data = []
    for item in data:
        new_item = item.copy()
        for source, target in rules.items():
            if source in new_item:
                new_item[target] = new_item.pop(source)
        new_data.append(new_item)
    return new_data
