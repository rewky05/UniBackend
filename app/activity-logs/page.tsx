'use client';

import { useState } from 'react';
import { useRealActivityLogs } from '@/hooks/useRealData';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDateTimeToText } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Upload,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const categories = ['All', 'Verification', 'Schedule', 'Document', 'Profile', 'System'];
const timeRanges = ['All Time', 'Today', 'This Week', 'This Month', 'Last 30 Days'];

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeRange, setSelectedTimeRange] = useState('All Time');
  const { activityLogs: logs, loading, error } = useRealActivityLogs();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading activity logs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-2">Failed to load activity logs</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.targetDoctor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.adminUser || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                           (log.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'verification':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
      case 'schedule':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400';
      case 'document':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'profile':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400';
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'verification':
        return <UserCheck className="h-3 w-3" />;
      case 'schedule':
        return <Calendar className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
      case 'profile':
        return <Edit className="h-3 w-3" />;
      case 'system':
        return <Settings className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Verified')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('Suspended')) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (action.includes('Updated')) return <Edit className="h-4 w-4 text-blue-600" />;
    if (action.includes('Uploaded')) return <Upload className="h-4 w-4 text-purple-600" />;
    if (action.includes('Deleted')) return <Trash2 className="h-4 w-4 text-red-600" />;
    return <Info className="h-4 w-4 text-gray-600" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return formatDateTimeToText(date);
    }
  };

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            <p className="text-muted-foreground">
              Track all administrative actions and system activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verifications
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.category === 'verification').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                This month
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Schedule Changes
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.category === 'schedule').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                This week
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(log => log.category === 'document').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Uploaded today
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities, doctors, or admins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Timeline ({filteredLogs.length})
            </CardTitle>
            <CardDescription>
              Chronological list of all administrative activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="group relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-border group-last:hidden" />
                  
                  {/* Activity Item */}
                  <div className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-background border-2 border-border rounded-full flex items-center justify-center relative z-10">
                      {getActionIcon(log.action)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-medium">{log.action}</h4>
                            <Badge className={getCategoryColor(log.category)}>
                              {getCategoryIcon(log.category)}
                              <span className="ml-1 capitalize">{log.category}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{log.adminUser}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{log.targetDoctor}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(log.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Activity Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this administrative action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium mb-2">Action Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center space-x-2">
                                        {getActionIcon(selectedLog.action)}
                                        <span className="font-medium">{selectedLog.action}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Badge className={getCategoryColor(selectedLog.category)}>
                                          {getCategoryIcon(selectedLog.category)}
                                          <span className="ml-1 capitalize">{selectedLog.category}</span>
                                        </Badge>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Performed By</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center space-x-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs">
                                            {selectedLog.adminUser.split(' ').map((n: string) => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{selectedLog.adminUser}</span>
                                      </div>
                                      <div className="text-muted-foreground">{selectedLog.adminEmail}</div>
                                      <div className="text-muted-foreground">IP: {selectedLog.ipAddress}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm bg-muted p-4 rounded-lg">
                                    {selectedLog.description}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Target Doctor</h4>
                                  <div className="text-sm">
                                    <div className="font-medium">{selectedLog.targetDoctor}</div>
                                    <div className="text-muted-foreground">ID: {selectedLog.targetDoctorId}</div>
                                  </div>
                                </div>

                                {selectedLog.details && (
                                  <div>
                                    <h4 className="font-medium mb-2">Additional Details</h4>
                                    <div className="bg-muted p-4 rounded-lg">
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}