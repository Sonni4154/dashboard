import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, DollarSign, Calendar, User, Package, Edit, Trash2, Send } from "lucide-react";
import { CustomerAutocompleteInput } from "@/components/ui/customer-autocomplete";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Invoice form schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  items: z.array(z.object({
    description: z.string().min(1, "Item description is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
    total: z.coerce.number()
  })).min(1, "At least one item is required"),
  subtotal: z.coerce.number(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxAmount: z.coerce.number(),
  totalAmount: z.coerce.number()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "by-customer" | "by-product">("all");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: "draft",
      taxRate: 0,
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
    }
  });

  // Queries with proper data extraction
  const { data: invoicesResponse = { data: [] }, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: () => api.getInvoices(),
  });
  const invoices = invoicesResponse?.data || [];

  const { data: customersResponse = { data: [] } } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => api.getCustomers(),
  });
  const customers = customersResponse?.data || [];

  const { data: productsResponse = { data: [] } } = useQuery({
    queryKey: ["/api/products"],
    queryFn: () => api.getItems(),
  });
  const products = productsResponse?.data || [];

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = !searchQuery || 
      invoice.docnumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerref_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "paid" && invoice.balance === 0) ||
      (statusFilter === "unpaid" && invoice.balance > 0);
    const matchesCustomer = selectedCustomer === "all" || invoice.customerref_value === selectedCustomer;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (sortBy === "amount-desc") {
      return (b.totalamt || b.balance || 0) - (a.totalamt || a.balance || 0);
    } else if (sortBy === "amount-asc") {
      return (a.totalamt || a.balance || 0) - (b.totalamt || b.balance || 0);
    } else if (sortBy === "date-desc") {
      const dateA = new Date(a.txndate || a.metadata_lastupdatedtime || 0).getTime();
      const dateB = new Date(b.txndate || b.metadata_lastupdatedtime || 0).getTime();
      return dateB - dateA;
    } else if (sortBy === "date-asc") {
      const dateA = new Date(a.txndate || a.metadata_lastupdatedtime || 0).getTime();
      const dateB = new Date(b.txndate || b.metadata_lastupdatedtime || 0).getTime();
      return dateA - dateB;
    }
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and billing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <p className="text-center text-slate-500">Invoice creation form will be implemented here</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {paginatedInvoices.length > 0 ? (
          paginatedInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="transition-shadow hover:shadow-md bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {invoice.customerref_name || 'Unknown Customer'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Invoice #{invoice.docnumber || invoice.id}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-medium text-foreground">${invoice.totalamt?.toFixed(2) || invoice.balance?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {invoice.txndate ? format(new Date(invoice.txndate), 'MMM dd, yyyy') : invoice.metadata_lastupdatedtime ? format(new Date(invoice.metadata_lastupdatedtime), 'MMM dd, yyyy') : 'No date'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invoice.balance > 0 ? 'destructive' : 'default'}>
                      {invoice.balance > 0 ? 'Unpaid' : 'Paid'}
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
                {searchQuery ? 'No invoices found matching your search.' : 'No invoices found.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {sortedInvoices.length > 0 && (
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground">Show per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedInvoices.length)} of {sortedInvoices.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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
