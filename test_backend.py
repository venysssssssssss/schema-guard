import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing API...")
    
    # 1. Register Schema
    schema = {
        "name": "test_schema",
        "description": "Test Schema",
        "json_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"}
            },
            "required": ["id", "name"]
        }
    }
    try:
        res = requests.post(f"{BASE_URL}/schemas", json=schema)
        if res.status_code == 200:
            print("✓ Register Schema: Success")
        else:
            print(f"✗ Register Schema: Failed ({res.status_code})")
            print(res.text)
    except Exception as e:
        print(f"✗ Register Schema: Error ({e})")
        return

    # 2. List Schemas
    try:
        res = requests.get(f"{BASE_URL}/schemas")
        if res.status_code == 200 and len(res.json()) > 0:
            print("✓ List Schemas: Success")
        else:
            print("✗ List Schemas: Failed or Empty")
    except:
        print("✗ List Schemas: Error")

    # 3. Validate Valid Data
    valid_data = {"schema_name": "test_schema", "data": [{"id": 1, "name": "Test"}]}
    try:
        res = requests.post(f"{BASE_URL}/validate", json=valid_data)
        if res.status_code == 200 and res.json()["valid"]:
            print("✓ Validate Valid Data: Success")
        else:
            print("✗ Validate Valid Data: Failed")
            print(res.json())
    except:
        print("✗ Validate Valid Data: Error")

    # 4. Validate Invalid Data
    invalid_data = {"schema_name": "test_schema", "data": [{"id": "wrong", "name": "Test"}]}
    try:
        res = requests.post(f"{BASE_URL}/validate", json=invalid_data)
        if res.status_code == 200 and not res.json()["valid"]:
            print("✓ Validate Invalid Data: Success (Correctly Invalid)")
        else:
            print("✗ Validate Invalid Data: Failed (Should be invalid)")
    except:
        print("✗ Validate Invalid Data: Error")

if __name__ == "__main__":
    test_api()
