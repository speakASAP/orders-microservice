import { Injectable } from '@nestjs/common';

export type AuditOutcome = 'success' | 'failure' | 'rejected' | 'skipped';

export interface AuditMetadata {
  operation: string;
  resourceType: string;
  outcome: AuditOutcome;
  resourceId?: string;
  parentResourceId?: string;
  actorId?: string;
  actorEmail?: string;
  source?: string;
  channel?: string;
  previousStatus?: string;
  requestedStatus?: string;
  resultingStatus?: string;
  reasonCode?: string;
  status?: string;
  durationMs?: number;
  generated?: number;
  skipped?: number;
  processed?: number;
}

const AUDIT_FIELD_ORDER: Array<keyof AuditMetadata> = [
  'operation',
  'resourceType',
  'resourceId',
  'parentResourceId',
  'actorId',
  'actorEmail',
  'source',
  'channel',
  'previousStatus',
  'requestedStatus',
  'resultingStatus',
  'reasonCode',
  'status',
  'outcome',
  'durationMs',
  'generated',
  'skipped',
  'processed',
];

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN =
  /\b(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|bearer|jwt|secret|password|credential|tracking(number|url)?)\b/i;
const SENSITIVE_CONTEXT_PATTERN =
  /(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|bearer|jwt|secret|password|credential|tracking)/i;
const BEARER_VALUE_PATTERN = /bearer\s+[a-z0-9._~+\/-]+=*/gi;
const JWT_VALUE_PATTERN = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
const KEY_VALUE_SECRET_PATTERN =
  /\b(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|jwt|secret|password|credential|trackingNumber|trackingUrl)\b\s*[:=]\s*([^\s,;]+)/gi;
const JSON_SECRET_PATTERN =
  /("(?:customer|email|phone|address|street|postalCode|billingAddress|shippingAddress|paymentMethod|paymentStatus|card|pan|cvv|iban|token|authorization|jwt|secret|password|credential|trackingNumber|trackingUrl)"\s*:\s*)("[^"]*"|\{[^{}]*\}|\[[^\[\]]*\]|[^,}\]]+)/gi;

@Injectable()
export class LoggerService {
  log(message: string, context?: string) {
    console.log(`${new Date().toISOString()} [${this.sanitizeContext(context)}] ${this.redact(message)}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`${new Date().toISOString()} [${this.sanitizeContext(context)}] ERROR: ${this.redact(message)}`);
    if (trace) console.error(this.redact(trace));
  }

  warn(message: string, context?: string) {
    console.warn(`${new Date().toISOString()} [${this.sanitizeContext(context)}] WARN: ${this.redact(message)}`);
  }

  audit(metadata: AuditMetadata, context = 'Audit') {
    const payload: Record<string, string | number> = {};
    for (const field of AUDIT_FIELD_ORDER) {
      const value = metadata[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        payload[field] = Math.max(0, Math.round(value));
      } else if (typeof value === 'string') {
        const sanitized = this.sanitizeAuditValue(value);
        if (sanitized) payload[field] = sanitized;
      }
    }

    console.log(`${new Date().toISOString()} [${this.sanitizeContext(context)}] AUDIT ${JSON.stringify(payload)}`);
  }

  private sanitizeAuditValue(value: string): string | undefined {
    const sanitized = value.trim();
    BEARER_VALUE_PATTERN.lastIndex = 0;
    JWT_VALUE_PATTERN.lastIndex = 0;
    KEY_VALUE_SECRET_PATTERN.lastIndex = 0;
    JSON_SECRET_PATTERN.lastIndex = 0;
    if (
      !sanitized ||
      sanitized.length > 200 ||
      /[\r\n\t]/.test(sanitized) ||
      BEARER_VALUE_PATTERN.test(sanitized) ||
      JWT_VALUE_PATTERN.test(sanitized) ||
      KEY_VALUE_SECRET_PATTERN.test(sanitized) ||
      JSON_SECRET_PATTERN.test(sanitized)
    ) {
      return undefined;
    }
    return sanitized;
  }

  private sanitizeContext(context?: string): string {
    const sanitized = context?.trim();
    if (!sanitized || sanitized.length > 80 || /[\r\n\t]/.test(sanitized) || SENSITIVE_CONTEXT_PATTERN.test(sanitized)) {
      return 'App';
    }
    return sanitized;
  }

  private redact(message: string): string {
    return String(message || '')
      .replace(BEARER_VALUE_PATTERN, `Bearer ${REDACTED}`)
      .replace(JWT_VALUE_PATTERN, REDACTED)
      .replace(JSON_SECRET_PATTERN, `$1"${REDACTED}"`)
      .replace(KEY_VALUE_SECRET_PATTERN, (_match, key) => `${key}=${REDACTED}`);
  }
}
