export interface ProtocolSummary {
  id: string;
  name: string;
  description?: string | string[];
}

export interface ProtocolDetail extends ProtocolSummary {
  citations: string[];
}
