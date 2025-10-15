import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("alpha");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers with proper queryFn
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  // Fetch invoices with proper queryFn
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  // Fetch time entries with proper queryFn
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => api.getTimeEntries?.() || Promise.resolve({ data: [], success: true }),
  });

  // Filter customers based on search term
  const filteredCustomers = customers.data?.filter((customer: any) =>
    customer.displayname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.primaryemailaddr_address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "alpha") {
      return (a.displayname || "").localeCompare(b.displayname || "");
    } else if (sortBy === "reverse-alpha") {
      return (b.displayname || "").localeCompare(a.displayname || "");
    } else if (sortBy === "amount-owed") {
      return (b.balance || 0) - (a.balance || 0);
    } else if (sortBy === "last-invoice") {
      const dateA = new Date(a.metadata_lastupdatedtime || 0).getTime();
      const dateB = new Date(b.metadata_lastupdatedtime || 0).getTime();
      return dateB - dateA;
    }
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading customers</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="reverse-alpha">Reverse Alpha (Z-A)</SelectItem>
                <SelectItem value="amount-owed">Amount Owed (High to Low)</SelectItem>
                <SelectItem value="last-invoice">Last Invoice Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {paginatedCustomers.length > 0 ? (
          paginatedCustomers.map((customer: any) => (
            <Card key={customer.id} className="transition-shadow hover:shadow-md bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {customer.displayname || 'Unnamed Customer'}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {customer.primaryemailaddr_address && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {customer.primaryemailaddr_address}
                        </div>
                      )}
                      {customer.primaryphone_freeformnumber && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {customer.primaryphone_freeformnumber}
                        </div>
                      )}
                      {customer.billaddr_line1 && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {customer.billaddr_line1}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={customer.balance > 0 ? 'destructive' : 'default'}>
                      {customer.balance > 0 ? `$${customer.balance.toFixed(2)} Owed` : 'Paid Up'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredCustomers.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Show per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-24 bg-gray-700 text-white border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}
