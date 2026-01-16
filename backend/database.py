import duckdb
import json
import os

DB_PATH = "schemas.duckdb"

def get_connection():
    conn = duckdb.connect(DB_PATH)
    return conn

def init_db():
    conn = get_connection()
    # Create tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schemas (
            name VARCHAR PRIMARY KEY,
            description VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_versions (
            schema_name VARCHAR,
            version INTEGER,
            json_schema JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (schema_name, version),
            FOREIGN KEY (schema_name) REFERENCES schemas(name)
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS mappings (
            id INTEGER PRIMARY KEY,
            schema_name VARCHAR,
            mapping_rules JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schema_name) REFERENCES schemas(name)
        )
    """)
    
    # Create sequence for mappings id if not exists (DuckDB auto-increments differently, but let's use a sequence)
    conn.execute("CREATE SEQUENCE IF NOT EXISTS mapping_id_seq START 1")
    
    conn.close()

# Initialize on import (or call explicitly)
if __name__ == "__main__":
    init_db()
