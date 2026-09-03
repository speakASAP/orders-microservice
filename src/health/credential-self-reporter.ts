import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from '../logger/logger.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const reporter = require('./vendor/credential-reporter.js');

const SELF_REPORT_CRON = process.env.CREDENTIAL_SELF_REPORT_CRON || '*/30 * * * *';

const WAREHOUSE_URL =
  process.env.WAREHOUSE_SERVICE_URL ||
  'http://warehouse-microservice.statex-apps.svc.cluster.local:3201';

const MONITORING_URL =
  process.env.MONITORING_URL ||
  'http://monitoring-microservice.statex-apps.svc.cluster.local:3395';

/**
 * This service's warehouse principal, exactly as auth lists it.
 *
 * Hardcoded rather than derived from the token: the reporter must name the
 * principal the inventory knows even when the deployed token is wrong, which is
 * the case worth reporting.
 */
const PRINCIPAL = 'svc-orders-microservice--warehouse-microservice@internal.alfares.cz';

const TARGET = 'warehouse-microservice';

/**
 * An id used only to exercise the guard, never for its response body.
 * `GET /api/stock/:productId` returns 200 with an empty array for an unknown id,
 * so the probe depends on no particular product existing.
 */
const PROBE_PRODUCT_ID = 'credential-probe';

/**
 * Reports this service's warehouse credential, per
 * `monitoring-microservice/docs/CREDENTIAL_SELF_REPORT_CONTRACT.md`.
 *
 * Probe target: `GET /api/stock/:productId`, decorated
 * `@Roles(...WAREHOUSE_READ_ROLES)`, which includes
 * `internal:warehouse-microservice:action-admin` — the role this credential
 * holds. Verified live before adoption: 200 with the real token, 401 with a
 * garbage token, 401 with none.
 *
 * Note this repo also *receives* `svc-warehouse-microservice--orders-microservice`
 * from the other direction. That principal is unprobeable and gets no reporter:
 * its role appears on exactly one orders route, a PUT, and the contract forbids
 * probing with a write.
 */
@Injectable()
export class CredentialSelfReporter {
  constructor(private readonly logger: LoggerService) {}

  @Cron(SELF_REPORT_CRON)
  async scheduledReport(): Promise<void> {
    if (process.env.CREDENTIAL_SELF_REPORT_ENABLED === 'false') return;
    await this.runReport();
  }

  async runReport(): Promise<{ verdict: string; posted: boolean } | null> {
    const token = (process.env.WAREHOUSE_SERVICE_TOKEN || '').trim();
    const ingestToken = (process.env.NOTIFICATION_SERVICE_TOKEN || '').trim();

    if (!ingestToken) {
      // A reporter that stops reporting is indistinguishable from a credential
      // that broke, and silence is this design's primary signal. Say so.
      this.logger.error(
        'credential_self_report_undeliverable',
        undefined,
        'CredentialSelfReporter',
        { principal: PRINCIPAL, reason: 'NOTIFICATION_SERVICE_TOKEN is empty' },
      );
      return null;
    }

    const outcome = await reporter.reportCredential({
      url: `${WAREHOUSE_URL}/api/stock/${PROBE_PRODUCT_ID}`,
      token,
      serviceName: 'orders-microservice',
      monitoringUrl: MONITORING_URL,
      ingestToken,
      principal: PRINCIPAL,
      target: TARGET,
    });

    this.logger.log('credential_self_report_sent', 'CredentialSelfReporter', {
      principal: PRINCIPAL,
      target: TARGET,
      verdict: outcome.verdict,
      posted: outcome.posted,
      error: outcome.error ?? null,
    });

    if (!outcome.posted) {
      this.logger.warn(
        `probe said ${outcome.verdict} but the report was not accepted` +
          (outcome.error ? `: ${outcome.error}` : ''),
        'CredentialSelfReporter',
        { principal: PRINCIPAL },
      );
    }

    return { verdict: outcome.verdict, posted: outcome.posted };
  }
}
