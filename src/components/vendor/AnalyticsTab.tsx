import { Card, CardContent } from "@/components/ui/card";

interface Props {
  totalSales: number;
  productCount: number;
  orderCount: number;
  articleCount: number;
  videoCount: number;
}

export function AnalyticsTab({ totalSales, productCount, orderCount, articleCount, videoCount }: Props) {
  const stats = [
    { label: "Total Revenue", value: `$${totalSales.toFixed(2)}`, icon: "💰" },
    { label: "Products", value: productCount, icon: "📦" },
    { label: "Orders", value: orderCount, icon: "🛒" },
    { label: "Articles", value: articleCount, icon: "📝" },
    { label: "Videos", value: videoCount, icon: "🎬" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{s.icon} {s.label}</p>
              <h3 className="mt-2 text-3xl font-bold text-foreground">{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Quick Summary</h3>
          <p className="text-sm text-muted-foreground">
            Your store has generated <strong className="text-foreground">${totalSales.toFixed(2)}</strong> in total revenue
            across <strong className="text-foreground">{orderCount}</strong> orders. You have{" "}
            <strong className="text-foreground">{productCount}</strong> products listed,{" "}
            <strong className="text-foreground">{articleCount}</strong> articles published, and{" "}
            <strong className="text-foreground">{videoCount}</strong> videos uploaded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
