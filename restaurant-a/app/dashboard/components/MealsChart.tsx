'use client';

import React from "react";
import { useTheme } from "next-themes";
import { Meal } from "@/app/menu/entities/Dish";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MealsChartProps {
  meals: Meal[];
  category: string;
  loading: boolean;
}
const MealsChart = ({meals,category,loading}:MealsChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // گرفتن داده‌ها از hook
 

  // آماده‌سازی داده‌ها برای نمودار
  const chartData = meals.map(meal => ({
    name: meal.title,
    price: meal.price,
  }));

  if (loading) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center tracking-widest uppercase">Loading chart...</p>
    );
  }

  return (
    <Card className={`shadow-none border rounded-2xl ${
      isDark
        ? 'border-slate-800 bg-transparent'
        : 'border-slate-800 bg-slate-900/30'
    }`}>
      <CardHeader className="pb-0">
        <CardTitle className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Meals Pricing
        </CardTitle>
        <CardDescription className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Current prices by dish
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? "#374151" : "#e0e0e0"} 
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDark ? "#d1d5db" : "#555" }} 
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: isDark ? "#d1d5db" : "#555" }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "white",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #374151" : "1px solid #ddd",
                  color: isDark ? "#f9fafb" : "#000",
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={30}
                wrapperStyle={{ color: isDark ? "#d1d5db" : "#555" }}
              />

              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <Line
                type="monotone"
                dataKey="price"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ 
                  r: 5, 
                  strokeWidth: 2, 
                  stroke: "#4f46e5", 
                  fill: isDark ? "#1f2937" : "white" 
                }}
                activeDot={{ r: 7 }}
                fill="url(#colorPrice)"
                name="Price ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MealsChart;
