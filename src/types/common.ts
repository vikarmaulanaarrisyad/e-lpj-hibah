/**
 * Standardized Response Type for Action and Service Layers
 * Adheres to AI_CONTEXT.md: { success: boolean; message: string; data?: T }
 */
export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export type ServiceResponse<T = unknown> = ActionResponse<T>;
