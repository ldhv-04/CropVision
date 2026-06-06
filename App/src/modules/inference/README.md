# Inference Module

## Ownership

The inference module is the shared implementation for Agrivision user-side image analysis. Agrivision owns the active user workflows:

- `App/app/(agrivision)/inference.js` renders the reusable analysis layout with optional field context.
- `App/app/(agrivision)/diagnosis-result.js` renders the mobile diagnosis result flow after a camera or gallery selection.
- `App/src/modules/agrivision/components/CameraModal.js` selects the image and routes to the diagnosis result screen.

Station/Admin should consume saved scan history, aggregate disease statistics, alerts, and map overlays through admin/reporting APIs. Station/Admin should not directly run user-side image inference from Station navigation.

## Active Contract

Frontend inference calls `POST /api/analyze` through `ENDPOINTS.inference.analyze`.

Backend `backend/src/routes/inferenceRoutes.js` mounts the contract under `/api` and forwards one request to AI Core `POST /predict`. The backend response shape is preserved for existing callers:

- `boxes`
- `image_base64`
- `image_width`
- `image_height`
- `image_name`
- `sample_id`

## Cleanup Notes

Old `(main)` and GridShell inference routes are compatibility surfaces until route ownership is reconciled in the product-architecture plan. Do not delete them based only on static import searches because Expo Router and web shell navigation may still reach them.

## Timing and Benchmark Notes

Use the `[InferenceTiming]` logs to separate core inference time from UI and enrichment time.

Client development builds log:

- `client-runInference.imagePrepMs` - FormData/blob preparation.
- `client-runInference.contextMs` - field coordinate normalization or GPS lookup.
- `client-runInference.uploadMs` - `POST /api/analyze` request duration.
- `client-runInference.totalMs` - total store action time.
- `disease-detail-fetch.totalMs` - separate post-inference disease detail lookup in `diagnosis-result`.

Backend and AI Core timing logs are opt-in:

```bash
INFERENCE_TIMING_LOGS=1 npm run dev
INFERENCE_TIMING_LOGS=1 python main.py
```

Backend logs `backend-analyze` with request receive time, AI Core forwarding, upload persistence, DB save, and total route time. AI Core logs `ai-core-predict` with file read, decode, model predict, encode, postprocess, and total route time.

### Manual Agrivision Benchmark Checklist

Run this on a device or Expo web session with backend and AI Core timing enabled:

1. Gallery image flow: open `/(agrivision)/inference`, pick a small real crop image, run inference, and record `client-runInference`, `backend-analyze`, `ai-core-predict`, and `disease-detail-fetch`.
2. Gallery image flow: repeat with a normal camera image.
3. Gallery image flow: repeat with a large/high-resolution image under the 10 MB backend limit.
4. Camera modal flow: open `CameraModal`, capture a new image, navigate to `/(agrivision)/diagnosis-result`, let auto-run execute once, and record the same logs.
5. Confirm whether `client-runInference` appears more than once per selected image.
6. Confirm whether the diagnosis screen shows the core detection result before `disease-detail-fetch` completes.

Use this table when collecting device logs:

| Flow | Image Type | imagePrepMs | uploadMs | backendMs | aiCoreMs | diseaseFetchMs | totalMs | Duplicate Call? | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Gallery | Small crop image |  |  |  |  |  |  |  |  |
| Gallery | Normal camera image |  |  |  |  |  |  |  |  |
| Gallery | Large camera image |  |  |  |  |  |  |  |  |
| Camera modal | Normal captured image |  |  |  |  |  |  |  |  |

### Local Service Baseline

Latest service-level benchmark used a real crop photo from Wikimedia Commons (`Tomato_leaf.jpg`) and generated in-memory small, normal, and high-resolution JPEG variants. This measures the shared upload/backend/AI path, not Expo route transition or physical camera capture time.

Environment:

- Backend: temporary local service on port 3011 with `INFERENCE_TIMING_LOGS=1`.
- AI Core: temporary local service on port 8011 with `INFERENCE_TIMING_LOGS=1`.
- Source image: 2144 x 2143, 1,708,931 bytes.
- Warmup: one small AI Core request excluded from results.

| Flow | Image Type | imagePrepMs | payloadBytes | backendMs | aiCoreMs | diseaseFetchMs | totalMs | Duplicate Call? | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Local API baseline | Small crop photo, 640 x 640 | 47 | 73,654 | 168 | 141 | 16 | 187 | No in API harness | AI direct round trip 156 ms; 0 boxes |
| Local API baseline | Normal crop photo, 2144 x 2143 | 39 | 855,075 | 254 | 234 | 16 | 289 | No in API harness | AI direct round trip 243 ms; 0 boxes |
| Local API baseline | Large crop photo, 4096 x 4096 | 412 | 4,831,838 | 626 | 560 | 16 | 668 | No in API harness | AI direct round trip 724 ms; 0 boxes |

Observed bottleneck:

| Bottleneck | Evidence | Severity | Safe Fix Candidate | Risk |
|---|---|---|---|---|
| Large image size and pixel dimensions | Large variant increased image prep to 412 ms, backend total to 626 ms, and AI Core total to 560 ms. Backend persistence and DB save stayed below 10 ms. | Medium | Add measured client-side resize/compression before upload after device logs confirm the same pattern. | Model accuracy can degrade if resized too aggressively. |
| AI Core decode/predict dominates backend time | Backend `aiCoreMs` accounted for most backend total in every row. | Medium | Keep backend path unchanged; optimize image payload before forwarding or benchmark model settings separately. | Model tuning may change detection behavior. |
| Disease detail enrichment | Disease class detail fetch was 16 ms and the diagnosis screen renders the top detection before details finish. | Low | No immediate optimization; consider metadata cache only if device logs show repeated slow fetches. | Cache staleness. |

Optimization decision:

- Do not implement compression/resizing yet from service data alone; physical gallery/camera logs should confirm real device payload sizes and model-quality tolerance.
- Do not optimize disease-detail fetch yet; measured fetch time is low and it does not block the core diagnosis result.
- Do not add a duplicate-call guard until a device or React dev-session log shows repeated `client-runInference` for one selected image.
