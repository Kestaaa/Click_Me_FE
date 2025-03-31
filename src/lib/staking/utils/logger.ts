/**
 * Environment-aware logging utility
 */
export class Logger {
    private static readonly IS_DEV = process.env.NODE_ENV === 'development';
    
    /**
     * Log debug information (only in development)
     */
    static debug(message: string, ...args: any[]): void {
      if (this.IS_DEV) {
        console.log(`[Staking] ${message}`, ...args);
      }
    }
    
    /**
     * Log informational messages (only in development)
     */
    static info(message: string, ...args: any[]): void {
      if (this.IS_DEV) {
        console.info(`[Staking] ${message}`, ...args);
      }
    }
    
    /**
     * Log warnings (in all environments)
     */
    static warn(message: string, ...args: any[]): void {
      console.warn(`[Staking] ${message}`, ...args);
    }
    
    /**
     * Log errors (in all environments)
     */
    static error(message: string, error?: any): void {
      console.error(`[Staking] ${message}`, error);
    }
  }