// Action to send a message to the patient
export interface ActionNode {
  id: string;
  type: 'MESSAGE';
  message: string;
  next_node_id: string | null;
}

// A delay node to wait for a specific duration
export interface DelayNode {
  id: string;
  type: 'DELAY';
  duration_seconds: number;
  next_node_id: string | null;
}

// Conditional node to branch the journey based on patient data
export interface ConditionalNode {
  id: string;
  type: 'CONDITIONAL';
  condition: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
    value: any;
  };
  on_true_next_node_id: string | null;
  on_false_next_node_id: string | null;
}

export type JourneyNode = ActionNode | DelayNode | ConditionalNode;

export interface Journey {
  id: string;
  name: string;
  start_node_id: string;
  nodes: JourneyNode[];
}

export interface PatientContext {
  id: string;
  age: number;
  language: 'en' | 'es';
  condition: 'liver_replacement' | 'knee_replacement';
  [key: string]: any; // Allow additional dynamic fields for condition checking
}

export interface JourneyRun {
  id: string;
  journey_id: string;
  patient_context: PatientContext;
  status: 'in_progress' | 'completed' | 'failed';
  current_node_id: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface JourneyRunState {
  runId: string;
  journeyId: string;
  patientContext: PatientContext;
  status: 'in_progress' | 'completed' | 'failed';
  currentNodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}