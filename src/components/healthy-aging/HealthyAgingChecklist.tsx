"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

const checklistItems = [
  { id: "veg", label: "Eat vegetables daily" },
  { id: "walk", label: "Walk 30 minutes" },
  { id: "hydrate", label: "Stay hydrated" },
  { id: "stress", label: "Practice stress management" },
  { id: "social", label: "Connect with friends or family" },
  { id: "sleep", label: "Follow a sleep routine" },
];

export function HealthyAgingChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Left Text */}
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-teal-900">
              Your Daily Healthy Aging Checklist
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Small daily habits compound into massive long-term results. Use this interactive checklist to track your foundational lifestyle medicine habits today.
            </p>
            <div className="bg-sage-50 p-6 rounded-xl border border-sage-100 flex items-start gap-4">
              <Trophy className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <h4 className="font-semibold text-teal-900 mb-1">Consistency is Key</h4>
                <p className="text-sm text-gray-600">
                  You don't have to be perfect. Aim to check off at least 4 items every day for noticeable improvements in energy and mood.
                </p>
              </div>
            </div>
          </div>

          {/* Right Interactive Box */}
          <div className="flex-1 w-full max-w-md bg-white shadow-xl shadow-teal-900/5 rounded-2xl border border-gray-100 p-8">
            <div className="mb-6">
              <div className="flex justify-between text-sm font-semibold text-teal-900 mb-2">
                <span>Daily Progress</span>
                <span>{completedCount} of {checklistItems.length}</span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-gray-100 [&>div]:bg-teal-600" />
            </div>

            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    checkedItems[item.id] ? "bg-teal-50 border-teal-200" : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox 
                    id={item.id} 
                    checked={!!checkedItems[item.id]} 
                    onCheckedChange={() => toggleItem(item.id)} 
                    className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 w-5 h-5"
                  />
                  <label 
                    htmlFor={item.id} 
                    className={`flex-1 text-sm font-medium cursor-pointer ${
                      checkedItems[item.id] ? "text-teal-900 line-through opacity-70" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            
            {progressPercentage === 100 && (
              <div className="mt-6 text-center text-sm font-medium text-green-600 bg-green-50 py-2 rounded-md animate-in fade-in zoom-in duration-300">
                🎉 Perfect score today! Keep it up!
              </div>
            )}
          </div>
          
        </div>
      </div>
    </section>
  );
}
