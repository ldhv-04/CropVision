/**
 * Inference public module API.
 * External consumers (routes, application composition) import only this entry.
 */
export { default as DiagnosisResultScreen } from './screens/DiagnosisResultScreen';
export { InferenceLayout } from './components/InferenceLayout';
export { markLatestInferenceDebugEvent } from './debug/inferenceDebug';
