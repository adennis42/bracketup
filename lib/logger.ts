/**
 * BracketUp Logger
 * Structured logging with levels, context, and session tracking.
 * In dev: pretty console output. In production: JSON for log aggregators.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  tournamentId?: string;
  userId?: string;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel =
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const tid = entry.tournamentId ? ` [t:${entry.tournamentId}]` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}]${tid} ${entry.message}${ctx}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  tournamentId?: string
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    tournamentId,
  };
}

function emit(entry: LogEntry) {
  const formatted = formatEntry(entry);
  switch (entry.level) {
    case 'debug': console.debug(formatted); break;
    case 'info':  console.info(formatted);  break;
    case 'warn':  console.warn(formatted);  break;
    case 'error': console.error(formatted); break;
  }

  // In production, ship to external service here (e.g. Sentry, LogRocket, Datadog)
  if (process.env.NODE_ENV === 'production' && entry.level === 'error') {
    // TODO: sendToExternalService(entry);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>, tournamentId?: string) => {
    if (shouldLog('debug')) emit(createEntry('debug', message, context, tournamentId));
  },

  info: (message: string, context?: Record<string, unknown>, tournamentId?: string) => {
    if (shouldLog('info')) emit(createEntry('info', message, context, tournamentId));
  },

  warn: (message: string, context?: Record<string, unknown>, tournamentId?: string) => {
    if (shouldLog('warn')) emit(createEntry('warn', message, context, tournamentId));
  },

  error: (message: string, context?: Record<string, unknown>, tournamentId?: string) => {
    if (shouldLog('error')) emit(createEntry('error', message, context, tournamentId));
  },

  // Convenience: log an error with full stack trace
  exception: (message: string, err: unknown, context?: Record<string, unknown>, tournamentId?: string) => {
    const errorContext = {
      ...context,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    };
    emit(createEntry('error', message, errorContext, tournamentId));
  },

  // Domain-specific helpers
  tournament: {
    created: (id: string, name: string, teamCount: number) =>
      logger.info('Tournament created', { name, teamCount }, id),

    phaseChanged: (id: string, from: string, to: string) =>
      logger.info('Tournament phase changed', { from, to }, id),

    scoreEntered: (id: string, matchId: string, score1: number, score2: number) =>
      logger.debug('Score entered', { matchId, score1, score2 }, id),

    bracketGenerated: (id: string, teamCount: number, rounds: number) =>
      logger.info('Elimination bracket generated', { teamCount, rounds }, id),

    completed: (id: string, winnerId: string) =>
      logger.info('Tournament completed', { winnerId }, id),
  },
};
