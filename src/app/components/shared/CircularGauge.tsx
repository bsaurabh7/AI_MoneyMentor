import React, { useEffect, useState } from 'react';

interface CircularGaugeProps {
  score: number;
}

export function CircularGauge({ score }: CircularGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Dimensions and SVG math
  const size = 180;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981'; // emerald-500
    if (s >= 60) return '#F59E0B'; // amber-500
    if (s >= 40) return '#F97316'; // orange-500
    return '#EF4444'; // red-500
  };

  const color = getScoreColor(score);

  // Animate the gauge on mount
  useEffect(() => {
    // Slight delay for smooth animation after render
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Circular Gauge */}
      <svg
        className="transform -rotate-90 w-full h-full drop-shadow-sm"
        width={size}
        height={size}
      >
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-[#0F172A] transition-colors duration-500">
          {Math.round(score)}
        </span>
        <span className="text-sm font-medium text-[#64748B] uppercase tracking-wide mt-1">
          Out of 100
        </span>
      </div>
    </div>
  );
}