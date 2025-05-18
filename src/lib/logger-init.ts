import { LogLevel, logger } from './logger';

// Initialize logger with appropriate configuration
export function initializeLogger() {
  // In development, show all logs
  if (import.meta.env.DEV) {
    logger.configure({
      minLevel: LogLevel.DEBUG,
      showTimestamps: true,
      enabled: true,
      persistLogs: true,
      maxPersistedLogs: 200,
    });

    logger.info(
      'Logger',
      'Logger initialized in development mode - showing all logs',
    );
  } else {
    // In production, only show INFO and above by default
    logger.configure({
      minLevel: LogLevel.INFO,
      showTimestamps: true,
      enabled: localStorage.getItem('wellpharm_logging_enabled') === 'true',
      persistLogs: false,
    });

    logger.info('Logger', 'Logger initialized in production mode');
  }

  return logger;
}

// Export the initialized logger
export const initializedLogger = initializeLogger();
