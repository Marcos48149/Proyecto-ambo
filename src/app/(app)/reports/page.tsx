'use client';

import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const topProductsData = [
  { product: 'Refresco Cola', sales: 186, fill: 'var(--color-cola)' },
  { product: 'Papas Fritas', sales: 120, fill: 'var(--color-papas)' },
  { product: 'Pan de Molde', sales: 98, fill: 'var(--color-pan)' },
  { product: 'Agua Mineral', sales: 87, fill: 'var(--color-agua)' },
  { product: 'Chocolate Amargo', sales: 73, fill: 'var(--color-chocolate)' },
];

const topProductsConfig = {
  sales: {
    label: 'Sales',
  },
  cola: {
    label: 'Refresco Cola',
    color: 'hsl(var(--chart-1))',
  },
  papas: {
    label: 'Papas Fritas',
    color: 'hsl(var(--chart-2))',
  },
  pan: {
    label: 'Pan de Molde',
    color: 'hsl(var(--chart-3))',
  },
  agua: {
    label: 'Agua Mineral',
    color: 'hsl(var(--chart-4))',
  },
  chocolate: {
    label: 'Chocolate Amargo',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

const salesByCategoryData = [
  { category: 'Bebidas', sales: 4540, fill: 'var(--color-bebidas)' },
  { category: 'Snacks', sales: 2980, fill: 'var(--color-snacks)' },
  { category: 'Almacén', sales: 3250, fill: 'var(--color-almacen)' },
  { category: 'Panadería', sales: 1520, fill: 'var(--color-panaderia)' },
  { category: 'Lácteos', sales: 980, fill: 'var(--color-lacteos)' },
];

const salesByCategoryConfig = {
  sales: {
    label: 'Sales ($)',
  },
  bebidas: {
    label: 'Bebidas',
    color: 'hsl(var(--chart-1))',
  },
  snacks: {
    label: 'Snacks',
    color: 'hsl(var(--chart-2))',
  },
  almacen: {
    label: 'Almacén',
    color: 'hsl(var(--chart-3))',
  },
  panaderia: {
    label: 'Panadería',
    color: 'hsl(var(--chart-4))',
  },
  lacteos: {
    label: 'Lácteos',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze your sales and product performance."
      >
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Units sold in the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topProductsConfig} className="h-80 w-full">
              <BarChart
                accessibilityLayer
                data={topProductsData}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <YAxis
                  dataKey="product"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs"
                  width={110}
                />
                <XAxis dataKey="sales" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="sales" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>
              Revenue distribution in the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={salesByCategoryConfig}
              className="mx-auto aspect-square h-80"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={salesByCategoryData}
                  dataKey="sales"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {salesByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="category" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
