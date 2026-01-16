import pandas as pd
import random
from datetime import datetime, timedelta

def generate_cnpj():
    return f"{random.randint(10,99)}.{random.randint(100,999)}.{random.randint(100,999)}/0001-{random.randint(10,99)}"

def generate_data(rows=20):
    data = []
    for i in range(rows):
        data.append({
            "purchase_id": f"PUR-{2024000+i}",
            "purchase_date": (datetime.now() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
            "supplier_cnpj": generate_cnpj(),
            "supplier_name": f"Fornecedor {i} Ltda",
            "amount": round(random.uniform(1000.0, 500000.0), 2),
            "municipality_code": str(random.randint(10000, 99999)),
            "contract_status": random.choice(["active", "completed", "cancelled"])
        })
    return data

# Canonical Data
df_clean = pd.DataFrame(generate_data(20))
df_clean.to_csv("sample_clean.csv", index=False)
print("Created sample_clean.csv")

# Dirty Data (Renamed columns, some missing fields)
dirty_data = generate_data(20)
df_dirty = pd.DataFrame(dirty_data)
# Rename columns
df_dirty.rename(columns={
    "supplier_name": "nome_fornecedor",
    "amount": "valor_total",
    "purchase_id": "id_compra"
}, inplace=True)
# Change type (amount to string with R$)
df_dirty["valor_total"] = df_dirty["valor_total"].apply(lambda x: f"R$ {x}")
# Drop required field
df_dirty.loc[0:2, "supplier_cnpj"] = None

df_dirty.to_csv("sample_dirty.csv", index=False)
print("Created sample_dirty.csv")
