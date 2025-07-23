import React, { useState, useEffect } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { performanceUtils } from '../services/performanceUtils';
import { articleCache } from '../services/articleCache';

interface PerformanceDebuggerProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = ({
  enabled = import.meta.env.DEV,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'cache' | 'network'>('metrics');
  const {
    metrics,
    snapshots,
    getPerformanceSummary,
    clearMetrics,
    isEnabled,
    getCacheStats,
    cleanupCache,
    getNetworkBatchStats,
    isBackgrounded
  } = usePerformance();

  useEffect(() => {
    if (!enabled || !isEnabled) return;

    // Show debugger after initial load
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, [enabled, isEnabled]);

  if (!enabled || !isEnabled || !isVisible) {
    return null;
  }

  const summary = getPerformanceSummary();
  const memoryInfo = performanceUtils.getMemoryUsage();
  const cacheStats = getCacheStats();
  const networkStats = getNetworkBatchStats();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const formatValue = (value: number, unit: string = 'ms') => {
    if (value === 0) return '0';
    return `${value.toFixed(2)}${unit}`;
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 bg-black/80 text-white text-xs font-mono rounded-lg shadow-lg backdrop-blur-sm`}
      style={{ minWidth: '240px', maxWidth: '320px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/10 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-semibold">⚡ Performance</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              metrics.renderTime > 16 ? 'bg-red-500' :
              metrics.renderTime > 8 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
          {isBackgrounded && <span className="text-yellow-400">BG</span>}
          <span>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Collapsed view - show key metrics */}
      {!isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          <div className="flex justify-between">
            <span>Render:</span>
            <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
              {formatValue(metrics.renderTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
              {metrics.fps.toFixed(0)}
            </span>
          </div>
          {memoryInfo && (
            <div className="flex justify-between">
              <span>Memory:</span>
              <span>{memoryInfo.used}MB</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Cache:</span>
            <span className={cacheStats.hitRate > 0.7 ? 'text-green-400' : 'text-yellow-400'}>
              {(cacheStats.hitRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Expanded view - show all metrics */}
      {isExpanded && (
        <div className="border-t border-white/20">
          {/* Tabs */}
          <div className="flex border-b border-white/20">
            <button
              className={`flex-1 py-1 text-center ${activeTab === 'metrics' ? 'bg-white/10 text-blue-300' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </button>
            <button
              className={`flex-1 py-1 text-center ${activeTab === 'cache' ? 'bg-white/10 text-green-300' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab('cache')}
            >
              Cache
            </button>
            <button
              className={`flex-1 py-1 text-center ${activeTab === 'network' ? 'bg-white/10 text-purple-300' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab('network')}
            >
              Network
            </button>
          </div>

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="p-2 space-y-2">
              {/* App Status */}
              <div>
                <div className="font-semibold mb-1 text-yellow-300">App Status</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>State:</span>
                    <span className={isBackgrounded ? 'text-yellow-400' : 'text-green-400'}>
                      {isBackgrounded ? 'Backgrounded' : 'Active'}
                    </span>
                  </div>
                  {isBackgrounded && (
                    <div className="flex justify-between">
                      <span>Time in BG:</span>
                      <span>{formatTime(metrics.backgroundedTime)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
                      {metrics.fps.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Metrics */}
              <div>
                <div className="font-semibold mb-1 text-blue-300">Current Metrics</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Load Time:</span>
                    <span>{formatValue(metrics.loadTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Render Time:</span>
                    <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
                      {formatValue(metrics.renderTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span>{formatValue(metrics.memoryUsage, 'MB')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className={metrics.cacheHitRate > 80 ? 'text-green-400' : 'text-yellow-400'}>
                      {formatValue(metrics.cacheHitRate, '%')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Requests:</span>
                    <span>{metrics.networkRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long Tasks:</span>
                    <span className={metrics.longTasks > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      {metrics.longTasks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layout Shifts:</span>
                    <span className={metrics.layoutShifts > 5 ? 'text-red-400' : 'text-green-400'}>
                      {metrics.layoutShifts}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Details */}
              {memoryInfo && (
                <div>
                  <div className="font-semibold mb-1 text-green-300">Memory Details</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{memoryInfo.used}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{memoryInfo.total}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <span>{memoryInfo.limit}MB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${(memoryInfo.used / memoryInfo.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div>
                  <div className="font-semibold mb-1 text-purple-300">Summary</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Avg Render:</span>
                      <span>{formatValue(summary.averageRenderTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Memory:</span>
                      <span>{formatValue(summary.maxMemoryUsage, 'MB')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Cache Hit:</span>
                      <span>{formatValue(summary.averageCacheHitRate, '%')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg FPS:</span>
                      <span>{summary.averageFps?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Long Tasks:</span>
                      <span>{summary.totalLongTasks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Samples:</span>
                      <span>{summary.metricsCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="p-2 space-y-2">
              {/* Cache Stats */}
              <div>
                <div className="font-semibold mb-1 text-green-300">Cache Statistics</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{cacheStats.size} / {cacheStats.maxSize}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1 mb-2">
                    <div
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${(cacheStats.size / cacheStats.maxSize) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className={cacheStats.hitRate > 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                      {(cacheStats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hits:</span>
                    <span>{cacheStats.hits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Misses:</span>
                    <span>{cacheStats.misses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evictions:</span>
                    <span>{cacheStats.evictions}</span>
                  </div>
                </div>
              </div>

              {/* Cache Age */}
              <div>
                <div className="font-semibold mb-1 text-blue-300">Cache Age</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Oldest Item:</span>
                    <span>{formatTime(cacheStats.oldestItemAge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Newest Item:</span>
                    <span>{formatTime(cacheStats.newestItemAge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Age:</span>
                    <span>{formatTime(cacheStats.averageAge)}</span>
                  </div>
                </div>
              </div>

              {/* Cache Memory */}
              {cacheStats.memoryUsage !== null && (
                <div>
                  <div className="font-semibold mb-1 text-yellow-300">Cache Memory</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span>{cacheStats.memoryUsage}MB</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cache Actions */}
              <div className="flex gap-2 pt-2 border-t border-white/20">
                <button
                  onClick={cleanupCache}
                  className="flex-1 px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 rounded text-xs transition-colors"
                >
                  Cleanup
                </button>
                <button
                  onClick={() => {
                    articleCache.clear();
                    cleanupCache();
                  }}
                  className="flex-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-xs transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="p-2 space-y-2">
              {/* Network Stats */}
              <div>
                <div className="font-semibold mb-1 text-purple-300">Network Statistics</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span>{metrics.networkRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Batches:</span>
                    <span>{networkStats.totalBatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Batches:</span>
                    <span className={networkStats.pendingBatches > 0 ? 'text-yellow-400' : 'text-green-400'}>
                      {networkStats.pendingBatches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Batches:</span>
                    <span>{networkStats.completedBatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Batches:</span>
                    <span className={networkStats.failedBatches > 0 ? 'text-red-400' : 'text-green-400'}>
                      {networkStats.failedBatches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Batch Time:</span>
                    <span>{formatTime(networkStats.averageBatchTime)}</span>
                  </div>
                </div>
              </div>

              {/* Background Status */}
              <div>
                <div className="font-semibold mb-1 text-yellow-300">Background Status</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>App State:</span>
                    <span className={isBackgrounded ? 'text-yellow-400' : 'text-green-400'}>
                      {isBackgrounded ? 'Backgrounded' : 'Active'}
                    </span>
                  </div>
                  {isBackgrounded && (
                    <div className="flex justify-between">
                      <span>Time in Background:</span>
                      <span>{formatTime(metrics.backgroundedTime)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Auto Cleanup:</span>
                    <span>Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 p-2 border-t border-white/20">
            <button
              onClick={clearMetrics}
              className="flex-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 rounded text-xs transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const data = {
                  metrics,
                  summary,
                  memoryInfo,
                  cacheStats,
                  networkStats,
                  snapshots: snapshots.slice(-5), // Last 5 snapshots
                  timestamp: new Date().toISOString()
                };
                console.log('Performance Data:', data);
              }}
              className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 rounded text-xs transition-colors"
            >
              Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDebugger;
