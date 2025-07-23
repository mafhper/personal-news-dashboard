import React, { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { performanceUtils } from '../services/performanceUtils';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'cache' | 'network' | 'benchmarks'>('overview');
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const {
    metrics,
    snapshots,
    getPerformanceSummary,
    clearMetrics,
    getCacheStats,
    getNetworkBatchStats,
    isEnabled
  } = usePerformance();

  const summary = getPerformanceSummary();
  const memoryInfo = performanceUtils.getMemoryUsage();
  const cacheStats = getCacheStats();
  const networkStats = getNetworkBatchStats();

  // Run performance benchmarks
  const runBenchmarks = async () => {
    const results = [];

    // Render performance test
    const renderStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate DOM operations
      const div = document.createElement('div');
      div.innerHTML = `<span>Test ${i}</span>`;
      document.body.appendChild(div);
      document.body.removeChild(div);
    }
    const renderTime = performance.now() - renderStart;
    results.push({ name: 'DOM Operations (1000x)', value: renderTime, unit: 'ms', status: renderTime < 100 ? 'good' : renderTime < 200 ? 'warning' : 'poor' });

    // Memory allocation test
    const memoryStart = performanceUtils.getMemoryUsage()?.used || 0;
    const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
    const memoryEnd = performanceUtils.getMemoryUsage()?.used || 0;
    const memoryDiff = memoryEnd - memoryStart;
    results.push({ name: 'Memory Allocation (100k items)', value: memoryDiff, unit: 'MB', status: memoryDiff < 5 ? 'good' : memoryDiff < 10 ? 'warning' : 'poor' });

    // Cleanup
    largeArray.length = 0;

    // Network simulation test
    const networkStart = performance.now();
    try {
      await fetch('data:text/plain,test');
      const networkTime = performance.now() - networkStart;
      results.push({ name: 'Network Request', value: networkTime, unit: 'ms', status: networkTime < 50 ? 'good' : networkTime < 100 ? 'warning' : 'poor' });
    } catch (error) {
      results.push({ name: 'Network Request', value: 0, unit: 'ms', status: 'error' });
    }

    setBenchmarkResults(results);
  };

  const formatValue = (value: number, unit: string = 'ms') => {
    if (value === 0) return '0';
    return `${value.toFixed(2)}${unit}`;
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen || !isEnabled) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'cache', label: 'Cache' },
            { id: 'network', label: 'Network' },
            { id: 'benchmarks', label: 'Benchmarks' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Score */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Score</h3>
                <div className="text-3xl font-bold text-green-400">
                  {summary ? Math.round(100 - (summary.averageRenderTime / 16) * 100) : 'N/A'}
                </div>
                <p className="text-gray-400 text-sm">Based on render performance</p>
              </div>

              {/* Current Metrics */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Current Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
                      {metrics.fps.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Render Time:</span>
                    <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
                      {formatValue(metrics.renderTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span>{formatValue(metrics.memoryUsage, 'MB')}</span>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Cache Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hit Rate:</span>
                    <span className={cacheStats.hitRate > 0.8 ? 'text-green-400' : cacheStats.hitRate > 0.6 ? 'text-yellow-400' : 'text-red-400'}>
                      {(cacheStats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span>{cacheStats.size} / {cacheStats.maxSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evictions:</span>
                    <span className={cacheStats.evictions > 10 ? 'text-yellow-400' : 'text-green-400'}>
                      {cacheStats.evictions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Network Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Requests:</span>
                    <span>{metrics.networkRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pending:</span>
                    <span className={networkStats.pendingBatches > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      {networkStats.pendingBatches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Failed:</span>
                    <span className={networkStats.failedBatches > 0 ? 'text-red-400' : 'text-green-400'}>
                      {networkStats.failedBatches}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Details */}
              {memoryInfo && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Memory Usage</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Used:</span>
                        <span>{memoryInfo.used}MB</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(memoryInfo.used / memoryInfo.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Limit: {memoryInfo.limit}MB
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Trends */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance Trends</h3>
                <div className="space-y-2">
                  {summary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Render:</span>
                        <span>{formatValue(summary.averageRenderTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Memory:</span>
                        <span>{formatValue(summary.maxMemoryUsage, 'MB')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Samples:</span>
                        <span>{summary.metricsCount}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Performance Benchmarks</h3>
                <button
                  onClick={runBenchmarks}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Run Benchmarks
                </button>
              </div>

              {benchmarkResults.length > 0 && (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-4 text-white">Test</th>
                        <th className="text-left p-4 text-white">Result</th>
                        <th className="text-left p-4 text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarkResults.map((result, index) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="p-4 text-gray-300">{result.name}</td>
                          <td className="p-4 text-white">{formatValue(result.value, result.unit)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                              {result.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {benchmarkResults.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Click "Run Benchmarks" to test performance
                </div>
              )}
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab === 'metrics' && (
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-4">Detailed Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Load Time:</span>
                      <span>{formatValue(metrics.loadTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Long Tasks:</span>
                      <span className={metrics.longTasks > 0 ? 'text-yellow-400' : 'text-green-400'}>
                        {metrics.longTasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Layout Shifts:</span>
                      <span className={metrics.layoutShifts > 5 ? 'text-red-400' : 'text-green-400'}>
                        {metrics.layoutShifts}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Resource Count</h4>
                  <div className="text-2xl font-bold text-blue-400">
                    {performance.getEntriesByType('resource').length}
                  </div>
                  <p className="text-gray-400 text-sm">Total resources loaded</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearMetrics}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Metrics
            </button>
            <button
              onClick={() => {
                const data = {
                  metrics,
                  summary,
                  memoryInfo,
                  cacheStats,
                  networkStats,
                  snapshots: snapshots.slice(-10),
                  timestamp: new Date().toISOString()
                };
                console.log('Performance Report:', data);
                // You could also download this as a JSON file
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-report-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
