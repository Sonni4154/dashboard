import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Database, 
  Activity, 
  Terminal, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  FileText,
  ExternalLink,
  Copy,
  Download,
  Eye,
  Trash2,
  Play,
  Stop,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  services: {
    database: string;
    quickbooks: string;
    filesystem: string;
  };
}

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: any;
}

interface SystemInfo {
  platform: string;
  arch: string;
  node_version: string;
  uptime: number;
  memory: any;
  disk_usage?: string;
  environment_variables: Record<string, string>;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("overview");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [qboInfo, setQboInfo] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [logLines, setLogLines] = useState("100");
  const [logLevel, setLogLevel] = useState("all");

  const fetchData = async (endpoint: string, setter: (data: any) => void) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }));
    try {
      const response = await fetch(`/api/debug/${endpoint}`);
      const result = await response.json();
      if (result.success) {
        setter(result.data);
      } else {
        console.error(`Failed to fetch ${endpoint}:`, result.message);
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  const testConnection = async (type: string) => {
    setLoading(prev => ({ ...prev, [`test_${type}`]: true }));
    try {
      const response = await fetch('/api/debug/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ ${type.toUpperCase()} connection test successful!`);
      } else {
        alert(`❌ ${type.toUpperCase()} connection test failed: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ ${type.toUpperCase()} connection test failed: ${error}`);
    } finally {
      setLoading(prev => ({ ...prev, [`test_${type}`]: false }));
    }
  };

  const fetchLogs = async () => {
    await fetchData(`logs?lines=${logLines}&level=${logLevel}`, (data) => {
      setLogs(data.logs || []);
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadLogs = () => {
    const logText = logs.map(log => JSON.stringify(log)).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'no_token':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
      case 'no_token':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      fetchData('health', setHealthData);
    } else if (activeTab === "logs") {
      fetchLogs();
    } else if (activeTab === "system") {
      fetchData('system', setSystemInfo);
    } else if (activeTab === "database") {
      fetchData('database', setDbInfo);
    } else if (activeTab === "quickbooks") {
      fetchData('quickbooks', setQboInfo);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [logLines, logLevel]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          System Administration & Debug
        </h1>
        <p className="text-muted-foreground">
          Monitor system health, view logs, and debug application issues
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Health Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Overall Status</span>
                      <Badge className={getStatusColor(healthData.status)}>
                        {getStatusIcon(healthData.status)}
                        <span className="ml-1 capitalize">{healthData.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Uptime</span>
                      <span className="text-sm text-muted-foreground">
                        {formatUptime(healthData.uptime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(healthData.memory.heapUsed)} / {formatBytes(healthData.memory.heapTotal)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Button 
                      variant="outline" 
                      onClick={() => fetchData('health', setHealthData)}
                      disabled={loading.health}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading.health ? 'animate-spin' : ''}`} />
                      Load Health Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthData?.services ? (
                  <div className="space-y-3">
                    {Object.entries(healthData.services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="capitalize">{service}</span>
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1 capitalize">{status}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Load health data to see service status
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => testConnection('database')}
                  disabled={loading.test_database}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Test Database
                  {loading.test_database && <RefreshCw className="h-4 w-4 ml-auto animate-spin" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => testConnection('quickbooks')}
                  disabled={loading.test_quickbooks}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Test QuickBooks
                  {loading.test_quickbooks && <RefreshCw className="h-4 w-4 ml-auto animate-spin" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => fetchData('health', setHealthData)}
                  disabled={loading.health}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading.health ? 'animate-spin' : ''}`} />
                  Refresh All
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Logs
              </CardTitle>
              <CardDescription>
                View and download application logs for debugging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="logLines">Number of Lines</Label>
                  <Input
                    id="logLines"
                    value={logLines}
                    onChange={(e) => setLogLines(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <select
                    id="logLevel"
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <Button onClick={fetchLogs} disabled={loading.logs}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading.logs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={downloadLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <Separator />

              <ScrollArea className="h-96 w-full rounded border p-4">
                {logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground">
                            {log.timestamp || new Date().toISOString()}
                          </span>
                          {log.level && (
                            <Badge variant="outline" className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-foreground break-all">
                          {log.message || JSON.stringify(log)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs found. Click refresh to load logs.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Information
              </CardTitle>
              <CardDescription>
                Database connection status and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbInfo ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Connection Status</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(dbInfo.connection.status)}>
                          {getStatusIcon(dbInfo.connection.status)}
                          <span className="ml-1">{dbInfo.connection.status}</span>
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Time:</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(dbInfo.connection.current_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Table Statistics</h4>
                    <div className="grid gap-2">
                      {Object.entries(dbInfo.tables).map(([table, count]) => (
                        <div key={table} className="flex justify-between">
                          <span className="capitalize">{table}:</span>
                          <span className="text-sm text-muted-foreground">
                            {count === -1 ? 'N/A' : count.toLocaleString()} records
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Database Info</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Database Size:</span>
                        <span className="text-sm text-muted-foreground">{dbInfo.database_size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PostgreSQL Version:</span>
                        <span className="text-sm text-muted-foreground">
                          {dbInfo.connection.version}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchData('database', setDbInfo)}
                    disabled={loading.database}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading.database ? 'animate-spin' : ''}`} />
                    Load Database Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QuickBooks Tab */}
        <TabsContent value="quickbooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                QuickBooks Integration
              </CardTitle>
              <CardDescription>
                QuickBooks authentication and configuration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qboInfo ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Authentication Status</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex justify-between">
                        <span>Authenticated:</span>
                        <Badge className={getStatusColor(qboInfo.authenticated ? 'connected' : 'error')}>
                          {getStatusIcon(qboInfo.authenticated ? 'connected' : 'error')}
                          <span className="ml-1">{qboInfo.authenticated ? 'Yes' : 'No'}</span>
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Token Exists:</span>
                        <Badge className={getStatusColor(qboInfo.token_exists ? 'connected' : 'error')}>
                          {getStatusIcon(qboInfo.token_exists ? 'connected' : 'error')}
                          <span className="ml-1">{qboInfo.token_exists ? 'Yes' : 'No'}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {qboInfo.token_info && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Token Information</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex justify-between">
                            <span>Realm ID:</span>
                            <span className="text-sm text-muted-foreground">{qboInfo.token_info.realmId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(qboInfo.token_info.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(qboInfo.token_info.lastUpdated).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expires:</span>
                            <span className="text-sm text-muted-foreground">
                              {qboInfo.token_info.expiresAt ? new Date(qboInfo.token_info.expiresAt).toLocaleString() : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active:</span>
                            <Badge className={getStatusColor(qboInfo.token_info.isActive ? 'connected' : 'error')}>
                              {getStatusIcon(qboInfo.token_info.isActive ? 'connected' : 'error')}
                              <span className="ml-1">{qboInfo.token_info.isActive ? 'Yes' : 'No'}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Environment Configuration</h4>
                    <div className="grid gap-2">
                      {Object.entries(qboInfo.environment).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <Badge className={getStatusColor(value === 'configured' ? 'connected' : 'error')}>
                            {getStatusIcon(value === 'configured' ? 'connected' : 'error')}
                            <span className="ml-1">{value}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchData('quickbooks', setQboInfo)}
                    disabled={loading.quickbooks}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading.quickbooks ? 'animate-spin' : ''}`} />
                    Load QuickBooks Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Server system information and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemInfo ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">System Details</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="text-sm text-muted-foreground">{systemInfo.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Architecture:</span>
                        <span className="text-sm text-muted-foreground">{systemInfo.arch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Node Version:</span>
                        <span className="text-sm text-muted-foreground">{systemInfo.node_version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className="text-sm text-muted-foreground">{formatUptime(systemInfo.uptime)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Memory Usage</h4>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span>RSS:</span>
                        <span className="text-sm text-muted-foreground">{formatBytes(systemInfo.memory.rss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Total:</span>
                        <span className="text-sm text-muted-foreground">{formatBytes(systemInfo.memory.heapTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Used:</span>
                        <span className="text-sm text-muted-foreground">{formatBytes(systemInfo.memory.heapUsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>External:</span>
                        <span className="text-sm text-muted-foreground">{formatBytes(systemInfo.memory.external)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Environment Variables</h4>
                    <div className="grid gap-2">
                      {Object.entries(systemInfo.environment_variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <Badge className={getStatusColor(value === 'configured' ? 'connected' : 'error')}>
                            {getStatusIcon(value === 'configured' ? 'connected' : 'error')}
                            <span className="ml-1">{value}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {systemInfo.disk_usage && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Disk Usage</h4>
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {systemInfo.disk_usage}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchData('system', setSystemInfo)}
                    disabled={loading.system}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading.system ? 'animate-spin' : ''}`} />
                    Load System Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Data Sync Actions
                </CardTitle>
                <CardDescription>
                  Trigger manual data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All QuickBooks Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Sync Customers Only
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Sync Invoices Only
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Terminal className="h-4 w-4 mr-2" />
                  Sync Items Only
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Maintenance Actions
                </CardTitle>
                <CardDescription>
                  System maintenance and cleanup operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Old Logs
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Optimize Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Services
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
