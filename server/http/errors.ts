export interface ApiErrorBody {
  code: string;
  message: string;
  issues?: { path: string; message: string }[];
}

export function apiError(
  code: string,
  message: string,
  issues?: ApiErrorBody['issues'],
): ApiErrorBody {
  return issues ? { code, message, issues } : { code, message };
}
import { ConfigRepositoryError } from '../config/errors';
import { HomeAssistantUpstreamError } from '../home-assistant/errors';
import { PolicyError } from '../home-assistant/policy-error';

export function mapRouteError(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof ConfigRepositoryError) {
    const status =
      error.code === 'CONFIG_CONFLICT' ? 409 : error.code === 'CONFIG_INVALID' ? 422 : 503;
    return { status, body: apiError(error.code, error.message, error.issues) };
  }
  if (error instanceof PolicyError) {
    return { status: 400, body: apiError('INVALID_SERVICE', error.message) };
  }
  if (error instanceof HomeAssistantUpstreamError) {
    return { status: error.statusCode, body: apiError(error.code, error.message) };
  }
  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;
  return {
    status: Math.min(statusCode, 500),
    body: apiError(
      'INTERNAL_ERROR',
      statusCode === 413 ? 'Request body is too large.' : 'Request failed.',
    ),
  };
}
