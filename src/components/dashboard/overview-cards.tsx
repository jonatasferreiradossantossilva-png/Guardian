import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { overviewStats } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewStats.map((stat, index) => (
        <Card key={index} className="border-secondary hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={cn(
                "flex items-center gap-1",
                stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
              )}>
                {stat.changeType === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {stat.change}
              </span>
              em relação a ontem
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
