'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export function RoiCalculator() {
  const [monthlySales, setMonthlySales] = useState<number>(5000);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(85);

  // LMG: No monthly fees, 15% commission
  const lmgCommission = 0.15;
  const lmgFees = monthlySales * lmgCommission;
  const lmgTakeHome = monthlySales - lmgFees;

  // Traditional Wholesale: 50% margin
  const wholesaleMargin = 0.50;
  const wholesaleTakeHome = monthlySales * wholesaleMargin;

  // Typical Marketplace (e.g. Amazon): $50/mo + 15% commission + ad spend (~10%)
  const typicalAdSpend = monthlySales * 0.10;
  const typicalTakeHome = monthlySales - (monthlySales * 0.15) - typicalAdSpend - 50;

  return (
    <section className="py-24 bg-surface relative overflow-hidden border-y border-border/50">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-wellness/5 rounded-l-full blur-3xl -z-10" />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-wellness border-wellness/30 bg-wellness/5">
            Vendor Profitability
          </Badge>
          <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Calculate Your ROI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            See how much more you keep when you sell through the Lifestyle Medicine Gateway compared to traditional channels.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-10">
            <Card className="border border-border/50 shadow-soft bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Expected Monthly Sales
                    </label>
                    <span className="text-2xl font-black text-primary">${monthlySales.toLocaleString()}</span>
                  </div>
                  <Slider
                    value={[monthlySales]}
                    min={1000}
                    max={50000}
                    step={1000}
                    onValueChange={(val) => setMonthlySales(val[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>$1k</span>
                    <span>$50k+</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Average Order Value
                    </label>
                    <span className="text-2xl font-black text-primary">${averageOrderValue}</span>
                  </div>
                  <Slider
                    value={[averageOrderValue]}
                    min={20}
                    max={300}
                    step={5}
                    onValueChange={(val) => setAverageOrderValue(val[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>$20</span>
                    <span>$300</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Comparison */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-3 gap-4 h-full items-end">
              
              {/* Traditional Wholesale */}
              <div className="bg-muted/30 rounded-3xl p-6 text-center border border-border/50 relative overflow-hidden group hover:border-border transition-colors">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Traditional Retail</p>
                  <p className="text-[10px] text-muted-foreground">50% Wholesale Margin</p>
                </div>
                <div className="h-48 flex items-end justify-center mb-6">
                  <div 
                    className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-xl transition-all duration-500 ease-out" 
                    style={{ height: `${(wholesaleTakeHome / monthlySales) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">You Keep</p>
                <p className="text-2xl font-bold text-foreground">${wholesaleTakeHome.toLocaleString()}</p>
              </div>

              {/* Typical Marketplace */}
              <div className="bg-muted/30 rounded-3xl p-6 text-center border border-border/50 relative overflow-hidden group hover:border-border transition-colors">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Other Marketplaces</p>
                  <p className="text-[10px] text-muted-foreground">Fees + Required Ad Spend</p>
                </div>
                <div className="h-48 flex items-end justify-center mb-6">
                  <div 
                    className="w-full bg-slate-300 dark:bg-slate-700 rounded-t-xl transition-all duration-500 ease-out" 
                    style={{ height: `${(typicalTakeHome / monthlySales) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">You Keep</p>
                <p className="text-2xl font-bold text-foreground">${typicalTakeHome.toLocaleString()}</p>
              </div>

              {/* LMG */}
              <div className="bg-gradient-to-t from-primary/5 to-primary/10 rounded-3xl p-6 text-center border-2 border-primary shadow-xl shadow-primary/10 relative overflow-hidden scale-105 z-10">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-bl-xl">
                  Best Value
                </div>
                <div className="mb-4 mt-2">
                  <p className="text-xs font-black uppercase tracking-wider text-primary mb-1">LMG</p>
                  <p className="text-[10px] text-primary/70 font-semibold">Only 15% Success Fee</p>
                </div>
                <div className="h-48 flex items-end justify-center mb-6">
                  <div 
                    className="w-full bg-primary rounded-t-xl transition-all duration-500 ease-out shadow-[0_0_20px_rgba(107,142,35,0.4)]" 
                    style={{ height: `${(lmgTakeHome / monthlySales) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-primary/80 font-bold mb-1">You Keep</p>
                <p className="text-3xl font-black text-primary">${lmgTakeHome.toLocaleString()}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
