import uuid
import json
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections.
    Maps user_id -> set of WebSocket connections.
    """
    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = set()
        self._connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self._connections:
            self._connections[user_id].discard(websocket)
            if not self._connections[user_id]:
                del self._connections[user_id]

    def is_online(self, user_id: str) -> bool:
        return bool(self._connections.get(user_id))

    async def send_to_user(self, user_id: str, event: str, payload: dict) -> None:
        connections = self._connections.get(user_id, set()).copy()
        message = json.dumps({"type": event, "payload": payload})
        dead = set()
        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections.get(user_id, set()).discard(ws)

    async def broadcast_to_users(self, user_ids: list[str], event: str, payload: dict) -> None:
        tasks = [self.send_to_user(uid, event, payload) for uid in user_ids]
        await asyncio.gather(*tasks, return_exceptions=True)


manager = ConnectionManager()
