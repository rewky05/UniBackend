/**
 * Bulk Import Performance Monitor
 * Tracks and analyzes bulk import operations for optimization
 */

export interface BulkImportMetrics {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  totalDuration: number;
  averageBatchDuration: number;
  averageRecordDuration: number;
  retryCount: number;
  errorBreakdown: {
    network: number;
    validation: number;
    duplicate: number;
    permission: number;
    system: number;
  };
  performanceScore: number; // 0-100
}

export interface BatchMetrics {
  batchNumber: number;
  recordCount: number;
  successfulCount: number;
  failedCount: number;
  duration: number;
  errors: string[];
  timestamp: number;
}

export class BulkImportMonitor {
  private startTime: number = 0;
  private batchMetrics: BatchMetrics[] = [];
  private retryCount: number = 0;
  private errorCounts = {
    network: 0,
    validation: 0,
    duplicate: 0,
    permission: 0,
    system: 0
  };

  startMonitoring() {
    this.startTime = Date.now();
    this.batchMetrics = [];
    this.retryCount = 0;
    this.errorCounts = {
      network: 0,
      validation: 0,
      duplicate: 0,
      permission: 0,
      system: 0
    };
  }

  recordBatch(batchNumber: number, recordCount: number, successfulCount: number, failedCount: number, duration: number, errors: string[]) {
    this.batchMetrics.push({
      batchNumber,
      recordCount,
      successfulCount,
      failedCount,
      duration,
      errors,
      timestamp: Date.now()
    });
  }

  recordRetry() {
    this.retryCount++;
  }

  recordError(errorType: keyof typeof this.errorCounts) {
    this.errorCounts[errorType]++;
  }

  getMetrics(): BulkImportMetrics {
    const totalDuration = Date.now() - this.startTime;
    const totalRecords = this.batchMetrics.reduce((sum, batch) => sum + batch.recordCount, 0);
    const successfulRecords = this.batchMetrics.reduce((sum, batch) => sum + batch.successfulCount, 0);
    const failedRecords = this.batchMetrics.reduce((sum, batch) => sum + batch.failedCount, 0);
    const totalBatches = this.batchMetrics.length;
    const successfulBatches = this.batchMetrics.filter(batch => batch.failedCount === 0).length;
    const failedBatches = totalBatches - successfulBatches;
    const averageBatchDuration = totalBatches > 0 ? this.batchMetrics.reduce((sum, batch) => sum + batch.duration, 0) / totalBatches : 0;
    const averageRecordDuration = totalRecords > 0 ? totalDuration / totalRecords : 0;

    // Calculate performance score (0-100)
    const successRate = totalRecords > 0 ? successfulRecords / totalRecords : 0;
    const batchSuccessRate = totalBatches > 0 ? successfulBatches / totalBatches : 0;
    const efficiencyScore = totalRecords > 0 ? Math.min(100, (totalRecords / (totalDuration / 1000)) * 10) : 0; // records per second * 10
    const performanceScore = Math.round((successRate * 40) + (batchSuccessRate * 30) + (efficiencyScore * 30));

    return {
      totalRecords,
      successfulRecords,
      failedRecords,
      totalBatches,
      successfulBatches,
      failedBatches,
      totalDuration,
      averageBatchDuration,
      averageRecordDuration,
      retryCount: this.retryCount,
      errorBreakdown: { ...this.errorCounts },
      performanceScore
    };
  }

  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.performanceScore < 70) {
      recommendations.push("Consider reducing batch size for better reliability");
    }

    if (metrics.errorBreakdown.network > metrics.totalRecords * 0.1) {
      recommendations.push("Network issues detected - consider increasing delays between batches");
    }

    if (metrics.retryCount > metrics.totalRecords * 0.2) {
      recommendations.push("High retry rate - consider implementing better error handling");
    }

    if (metrics.averageBatchDuration > 10000) { // 10 seconds
      recommendations.push("Slow batch processing - consider optimizing database operations");
    }

    if (metrics.errorBreakdown.validation > 0) {
      recommendations.push("Validation errors found - review data quality and validation rules");
    }

    return recommendations;
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const recommendations = this.getRecommendations();

    return `
Bulk Import Performance Report
==============================

Summary:
- Total Records: ${metrics.totalRecords}
- Successful: ${metrics.successfulRecords} (${((metrics.successfulRecords / metrics.totalRecords) * 100).toFixed(1)}%)
- Failed: ${metrics.failedRecords} (${((metrics.failedRecords / metrics.totalRecords) * 100).toFixed(1)}%)
- Total Duration: ${(metrics.totalDuration / 1000).toFixed(1)}s
- Performance Score: ${metrics.performanceScore}/100

Batch Analysis:
- Total Batches: ${metrics.totalBatches}
- Successful Batches: ${metrics.successfulBatches}
- Failed Batches: ${metrics.failedBatches}
- Average Batch Duration: ${metrics.averageBatchDuration.toFixed(0)}ms

Error Analysis:
- Network Errors: ${metrics.errorBreakdown.network}
- Validation Errors: ${metrics.errorBreakdown.validation}
- Duplicate Errors: ${metrics.errorBreakdown.duplicate}
- Permission Errors: ${metrics.errorBreakdown.permission}
- System Errors: ${metrics.errorBreakdown.system}
- Total Retries: ${metrics.retryCount}

Recommendations:
${recommendations.map(rec => `- ${rec}`).join('\n')}
    `.trim();
  }
}

export const bulkImportMonitor = new BulkImportMonitor();
