import axios from 'axios';

// 1. Establish the base connection to the FastAPI server
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// 2. Strict Type-Matching (Phase 1: Binary Pump Classification)
export interface PumpInferenceResponse {
  filename: string;
  status: string;
  analysis: {
    prediction: "healthy" | "anomaly";
    anomaly_probability: number;
    confidence: number;
  };
}

// 3. Strict Type-Matching (Phase 2: Multi-Class Tool Wear)
export interface ToolWearInferenceResponse {
  filename: string;
  status: string;
  analysis: {
    prediction: "BASE" | "FRESH" | "MODERATE" | "BROKEN";
    confidence: number;
    tool_health_score_percent: number;
    is_about_to_break: boolean;
    all_probabilities: {
      BASE: number;
      FRESH: number;
      MODERATE: number;
      BROKEN: number;
    };
  };
}

// 4. The API Methods
export const inferenceService = {
  /**
   * Uploads an audio file to evaluate a pump for acoustic anomalies.
   */
  analyzePump: async (audioFile: File): Promise<PumpInferenceResponse> => {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const response = await apiClient.post<PumpInferenceResponse>('/inference/analyze', formData);
    return response.data;
  },

  /**
   * Uploads an audio file to evaluate a CNC cutter for physical tool wear.
   */
  analyzeToolWear: async (audioFile: File): Promise<ToolWearInferenceResponse> => {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const response = await apiClient.post<ToolWearInferenceResponse>('/inference/analyze-tool', formData);
    return response.data;
  }
};