"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownProps {
  targetDate: string | Date;
}

export const Countdown = ({ targetDate }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<any>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeftObj = null;

      if (difference > 0) {
        timeLeftObj = {
          dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
          horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
          min: Math.floor((difference / 1000 / 60) % 60),
          seg: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeftObj;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center justify-center gap-2">
        <Clock className="text-orange-500 animate-pulse" size={18} />
        <span className="text-orange-500 font-black uppercase text-[10px] tracking-widest italic">
          Sorteio em Processamento!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-[#121826] border border-slate-800 p-3 rounded-2xl flex gap-4 shadow-xl">
        <TimeUnit value={timeLeft.dias} label="Dias" />
        <span className="text-slate-700 font-black self-center mt-[-10px]">:</span>
        <TimeUnit value={timeLeft.horas} label="Hrs" />
        <span className="text-slate-700 font-black self-center mt-[-10px]">:</span>
        <TimeUnit value={timeLeft.min} label="Min" />
        <span className="text-slate-700 font-black self-center mt-[-10px]">:</span>
        <TimeUnit value={timeLeft.seg} label="Seg" color="text-blue-500" />
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label, color = "text-white" }: any) => (
  <div className="flex flex-col items-center">
    <span className={cn("text-xl font-black italic tracking-tighter leading-none", color)}>
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter mt-1">{label}</span>
  </div>
);