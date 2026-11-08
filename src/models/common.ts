/** Money in minor currency units (EUR cents). */
export interface Money {
  amount: number;
  currency: string;
}

export interface SelectionAttribute {
  type: 'number' | 'string';
  value: number | string;
  name: string;
}

/** Legacy error shape: {"exception": "...", "code": "..."}. */
export interface LegacyError {
  exception: string;
  code?: string;
}

/** RFC 9110 ValidationProblemDetails (400 from model binding). */
export interface ValidationProblemDetails {
  status: number;
  title?: string;
  traceId?: string;
  errors: Record<string, string[]>;
}
