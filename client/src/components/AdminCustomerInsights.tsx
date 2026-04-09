import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, DollarSign, Search, ExternalLink, Calendar, MapPin, Tag } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AdminCustomerInsights() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

  const { data: customers, isLoading: loadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const filteredCustomers = customers?.filter(c => 
    c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredTransactions = transactions?.filter(t => 
    t.bookingId?.toString().includes(transactionSearch) ||
    t.status?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Travel Intelligence</h2>
          <p className="text-muted-foreground">Comprehensive overview of your customers and financial performance.</p>
        </div>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer CRM
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Customer Profiles (360° View)</CardTitle>
                <CardDescription>Unified records linking visitors, searches, and bookings.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingCustomers ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Origin/Region</TableHead>
                      <TableHead>Customer Since</TableHead>
                      <TableHead className="text-right">Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{c.fullName || "Anonymous Guest"}</span>
                            <span className="text-xs text-muted-foreground">{c.email || "No email linked"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px]">{c.totalBookings || 0} Bookings</Badge>
                             <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${Math.min(100, (c.totalBookings || 0) * 20)}%` }} />
                             </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {c.region || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(c.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                           <Badge variant="secondary" className="font-mono text-[9px] truncate max-w-[60px]">
                             {c.visitorId ? `ID:${c.visitorId.substring(0,6)}` : "No Tracker"}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${transactions?.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
                <Tag className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions?.length ? Math.round((transactions.filter(t => t.status === 'succeeded').length / transactions.length) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Trans.</CardTitle>
                <Calendar className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions?.filter(t => t.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Global Ledger</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by booking ID or status..."
                  className="pl-8"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tx ID</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">#{tx.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                            #{tx.bookingId}
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell className="font-semibold">
                          {tx.currency} {parseFloat(tx.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tx.status === 'succeeded' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}
                            className={tx.status === 'succeeded' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
