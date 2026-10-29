import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.v1.router import api_router
from app.security.rate_limit import limiter
from app.config import get_settings
from app.database import AsyncSessionLocal, Base, engine
import app.models  # noqa: F401
from app.security.tokens import decode_access_token
from app.websocket.handler import handle_websocket
from app.websocket.ticket import ticket_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables on startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not auto-create tables on startup (using external migrations): {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Private Chat API",
    version="1.0.0",
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS configuration
# Using allow_origin_regex allows any http/https origin while correctly setting the
# explicit requesting origin in the response header alongside credentials (allow_credentials=True).
# This strictly complies with browser CORS rules (which forbid Access-Control-Allow-Origin: * with credentials: true).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in settings.origins_list if o != "*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket: str | None = Query(default=None),
    token: str | None = Query(default=None),
):
    """
    WebSocket endpoint.
    Supports secure single-use ticket authentication (preferred to avoid token leakage in URL/logs),
    in-band initial auth message, or token query param for dev/tests.
    """
    origin = websocket.headers.get("origin", "")
    if settings.environment == "production" and origin and settings.origins_list != ["*"]:
        is_allowed = (
            origin in settings.origins_list
            or ".onrender.com" in origin
            or ".vercel.app" in origin
        )
        if not is_allowed:
            await websocket.close(code=4003)
            return

    user_id = None
    device_id = ""

    # 1. Single-use short-lived ticket
    if ticket:
        consumed = ticket_store.consume_ticket(ticket)
        if consumed:
            user_id, device_id = consumed

    # 2. Token param fallback (dev / test)
    if not user_id and token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            device_id = payload.get("device_id", "")
        except ValueError:
            pass

    # 3. In-band authentication handshake if not authenticated by query
    if not user_id:
        await websocket.accept()
        try:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("type") == "auth":
                payload = data.get("payload", {})
                handshake_ticket = payload.get("ticket")
                handshake_token = payload.get("token")
                if handshake_ticket:
                    consumed = ticket_store.consume_ticket(handshake_ticket)
                    if consumed:
                        user_id, device_id = consumed
                elif handshake_token:
                    t_payload = decode_access_token(handshake_token)
                    user_id = t_payload.get("sub")
                    device_id = t_payload.get("device_id", "")
            if not user_id:
                await websocket.send_text(json.dumps({"type": "error", "payload": {"message": "Authentication failed"}}))
                await websocket.close(code=4001)
                return
            await websocket.send_text(json.dumps({"type": "auth.success", "payload": {}}))
        except Exception:
            await websocket.close(code=4001)
            return

    async with AsyncSessionLocal() as db:
        try:
            await handle_websocket(websocket, user_id, device_id, db)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"WebSocket session error: {e}")


# Locate frontend/dist if built (enables all-in-one deployment on Render)
_possible_dist_dirs = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend/dist")),
    os.path.abspath(os.path.join(os.getcwd(), "../frontend/dist")),
]

FRONTEND_DIST = next((d for d in _possible_dist_dirs if os.path.exists(d)), None)

if FRONTEND_DIST:
    logger.info(f"Serving built React frontend from: {FRONTEND_DIST}")
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept API or WS routes
        if full_path.startswith("api/") or full_path == "ws":
            return {"detail": "Not Found"}
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
