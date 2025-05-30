from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, StreamingResponse
import httpx

app = FastAPI()

ollama_url = "http://openwebui.bison-python.ts.net:11434/"

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[tuple[int, WebSocket]] = []

    async def connect(self, websocket: WebSocket, client_id: int):
        await websocket.accept()
        self.active_connections.append((client_id, websocket))

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            (client_id, conn)
            for client_id, conn in self.active_connections
            if conn != websocket
        ]

    async def send_message(self, client_id: int, message: str):
        for cid, websocket in self.active_connections:
            if cid == client_id:
                await websocket.send_text(message)
                break


manager = ConnectionManager()


@app.websocket("/api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_message(client_id, f"You wrote: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left the chat")


@app.post("/api/ai")
async def openai_proxy(request: dict):
    async def stream_response():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", "http://openwebui.bison-pyto", json=request
            ) as response:
                async for chunk in response.aiter_text():
                    yield chunk

    return StreamingResponse(stream_response(), media_type="application/json")
