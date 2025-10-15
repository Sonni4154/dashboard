import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, Users, FileText, Settings, Calendar, LogOut, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function SimpleDashboard() {
  const { user, isAuthenticated, token } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('stack-auth-token');
    window.location.href = '/login';
  };

  const handleQuickBooksRefresh = async () => {
    try {
      const response = await fetch('/api/qbo/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        alert('QuickBooks token refreshed successfully!');
      } else {
        alert('QuickBooks token refresh failed');
      }
    } catch (error) {
      alert('Error refreshing QuickBooks token');
    }
  };

  const getQuickBooksStatus = async () => {
    try {
      const response = await fetch('/api/qbo/token-status');
      const result = await response.json();
      console.log('QuickBooks Status:', result);
      return result;
    } catch (error) {
      console.error('Error getting QuickBooks status:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Marin Pest Control</h1>
              <Badge variant="secondary">Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName || 'User'}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* QuickBooks Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              QuickBooks Integration Status
            </CardTitle>
            <CardDescription>
              Monitor and manage QuickBooks OAuth tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button onClick={getQuickBooksStatus} variant="outline">
                Check Status
              </Button>
              <Button onClick={handleQuickBooksRefresh} variant="default">
                Refresh Token
              </Button>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Time Tracking */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time Tracking
              </CardTitle>
              <CardDescription>
                Clock in/out and track hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/time-tracking">
                <Button className="w-full">Open Time Tracking</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Customers
              </CardTitle>
              <CardDescription>
                Manage customer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/customers">
                <Button className="w-full">View Customers</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoices
              </CardTitle>
              <CardDescription>
                Create and manage invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/invoices">
                <Button className="w-full">View Invoices</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Products */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Products & Services
              </CardTitle>
              <CardDescription>
                Manage products and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/products">
                <Button className="w-full">View Products</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule
              </CardTitle>
              <CardDescription>
                View and manage schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/employee-schedule">
                <Button className="w-full">View Schedule</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button className="w-full">Open Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Current authentication and token status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user?.firstName} {user?.lastName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Token:</strong> {token ? 'Present' : 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
