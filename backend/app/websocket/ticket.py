import time
import secrets
from typing import NamedTuple


class TicketData(NamedTuple):
    user_id: str
    device_id: str
    expires_at: float


class WebSocketTicketStore:
    """
    In-memory / Redis-capable store for short-lived, single-use WebSocket tickets.
    Prevents token leakage into URLs, proxy logs, and browser history.
    """
    def __init__(self, ttl_seconds: int = 45):
        self._tickets: dict[str, TicketData] = {}
        self.ttl = ttl_seconds

    def issue_ticket(self, user_id: str, device_id: str = "") -> str:
        # Clean expired
        now = time.time()
        self._cleanup(now)

        ticket = secrets.token_urlsafe(32)
        self._tickets[ticket] = TicketData(
            user_id=user_id,
            device_id=device_id,
            expires_at=now + self.ttl,
        )
        return ticket

    def consume_ticket(self, ticket: str) -> tuple[str, str] | None:
        """
        Validates and immediately consumes (invalidates) the ticket.
        Returns (user_id, device_id) or None if invalid/expired.
        """
        now = time.time()
        data = self._tickets.pop(ticket, None)
        if not data:
            return None
        if data.expires_at < now:
            return None
        return data.user_id, data.device_id

    def _cleanup(self, now: float) -> None:
        expired = [k for k, v in self._tickets.items() if v.expires_at < now]
        for k in expired:
            self._tickets.pop(k, None)


ticket_store = WebSocketTicketStore(ttl_seconds=45)
