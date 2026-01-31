import logging
import time

import requests

from .constants import BACKEND_HOST, USE_HTTPS
from .schemas import ActionLog, AssetFile

logger = logging.getLogger(__name__)


class BackendService:
    BASE_URL = f"http{'s' if USE_HTTPS else ''}://{BACKEND_HOST}"

    def __init__(self, timeout: int = 10, max_retries: int = 3, backoff: float = 0.5):
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff = backoff

    def _request_with_retries(self, method: str, url: str, **kwargs) -> requests.Response:
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.request(method, url, timeout=self.timeout, **kwargs)
                resp.raise_for_status()
                return resp
            except requests.RequestException as exc:
                logger.debug("[BackendService] Request attempt %d failed for %s %s: %s", attempt, method, url, exc)
                if attempt < self.max_retries:
                    time.sleep(self.backoff * attempt)

        logger.exception("[BackendService] All request attempts failed for %s %s", method, url)
        return None

    # ---- Action log calls ----
    def create_action_log(self, payload: ActionLog):
        url = f"{self.BASE_URL}/api/v1/action-logs"
        logger.debug("[BackendService] Creating action log: %s", payload)
        resp = self._request_with_retries("POST", url, json=payload.model_dump())
        logger.info("[BackendService] Action log created status=%s", resp.status_code)
        return resp

    # ---- Asset file calls ----
    def create_asset_file(self, asset_file: AssetFile):
        payload = {
            "agent_id": asset_file.agent_id,
            "camera_id": asset_file.camera_id,
            "location": asset_file.location,
            "timestamp": asset_file.timestamp,
            "unique_id": asset_file.unique_id,
            "file_name": asset_file.file_name,
            "file_size": asset_file.file_size,
        }

        url = f"{self.BASE_URL}/api/v1/asset-files"
        logger.debug("[BackendService] Sending image-file create payload to %s: %s", url, payload)
        resp = self._request_with_retries("POST", url, json=payload)

        if resp is None:
            return None

        logger.info(
            "[BackendService] Image file created (unique_id=%s) status=%s", asset_file.unique_id, resp.status_code
        )
        return resp

    def update_asset_file(self, asset_file: AssetFile):
        if asset_file.id is None:
            logger.error("[BackendService] asset_file.id is required for update")
            return None

        payload = {"file_size": asset_file.file_size}

        url = f"{self.BASE_URL}/api/v1/asset-files/{asset_file.id}"
        logger.debug("[BackendService] Updating image-file %s with payload %s", asset_file.id, payload)

        resp = self._request_with_retries("PATCH", url, json=payload)
        logger.info("[BackendService] Image file updated (id=%s) status=%s", asset_file.id, resp.status_code)
        return resp
