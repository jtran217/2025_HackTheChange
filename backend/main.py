import os
from datetime import date as date_type
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from databricks import sql
from dotenv import load_dotenv
from utility.databrick import trigger_forecast
from scripts.queries import EMISSIONS_QUERY, HABITS_QUERY

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CarbonLogPayload(BaseModel):
    user_id: str
    transport_weight: float
    energy_weight: float
    diet_weight: float
    recycling_modifier: float
    offset_modifier: float
    total_emission_kgco2: float
    date: Optional[date_type] = None

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, value):
        if value in (None, "", "null"):
            return None
        if isinstance(value, date_type):
            return value
        return date_type.fromisoformat(value)


def get_connection():
    return sql.connect(
        server_hostname=os.getenv("DATABRICKS_SERVER_HOSTNAME"),
        http_path=os.getenv("DATABRICKS_HTTP_PATH"),
        access_token=os.getenv("DATABRICKS_TOKEN"),
    )

@app.get("/")
def health():
    return {"message": "FastAPI backend ready"}

@app.get("/countryEmissions")
def emissions():
    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(EMISSIONS_QUERY)
            columns = [c[0] for c in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)

@app.post("/carbonLogs")
def create_carbon_log(payload: CarbonLogPayload):
    log_date = payload.date or date_type.today()
    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                HABITS_QUERY,
                (
                    payload.user_id,
                    log_date,
                    payload.transport_weight,
                    payload.energy_weight,
                    payload.diet_weight,
                    payload.recycling_modifier,
                    payload.offset_modifier,
                    payload.total_emission_kgco2,
                ),
            )
        trigger_forecast(payload.user_id)
        return {"status": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))