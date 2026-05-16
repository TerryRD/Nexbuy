// Lazy-init wrapper around MediaPipe Tasks Vision FaceLandmarker.
// Singleton: model is downloaded once per page load, reused for all detections.

import {
  FilesetResolver,
  FaceLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

async function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

/**
 * Detect face landmarks in a single still image. Returns 478 normalized
 * landmarks or [] if no face was found.
 */
export async function detectFace(
  image: ImageBitmap | HTMLImageElement,
): Promise<NormalizedLandmark[]> {
  const lm = await getLandmarker();
  const result = lm.detect(image);
  return result.faceLandmarks[0] ?? [];
}

/**
 * Probe whether the browser supports MediaPipe (WASM + the import). Use to
 * gracefully degrade on unsupported browsers.
 */
export function isMediaPipeSupported(): boolean {
  return typeof WebAssembly !== "undefined";
}
