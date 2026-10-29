from enum import StrEnum


class ClientEvent(StrEnum):
    MESSAGE_SEND = "message.send"
    MESSAGE_READ = "message.read"
    PRESENCE_UPDATE = "presence.update"
    SYNC_REQUEST = "sync.request"
    PING = "ping"
    AUTH = "auth"


class ServerEvent(StrEnum):
    MESSAGE_ACK = "message.ack"
    MESSAGE_NEW = "message.new"
    MESSAGE_DELIVERED = "message.delivered"
    MESSAGE_READ = "message.read"
    PRESENCE_UPDATE = "presence.update"
    SYNC_COMPLETE = "sync.complete"
    ERROR = "error"
    PONG = "pong"
    AUTH_SUCCESS = "auth.success"
