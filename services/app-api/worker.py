import asyncio
import os
import structlog
from redis.asyncio import Redis

log = structlog.get_logger()


async def reconcile() -> None:
    redis = Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    while True:
        async with redis.lock("jobs:usage-reconciliation", timeout=55, blocking_timeout=1):
            log.info("usage_reconciliation_tick")
            # Fetch LiteLLM spend logs and debit the immutable wallet ledger by litellm_request_id.
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(reconcile())
