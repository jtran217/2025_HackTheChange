import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from databricks import sql
from dotenv import load_dotenv
from scripts.queries import EMISSIONS_QUERY

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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