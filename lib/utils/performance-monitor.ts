interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  measure<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    if (!this.isEnabled) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordMetric(`${name}_error`, duration, { ...context, error: errorMessage });
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordMetric(`${name}_error`, duration, { ...context, error: errorMessage });
      throw error;
    }
  }

  private recordMetric(name: string, duration: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, context);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageDuration(name: string) {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor(); 