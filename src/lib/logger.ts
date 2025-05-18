/**
 * WellPharm Logger
 *
 * A professional client-side logging utility that provides:
 * - Multiple log levels (debug, info, warn, error)
 * - Stylized console output for better visual distinction
 * - Environment-based and user preference toggling
 * - Configurable log level filtering
 * - Timestamp and context information
 * - Performance optimizations
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // Used to disable all logging
}

// Logger configuration options
export interface LoggerConfig {
  // Minimum level to display (defaults to INFO in production, DEBUG in development)
  minLevel: LogLevel;
  // Whether to include timestamps (default: true)
  showTimestamps: boolean;
  // Whether to enable logging at all (default: true in development, based on localStorage in production)
  enabled: boolean;
  // Whether to persist logs to localStorage for debugging (default: false)
  persistLogs: boolean;
  // Maximum number of persisted logs to keep
  maxPersistedLogs: number;
}

// Default configuration based on environment
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG,
  showTimestamps: true,
  enabled: import.meta.env.PROD
    ? localStorage.getItem('wellpharm_logging_enabled') === 'true'
    : true,
  persistLogs: false,
  maxPersistedLogs: 100,
};

// CSS styles for different log levels
const LOG_STYLES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'color: #6b7280; font-weight: normal;', // Gray
  [LogLevel.INFO]: 'color: #3b82f6; font-weight: normal;', // Blue
  [LogLevel.WARN]: 'color: #f59e0b; font-weight: bold;', // Orange
  [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold;', // Red
  [LogLevel.NONE]: '', // Empty style for NONE level
};

// Log level names for display
const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

class Logger {
  private config: LoggerConfig;
  private persistedLogs: Array<{
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: unknown;
  }> = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Load persisted logs if enabled
    if (this.config.persistLogs) {
      try {
        const savedLogs = localStorage.getItem('wellpharm_logs');
        if (savedLogs) {
          this.persistedLogs = JSON.parse(savedLogs);
        }
      } catch (error) {
        console.error('Failed to load persisted logs:', error);
        localStorage.removeItem('wellpharm_logs');
      }
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Update localStorage if enabled state changes
    if ('enabled' in config) {
      localStorage.setItem('wellpharm_logging_enabled', String(config.enabled));
    }
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    localStorage.setItem('wellpharm_logging_enabled', String(enabled));
  }

  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Log a debug message
   */
  debug(context: string, message: string, ...data: unknown[]): void {
    this.log(LogLevel.DEBUG, context, message, ...data);
  }

  /**
   * Log an info message
   */
  info(context: string, message: string, ...data: unknown[]): void {
    this.log(LogLevel.INFO, context, message, ...data);
  }

  /**
   * Log a warning message
   */
  warn(context: string, message: string, ...data: unknown[]): void {
    this.log(LogLevel.WARN, context, message, ...data);
  }

  /**
   * Log an error message
   */
  error(context: string, message: string, ...data: unknown[]): void {
    this.log(LogLevel.ERROR, context, message, ...data);
  }

  /**
   * Get all persisted logs
   */
  getPersistedLogs() {
    return [...this.persistedLogs];
  }

  /**
   * Clear persisted logs
   */
  clearPersistedLogs(): void {
    this.persistedLogs = [];
    localStorage.removeItem('wellpharm_logs');
  }

  /**
   * Internal logging implementation
   */
  private log(
    level: LogLevel,
    context: string,
    message: string,
    ...data: unknown[]
  ): void {
    // Skip logging if disabled or below minimum level
    if (!this.config.enabled || level < this.config.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const style = LOG_STYLES[level];

    // Format the log prefix
    const prefix = this.config.showTimestamps
      ? `[${timestamp}] %c${levelName}%c [${context}]:`
      : `%c${levelName}%c [${context}]:`;

    // Log to console with appropriate styling
    if (data.length > 0) {
      console.log(
        prefix,
        style,
        'color: inherit; font-weight: normal;',
        message,
        ...data,
      );
    } else {
      console.log(
        prefix,
        style,
        'color: inherit; font-weight: normal;',
        message,
      );
    }

    // Persist log if enabled
    if (this.config.persistLogs) {
      this.persistedLogs.push({
        timestamp,
        level,
        context,
        message,
        data: data.length > 0 ? data : undefined,
      });

      // Trim logs if exceeding maximum
      if (this.persistedLogs.length > this.config.maxPersistedLogs) {
        this.persistedLogs = this.persistedLogs.slice(
          -this.config.maxPersistedLogs,
        );
      }

      // Save to localStorage
      try {
        localStorage.setItem(
          'wellpharm_logs',
          JSON.stringify(this.persistedLogs),
        );
      } catch (error) {
        console.error('Failed to persist logs:', error);
      }
    }
  }
}

// Create and export a singleton instance
export const logger = new Logger();

/**
 * Create a context-specific logger
 * @param context The context name for this logger
 * @returns A logger with methods bound to the specified context
 */
export function createContextLogger(context: string) {
  return {
    debug: (message: string, ...data: unknown[]) =>
      logger.debug(context, message, ...data),
    info: (message: string, ...data: unknown[]) =>
      logger.info(context, message, ...data),
    warn: (message: string, ...data: unknown[]) =>
      logger.warn(context, message, ...data),
    error: (message: string, ...data: unknown[]) =>
      logger.error(context, message, ...data),
  };
}

/**
 * Helper to create a logger for a component
 * @param componentName The name of the component
 * @returns A logger with methods bound to the component context
 */
export function createComponentLogger(componentName: string) {
  return createContextLogger(`Component:${componentName}`);
}

/**
 * Helper to create a logger for a service
 * @param serviceName The name of the service
 * @returns A logger with methods bound to the service context
 */
export function createServiceLogger(serviceName: string) {
  return createContextLogger(`Service:${serviceName}`);
}

export default logger;
