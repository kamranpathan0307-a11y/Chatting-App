/**
 * Performance monitoring utility for tracking animation and loading times
 */

class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.metrics = new Map();
    this.thresholds = {
      modalAnimation: 300, // ms
      imageEditorLoad: 500, // ms
      galleryLoad: 1000, // ms
      thumbnailCache: 200, // ms
    };
  }

  /**
   * Start timing an operation
   * @param {string} operation - Operation name
   * @param {Object} metadata - Additional metadata
   */
  startTimer(operation, metadata = {}) {
    this.timers.set(operation, {
      startTime: Date.now(),
      metadata,
    });
  }

  /**
   * End timing an operation and record the result
   * @param {string} operation - Operation name
   * @param {Object} additionalData - Additional data to record
   * @returns {number} - Duration in milliseconds
   */
  endTimer(operation, additionalData = {}) {
    const timer = this.timers.get(operation);
    if (!timer) {
      console.warn(`No timer found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - timer.startTime;
    const threshold = this.thresholds[operation];

    const metric = {
      operation,
      duration,
      threshold,
      exceeded: threshold ? duration > threshold : false,
      timestamp: Date.now(),
      metadata: timer.metadata,
      ...additionalData,
    };

    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation).push(metric);

    // Keep only last 50 metrics per operation
    const operationMetrics = this.metrics.get(operation);
    if (operationMetrics.length > 50) {
      operationMetrics.shift();
    }

    // Log performance issues in development
    if (__DEV__ && metric.exceeded) {
      console.warn(
        `Performance threshold exceeded for ${operation}: ${duration}ms (threshold: ${threshold}ms)`,
        metric,
      );
    }

    this.timers.delete(operation);
    return duration;
  }

  /**
   * Record a performance metric without timing
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(operation, duration, metadata = {}) {
    const threshold = this.thresholds[operation];

    const metric = {
      operation,
      duration,
      threshold,
      exceeded: threshold ? duration > threshold : false,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation).push(metric);

    if (__DEV__ && metric.exceeded) {
      console.warn(
        `Performance threshold exceeded for ${operation}: ${duration}ms (threshold: ${threshold}ms)`,
        metric,
      );
    }
  }

  /**
   * Get performance statistics for an operation
   * @param {string} operation - Operation name
   * @returns {Object} - Performance statistics
   */
  getStats(operation) {
    const operationMetrics = this.metrics.get(operation) || [];

    if (operationMetrics.length === 0) {
      return {
        operation,
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        threshold: this.thresholds[operation] || null,
        exceedanceRate: 0,
      };
    }

    const durations = operationMetrics.map(m => m.duration);
    const exceededCount = operationMetrics.filter(m => m.exceeded).length;

    return {
      operation,
      count: operationMetrics.length,
      average: Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length,
      ),
      min: Math.min(...durations),
      max: Math.max(...durations),
      threshold: this.thresholds[operation] || null,
      exceedanceRate: Math.round(
        (exceededCount / operationMetrics.length) * 100,
      ),
      recentMetrics: operationMetrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Get all performance statistics
   * @returns {Object} - All performance statistics
   */
  getAllStats() {
    const stats = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  /**
   * Clear all metrics for an operation
   * @param {string} operation - Operation name
   */
  clearMetrics(operation) {
    if (operation) {
      this.metrics.delete(operation);
      this.timers.delete(operation);
    } else {
      this.metrics.clear();
      this.timers.clear();
    }
  }

  /**
   * Set performance threshold for an operation
   * @param {string} operation - Operation name
   * @param {number} threshold - Threshold in milliseconds
   */
  setThreshold(operation, threshold) {
    this.thresholds[operation] = threshold;
  }

  /**
   * Monitor a function's execution time
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to monitor
   * @param {Object} metadata - Additional metadata
   * @returns {Promise|any} - Function result
   */
  async monitor(operation, fn, metadata = {}) {
    this.startTimer(operation, metadata);

    try {
      const result = await fn();
      this.endTimer(operation, { success: true });
      return result;
    } catch (error) {
      this.endTimer(operation, { success: false, error: error.message });
      throw error;
    }
  }

  /**
   * Create a performance-monitored version of a function
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to wrap
   * @param {Object} metadata - Additional metadata
   * @returns {Function} - Wrapped function
   */
  wrap(operation, fn, metadata = {}) {
    return (...args) => {
      return this.monitor(operation, () => fn(...args), metadata);
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    if (!__DEV__) return;

    console.group('Performance Summary');

    const allStats = this.getAllStats();
    const operations = Object.keys(allStats);

    if (operations.length === 0) {
      console.log('No performance metrics recorded');
      console.groupEnd();
      return;
    }

    operations.forEach(operation => {
      const stats = allStats[operation];
      const status =
        stats.exceedanceRate > 20
          ? '🔴'
          : stats.exceedanceRate > 0
          ? '🟡'
          : '🟢';

      console.log(
        `${status} ${operation}: avg ${stats.average}ms (${stats.count} samples, ${stats.exceedanceRate}% exceeded)`,
      );
    });

    console.groupEnd();
  }
}

// Export singleton instance
export default new PerformanceMonitor();

// Export class for testing
export { PerformanceMonitor };
