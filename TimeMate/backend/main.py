

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address




# FastAPI-Instanz
app = FastAPI(
    title="TimeMate Backend",
    version="0.1.0",
    description="API für Produkt-Scan, Inventory und Medien-Upload"
)



# Health Check
@app.get("/")
def health_check():
    return {"status": "ok"}
