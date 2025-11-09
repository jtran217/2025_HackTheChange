import requests
import os

DATABRICKS_INSTANCE = os.getenv("DATABRICKS_INSTANCE")  
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")  
JOB_ID = "756288723815662"  

def trigger_forecast(user_id: str):
    url = f"{DATABRICKS_INSTANCE}/api/2.2/jobs/run-now"
    print(url)
    headers = {"Authorization": f"Bearer {DATABRICKS_TOKEN}"}
    payload = {
        "job_id": JOB_ID,
        "notebook_params": {
            "user_id": user_id
        }
    }
    # Might not be needed tbh
    resp = requests.post(url, headers=headers, json=payload)
