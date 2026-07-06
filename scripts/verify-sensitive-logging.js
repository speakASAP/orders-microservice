const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { LoggerService } = require('../dist/logger/logger.service');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const DOC_PATHS = [
  path.join(PROJECT_ROOT, 'docs'),
  path.join(PROJECT_ROOT, 'implementation-goals'),
];

const loggerCallPattern = /\b(?:this\.)?logger\.(?:log|warn|error)\s*\(|\bconsole\.(?:log|warn|error)\s*\(/g;
const sensitiveLogArgumentPattern = /\b(customer|shippingAddress|billingAddress|address|street|postalCode|paymentMethod|paymentStatus|payment|token|authorization|bearer|jwt|secret|password|credential|trackingNumber|trackingUrl)\b/i;
const bearerLiteralPattern = /\bBearer\s+(?!JWT\b)[A-Za-z0-9._~+\/-]{10,}={0,2}\b/g;
const jwtLiteralPattern = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const secretAssignmentPattern = /\b(?:JWT_SECRET|DB_PASSWORD|client_secret|password)\s*=\s*['"]?[^'"\s)]+/gi;

function walkFiles(dir, predicate, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) walkFiles(fullPath, predicate, files);
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function collectCall(source, startIndex) {
  let depth = 0;
  let inString = null;
  let escaped = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index + 1);
    }
  }
  return source.slice(startIndex);
}

function verifyNoSensitiveLoggerArguments() {
  const violations = [];
  for (const file of walkFiles(SRC_DIR, (filePath) => filePath.endsWith('.ts'))) {
    const source = fs.readFileSync(file, 'utf8');
    loggerCallPattern.lastIndex = 0;
    let match;
    while ((match = loggerCallPattern.exec(source))) {
      const call = collectCall(source, match.index);
      if (sensitiveLogArgumentPattern.test(call)) {
        violations.push(path.relative(PROJECT_ROOT, file) + ':' + lineNumberAt(source, match.index) + ' ' + call.replace(/\s+/g, ' ').slice(0, 220));
      }
    }
  }
  assert.equal(violations.length, 0, 'Sensitive terms found in logger/console call arguments:\n' + violations.join('\n'));
}

function verifyNoSecretLiterals() {
  const violations = [];
  const files = [
    ...walkFiles(SRC_DIR, (filePath) => filePath.endsWith('.ts')),
    ...DOC_PATHS.flatMap((dir) => walkFiles(dir, (filePath) => filePath.endsWith('.md'))),
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of [bearerLiteralPattern, jwtLiteralPattern, secretAssignmentPattern]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(source))) {
        violations.push(path.relative(PROJECT_ROOT, file) + ':' + lineNumberAt(source, match.index) + ' ' + match[0]);
      }
    }
  }
  assert.equal(violations.length, 0, 'Secret-like literals found:\n' + violations.join('\n'));
}

function captureConsole(callback) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const lines = [];
  console.log = (line) => lines.push(String(line));
  console.error = (line) => lines.push(String(line));
  console.warn = (line) => lines.push(String(line));
  try {
    callback(lines);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }
  return lines;
}

function verifyLoggerRuntimeRedaction() {
  const logger = new LoggerService();
  const originalFetch = global.fetch;
  global.fetch = undefined;
  let lines;
  try {
    lines = captureConsole(() => {
      logger.log('customer.email=jane@example.invalid token=abc123 Authorization: Bearer abc.def.ghi', 'customerContext');
      logger.warn('{"shippingAddress":{"street":"Main 1"},"paymentMethod":"card"}', 'OrdersService');
      logger.error('upstream failed password=hunter2', 'jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature', 'PricingService');
      logger.audit({
        operation: 'shipment.tracking.update',
        resourceType: 'shipment',
        resourceId: 'shipment-1',
        actorId: 'token=abc123',
        outcome: 'success',
      }, 'Audit');
    });
  } finally {
    global.fetch = originalFetch;
  }

  const output = lines.join('\n');
  for (const forbidden of ['jane@example.invalid', 'abc123', 'abc.def.ghi', 'Main 1', 'card', 'hunter2', 'eyJhbGciOiJIUzI1NiJ9']) {
    assert.equal(output.includes(forbidden), false, 'Logger output leaked sensitive value: ' + forbidden + '\n' + output);
  }
  assert.equal(output.includes('shipment.tracking.update'), true, 'Logger audit removed safe operation name:\n' + output);
  assert.equal(output.includes('customerContext'), false, 'Logger context was not sanitized:\n' + output);
}

async function verifyCentralTransport() {
  const logger = new LoggerService();
  const originalFetch = global.fetch;
  const originalEnv = {
    LOGGING_SERVICE_URL: process.env.LOGGING_SERVICE_URL,
    LOGGING_SERVICE_API_PATH: process.env.LOGGING_SERVICE_API_PATH,
    SERVICE_NAME: process.env.SERVICE_NAME,
    LOGGING_SERVICE_TOKEN: process.env.LOGGING_SERVICE_TOKEN,
  };
  const requests = [];

  process.env.LOGGING_SERVICE_URL = 'https://logging.internal/';
  process.env.LOGGING_SERVICE_API_PATH = '/custom/logs';
  process.env.SERVICE_NAME = 'orders-api';
  process.env.LOGGING_SERVICE_TOKEN = 'test-central-token';
  global.fetch = (url, options) => {
    requests.push({ url, options, payload: JSON.parse(options.body) });
    return Promise.reject(new Error('service unavailable'));
  };

  try {
    captureConsole(() => {
      assert.doesNotThrow(() => {
        logger.warn('central event token=abc123', 'OrdersService', {
          durationMs: 13.7,
          correlation_id: 'corr-123',
          customerEmail: 'jane@example.invalid',
          nested: {
            Authorization: 'Bearer abc.def.ghi',
            safe: 'kept',
          },
        });
      });
    });
    await Promise.resolve();
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.equal(requests.length, 1, 'Central transport should issue one non-blocking request');
  assert.equal(requests[0].url, 'https://logging.internal/custom/logs');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['content-type'], 'application/json');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-central-token');

  const payload = requests[0].payload;
  assert.equal(payload.level, 'warn');
  assert.equal(payload.service, 'orders-api');
  assert.equal(payload.message.includes('abc123'), false, 'Central payload message leaked token');
  assert.equal(payload.duration_ms, 14);
  assert.equal(payload.correlation_id, 'corr-123');
  assert.equal(payload.metadata.customerEmail, '[REDACTED]');
  assert.equal(payload.metadata.nested.Authorization, '[REDACTED]');
  assert.equal(payload.metadata.nested.safe, 'kept');
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
}


async function verifyCentralTransportOmitsAuthWithoutToken() {
  const logger = new LoggerService();
  const originalFetch = global.fetch;
  const originalEnv = {
    LOGGING_SERVICE_URL: process.env.LOGGING_SERVICE_URL,
    LOGGING_SERVICE_API_PATH: process.env.LOGGING_SERVICE_API_PATH,
    LOGGING_SERVICE_TOKEN: process.env.LOGGING_SERVICE_TOKEN,
  };
  const requests = [];

  process.env.LOGGING_SERVICE_URL = 'https://logging.internal';
  delete process.env.LOGGING_SERVICE_API_PATH;
  delete process.env.LOGGING_SERVICE_TOKEN;
  global.fetch = (url, options) => {
    requests.push({ url, options });
    return Promise.resolve({ ok: true });
  };

  try {
    captureConsole(() => logger.log('no auth header', 'OrdersService'));
    await Promise.resolve();
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  assert.equal(requests.length, 1, 'Central transport should still post when token is unset');
  assert.equal(requests[0].url, 'https://logging.internal/api/logs');
  assert.equal(Object.prototype.hasOwnProperty.call(requests[0].options.headers, 'Authorization'), false);
}

async function verifyCentralTransportDisabledWithoutUrl() {
  const logger = new LoggerService();
  const originalFetch = global.fetch;
  const originalUrl = process.env.LOGGING_SERVICE_URL;
  let called = false;

  delete process.env.LOGGING_SERVICE_URL;
  global.fetch = () => {
    called = true;
    return Promise.resolve({ ok: true });
  };

  try {
    captureConsole(() => logger.log('stdout only', 'OrdersService'));
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.LOGGING_SERVICE_URL;
    else process.env.LOGGING_SERVICE_URL = originalUrl;
  }

  assert.equal(called, false, 'Central transport must be disabled when LOGGING_SERVICE_URL is absent');
}

(async () => {
  verifyNoSensitiveLoggerArguments();
  verifyNoSecretLiterals();
  verifyLoggerRuntimeRedaction();
  await verifyCentralTransport();
  await verifyCentralTransportOmitsAuthWithoutToken();
  await verifyCentralTransportDisabledWithoutUrl();
  console.log('sensitive logging verification ok');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
