import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { CheckCircle2, TrendingUp, Package, ShoppingCart, FileText, Play } from "lucide-react";

interface OrderItem { 
  price: number; 
  quantity: number; 
  created_at: string;
}

interface Props {
  totalSales: number;
  productCount: number;
  orderCount: number;
  articleCount: number;
  videoCount: number;
  orderItems: OrderItem[];
}

export function AnalyticsTab({ totalSales, productCount, orderCount, articleCount, videoCount, orderItems }: Props) {
  const stats = [
    { label: "Total Revenue", value: `$${totalSales.toFixed(2)}`, icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-50" },
    { label: "Products", value: productCount, icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "Orders", value: orderCount, icon: ShoppingCart, color: "text-orange-600", bgColor: "bg-orange-50" },
    { label: "Articles", value: articleCount, icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
    { label: "Videos", value: videoCount, icon: Play, color: "text-red-600", bgColor: "bg-red-50" },
  ];

  // Calculate real historical sales data from orderItems
  const salesData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    
    // Initialize last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dateStr: d.toISOString().split('T')[0],
        sales: 0
      };
    });

    // Fill with real data
    if (orderItems && Array.isArray(orderItems)) {
      orderItems.forEach(item => {
        if (item && item.created_at) {
          const itemDateStr = item.created_at.split('T')[0];
          const dayData = last7Days.find(d => d.dateStr === itemDateStr);
          if (dayData) {
            dayData.sales += (Number(item.price || 0) * Number(item.quantity || 0));
          }
        }
      });
    }

    return last7Days;
  }, [orderItems]);

  const contentDist = [
    { name: "Products", value: productCount },
    { name: "Articles", value: articleCount },
    { name: "Videos", value: videoCount },
  ];

  const COLORS = ["#3b82f6", "#a855f7", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${s.bgColor}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{s.label}</p>
              <h3 className="text-xl font-black mt-1 truncate">{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "#94a3b8" }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "1px solid #f1f5f9", 
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontSize: "12px"
                  }}
                  formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Revenue"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Content Strategy</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {contentDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {contentDist.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-primary/5 border-primary/10">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Performance Insight
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your store is currently <strong className="text-foreground">Active</strong>. 
            In the last 7 days, you've generated <strong className="text-foreground">${salesData.reduce((sum, d) => sum + d.sales, 0).toFixed(2)}</strong> from transactions.
            {articleCount < 5 && (
              <> We recommend uploading at least <strong className="text-foreground">2 articles</strong> per week to boost your SEO and product visibility.</>
            )}
            {orderCount > 0 && (
              <> Your average order value is <strong className="text-foreground">${(totalSales / orderCount).toFixed(2)}</strong>.</>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
