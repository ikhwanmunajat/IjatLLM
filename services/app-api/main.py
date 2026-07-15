from __future__ import annotations

import hashlib
import hmac
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
import structlog
from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field
from redis.asyncio import Redis

log = structlog.get_logger()
redis = Redis.from_url(os.environ.get("REDIS_URL", "redis://redis:6379/0"), decode_responses=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await redis.ping()
    yield
    await redis.aclose()


app = FastAPI(title="IjatLLM Application API", version="0.1.0", lifespan=lifespan)


class KeyRequest(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    models: list[str] = Field(default_factory=lambda: ["smart-fast"])
    max_budget: float = Field(default=100_000, gt=0)
    rpm_limit: int = Field(default=60, ge=1, le=100_000)
    tpm_limit: int = Field(default=100_000, ge=1)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "app-api", "time": datetime.now(timezone.utc).isoformat()}


@app.post("/v1/keys")
async def create_virtual_key(payload: KeyRequest):
    base = os.environ["LITELLM_BASE_URL"].rstrip("/")
    master = os.environ["LITELLM_MASTER_KEY"]
    request_body = {
        "key_alias": payload.name,
        "models": payload.models,
        "max_budget": payload.max_budget,
        "rpm_limit": payload.rpm_limit,
        "tpm_limit": payload.tpm_limit,
        "metadata": {"platform": "ijatllm"},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{base}/key/generate", json=request_body, headers={"Authorization": f"Bearer {master}"})
    if response.is_error:
        log.error("litellm_key_create_failed", status=response.status_code)
        raise HTTPException(status_code=502, detail="Gateway gagal membuat virtual key")
    result = response.json()
    raw_key = result.get("key", "")
    return {"key": raw_key, "prefix": raw_key[:16], "fingerprint": hashlib.sha256(raw_key.encode()).hexdigest()}


@app.post("/webhooks/payment/{provider}")
async def payment_webhook(provider: str, request: Request, x_callback_token: str | None = Header(default=None)):
    raw = await request.body()
    provider = provider.lower()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Payload webhook bukan JSON valid") from exc

    if provider == "midtrans":
        server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
        order_id = str(payload.get("order_id", ""))
        status_code = str(payload.get("status_code", ""))
        gross_amount = str(payload.get("gross_amount", ""))
        received = str(payload.get("signature_key", ""))
        expected = hashlib.sha512(f"{order_id}{status_code}{gross_amount}{server_key}".encode()).hexdigest()
        if not server_key or not received or not hmac.compare_digest(received, expected):
            raise HTTPException(status_code=401, detail="Signature Midtrans tidak valid")
    elif provider == "xendit":
        expected = os.environ.get("XENDIT_CALLBACK_TOKEN", "")
        if not expected or not x_callback_token or not hmac.compare_digest(x_callback_token, expected):
            raise HTTPException(status_code=401, detail="Callback token Xendit tidak valid")
    else:
        raise HTTPException(status_code=404, detail="Provider pembayaran tidak didukung")

    event_id = request.headers.get("x-event-id") or hashlib.sha256(raw).hexdigest()
    if not await redis.set(f"payment-event:{event_id}", "processing", nx=True, ex=86_400):
        return {"status": "duplicate", "event_id": event_id}
    # Production implementation commits PaymentEvent and WalletLedger in one DB transaction.
    await redis.set(f"payment-event:{event_id}", "processed", ex=86_400)
    log.info("payment_event_processed", provider=provider, event_id=event_id)
    return {"status": "processed", "event_id": event_id}
