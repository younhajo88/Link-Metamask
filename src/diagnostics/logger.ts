export type ActionLogStatus = 'idle' | 'pending' | 'success' | 'error';

export interface ActionLogEntry {
  id: string;
  action: string;
  status: ActionLogStatus;
  details: unknown;
  createdAt: string;
}

export function createActionLog(
  action: string,
  status: ActionLogStatus,
  details: unknown,
): ActionLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    status,
    details,
    createdAt: new Date().toISOString(),
  };
}

export function pushActionLog(
  entries: ActionLogEntry[],
  entry: ActionLogEntry,
  limit = 30,
): ActionLogEntry[] {
  return [entry, ...entries].slice(0, limit);
}

export function toErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function formatLogDetails(details: unknown) {
  return JSON.stringify(
    details,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );
}
