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

interface Props {
  totalSales: number;
  productCount: number;
  orderCount: number;
  articleCount: number;
  videoCount: number;
}

export function AnalyticsTab({ totalSales, productCount, orderCount, articleCount, videoCount }: Props) {
  const stats = [
    { label: "Total Revenue", value: `$${totalSales.toFixed(2)}`, icon: "💰", color: "text-green-600" },
    { label: "Products", value: productCount, icon: "📦", color: "text-blue-600" },
    { label: "Orders", value: orderCount, icon: "🛒", color: "text-orange-600" },
    { label: "Articles", value: articleCount, icon: "📝", color: "text-purple-600" },
    { label: "Videos", value: videoCount, icon: "🎬", color: "text-red-600" },
  ];

  // Dummy data for trends (since we don't have historical sales in this state)
  const salesData = [
    { name: "Mon", sales: totalSales * 0.1 },
    { name: "Tue", sales: totalSales * 0.15 },
    { name: "Wed", sales: totalSales * 0.05 },
    { name: "Thu", sales: totalSales * 0.2 },
    { name: "Fri", sales: totalSales * 0.25 },
    { name: "Sat", sales: totalSales * 0.15 },
    { name: "Sun", sales: totalSales * 0.1 },
  ];

  const contentDist = [
    { name: "Products", value: productCount },
    { name: "Articles", value: articleCount },
    { name: "Videos", value: videoCount },
  ];

  const COLORS = ["#3b82f6", "#a855f7", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">{s.icon} {s.label}</p>
              <h3 className={`text-2xl font-black ${s.color}`}>{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Content Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4 text-xs">
              {contentDist.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-wellness-50">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Performance Summary
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your store is currently <strong className="text-foreground">Active</strong>. 
            In the last 30 days, you've reached <strong className="text-foreground">${totalSales.toFixed(2)}</strong> in total revenue.
            We recommend uploading at least <strong className="text-foreground">2 articles</strong> per week to boost your SEO and product visibility.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
