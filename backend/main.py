import os
from typing import Dict, List,Optional, Any
from datetime import date as date_type
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from databricks import sql
from dotenv import load_dotenv
from scripts.queries import EMISSIONS_QUERY, USER_ALL_EMISSIONS, HABITS_QUERY
from utility.databrick import trigger_forecast

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



@app.get("/userEmissions")
def userEmissions(user_id: str = Query(..., description="User ID to filter emissions")) -> List[Dict]:
    try:
        safe_user_id = user_id.replace("'", "''")
        query = f"""
            SELECT *
            FROM clean.user.daily_footprint_projected
            WHERE user_id = '{safe_user_id}'
            AND is_forecast = true
            AND date > current_date()
            AND date <= date_add(current_date(), 5)
        """
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(query)
            columns = [c[0] for c in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

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
        

@app.get("/userEmissions/today")
def today_emission(user_id: str = Query(..., description="Supabase user id")) -> Dict[str, Any]:
    log_date = date_type.today()
    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT total_emission_kgco2
                FROM raw.user.daily_footprint
                WHERE user_id = ? AND date = ?
                LIMIT 1
                """,
                (user_id, log_date),
            )
            row = cursor.fetchone()
        return {
            "date": log_date.isoformat(),
            "total_emission_kgco2": float(row[0]) if row else 0.0,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    
@app.get("/userEmissions/recent")
def recent_emissions(user_id: str = Query(..., description="Supabase user id")) -> List[Dict[str, Any]]:
    try:
        with get_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM clean.user.daily_footprint_projected
                WHERE user_id = ?
                    AND COALESCE(is_forecast, false) = false
                    AND date < current_date()
                ORDER BY date DESC
                LIMIT 5
                """,
                (user_id,),
            )
            columns = [c[0] for c in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)



