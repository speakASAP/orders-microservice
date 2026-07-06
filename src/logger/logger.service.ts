import { Injectable } from '@nestjs/common';

export type AuditOutcome = 'success' | 'failure' | 'rejected' | 'skipped';
type LogLevel = 'info' | 'warn' | 'error' | 'audit';

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
  correlationId?: string;
  correlation_id?: string;
  durationMs?: number;
  duration_ms?: number;
  generated?: number;
  skipped?: number;
  processed?: number;
  [key: string]: unknown;
}

type LogMetadata = Record<string, unknown>;

interface CentralLogPayload {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;
  duration_ms?: number;
  correlation_id?: string;
  metadata?: Record<string, unknown>;
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
  'correlationId',
  'correlation_id',
  'durationMs',
  'duration_ms',
  'generated',
  'skipped',
  'processed',
];

const REDACTED = '[REDACTED]';
const MAX_METADATA_DEPTH = 4;
const MAX_METADATA_KEYS = 50;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 500;
const SENSITIVE_KEY_PATTERN =
  /\b(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|bearer|jwt|secret|password|credential|tracking(number|url)?)\b/i;
const SENSITIVE_CONTEXT_PATTERN =
  /(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|bearer|jwt|secret|password|credential|tracking)/i;
const BEARER_VALUE_PATTERN = /bearer\s+[a-z0-9._~+\/-]+=*/gi;
const JWT_VALUE_PATTERN = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
const EMAIL_VALUE_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const KEY_VALUE_SECRET_PATTERN =
  /\b(customer|email|phone|address|street|postal|billing|shipping|payment|card|pan|cvv|iban|token|authorization|jwt|secret|password|credential|trackingNumber|trackingUrl)\b\s*[:=]\s*([^\s,;]+)/gi;
const JSON_SECRET_PATTERN =
  /("(?:customer|email|phone|address|street|postalCode|billingAddress|shippingAddress|paymentMethod|paymentStatus|card|pan|cvv|iban|token|authorization|jwt|secret|password|credential|trackingNumber|trackingUrl)"\s*:\s*)("[^"]*"|\{[^{}]*\}|\[[^\[\]]*\]|[^,}\]]+)/gi;

@Injectable()
export class LoggerService {
  log(message: string, context?: string, metadata?: LogMetadata) {
    this.write('info', message, context, metadata);
  }

  error(message: string, trace?: string, context?: string, metadata?: LogMetadata) {
    this.write('error', message, context, metadata);
    if (trace) console.error(this.redact(trace));
  }

  warn(message: string, context?: string, metadata?: LogMetadata) {
    this.write('warn', message, context, metadata);
  }

  audit(metadata: AuditMetadata, context = 'Audit') {
    const payload: Record<string, string | number> = {};
    for (const field of AUDIT_FIELD_ORDER) {
      const value = metadata[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        payload[field] = Math.max(0, Math.round(value));
      } else if (typeof value === 'string') {
        const sanitized = this.sanitizeAuditValue(value, String(field));
        if (sanitized) payload[field] = sanitized;
      }
    }

    const auditMessage = `AUDIT ${JSON.stringify(payload)}`;
    console.log(`${new Date().toISOString()} [${this.sanitizeContext(context)}] ${auditMessage}`);
    this.sendCentralLog('audit', auditMessage, metadata);
  }

  private write(level: LogLevel, message: string, context?: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = this.sanitizeContext(context);
    const sanitizedMessage = this.redact(message);
    const prefix = `${timestamp} [${sanitizedContext}]`;

    if (level === 'error') {
      console.error(`${prefix} ERROR: ${sanitizedMessage}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} WARN: ${sanitizedMessage}`);
    } else {
      console.log(`${prefix} ${sanitizedMessage}`);
    }

    this.sendCentralLog(level, sanitizedMessage, metadata, timestamp);
  }

  private sendCentralLog(level: LogLevel, message: string, metadata?: LogMetadata, timestamp = new Date().toISOString()) {
    const endpoint = this.resolveLoggingEndpoint();
    if (!endpoint || typeof fetch !== 'function') return;

    const payload = this.buildCentralPayload(level, message, metadata, timestamp);
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }

  private resolveLoggingEndpoint(): string | undefined {
    const baseUrl = process.env.LOGGING_SERVICE_URL?.trim();
    if (!baseUrl) return undefined;

    const apiPath = process.env.LOGGING_SERVICE_API_PATH?.trim() || '/api/logs';
    return `${baseUrl.replace(/\/+$/, '')}/${apiPath.replace(/^\/+/, '')}`;
  }

  private buildCentralPayload(
    level: LogLevel,
    message: string,
    metadata: LogMetadata | undefined,
    timestamp: string,
  ): CentralLogPayload {
    const sanitizedMetadata = this.sanitizeMetadata(metadata);
    const payload: CentralLogPayload = {
      level,
      message: this.redact(message),
      service: this.sanitizeServiceName(process.env.SERVICE_NAME) || 'orders-microservice',
      timestamp,
    };

    const durationMs = this.extractDurationMs(metadata);
    if (durationMs !== undefined) payload.duration_ms = durationMs;

    const correlationId = this.extractCorrelationId(metadata);
    if (correlationId) payload.correlation_id = correlationId;

    if (sanitizedMetadata && Object.keys(sanitizedMetadata).length > 0) {
      payload.metadata = sanitizedMetadata;
    }

    return payload;
  }

  private sanitizeMetadata(metadata?: LogMetadata): Record<string, unknown> | undefined {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
    const sanitized = this.sanitizeMetadataValue(metadata, '', 0);
    return sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)
      ? (sanitized as Record<string, unknown>)
      : undefined;
  }

  private sanitizeMetadataValue(value: unknown, key: string, depth: number): unknown {
    if (SENSITIVE_KEY_PATTERN.test(key)) return REDACTED;
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return this.redact(value).slice(0, MAX_STRING_LENGTH);
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString();
    if (depth >= MAX_METADATA_DEPTH) return '[TRUNCATED]';

    if (Array.isArray(value)) {
      return value.slice(0, MAX_ARRAY_ITEMS).map((entry) => this.sanitizeMetadataValue(entry, key, depth + 1));
    }

    if (typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [entryKey, entryValue] of Object.entries(value).slice(0, MAX_METADATA_KEYS)) {
        const sanitizedValue = this.sanitizeMetadataValue(entryValue, entryKey, depth + 1);
        if (sanitizedValue !== undefined) output[entryKey] = sanitizedValue;
      }
      return output;
    }

    return String(value).slice(0, MAX_STRING_LENGTH);
  }

  private extractDurationMs(metadata?: LogMetadata): number | undefined {
    const raw = metadata?.durationMs ?? metadata?.duration_ms;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
    return Math.max(0, Math.round(raw));
  }

  private extractCorrelationId(metadata?: LogMetadata): string | undefined {
    const raw = metadata?.correlation_id ?? metadata?.correlationId;
    if (typeof raw !== 'string') return undefined;
    return this.sanitizeAuditValue(raw, 'correlation_id');
  }

  private sanitizeAuditValue(value: string, field?: string): string | undefined {
    const sanitized = this.redact(value.trim());
    BEARER_VALUE_PATTERN.lastIndex = 0;
    JWT_VALUE_PATTERN.lastIndex = 0;
    KEY_VALUE_SECRET_PATTERN.lastIndex = 0;
    JSON_SECRET_PATTERN.lastIndex = 0;
    if (
      !sanitized ||
      sanitized.length > 200 ||
      /[\r\n\t]/.test(sanitized) ||
      (field && SENSITIVE_KEY_PATTERN.test(field)) ||
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

  private sanitizeServiceName(serviceName?: string): string | undefined {
    const sanitized = serviceName?.trim();
    if (!sanitized || sanitized.length > 80 || /[\r\n\t]/.test(sanitized)) return undefined;
    return this.redact(sanitized);
  }

  private redact(message: string): string {
    return String(message || '')
      .replace(BEARER_VALUE_PATTERN, `Bearer ${REDACTED}`)
      .replace(JWT_VALUE_PATTERN, REDACTED)
      .replace(EMAIL_VALUE_PATTERN, REDACTED)
      .replace(JSON_SECRET_PATTERN, `$1"${REDACTED}"`)
      .replace(KEY_VALUE_SECRET_PATTERN, (_match, key) => `${key}=${REDACTED}`);
  }
}
