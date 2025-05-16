'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Parse the targetDate string to create a more robust local Date object
    // Assuming targetDate is in YYYY-MM-DDTHH:mm:ss format
    const year = parseInt(targetDate.substring(0, 4), 10);
    const month = parseInt(targetDate.substring(5, 7), 10) - 1; // Month is 0-indexed
    const day = parseInt(targetDate.substring(8, 10), 10);
    // You can also parse hours, minutes, seconds if needed, but for start of day:
    const launchDate = new Date(year, month, day, 0, 0, 0); // Explicitly set to start of local day

    const calculateTimeLeft = () => {
      const difference = launchDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        // If countdown is finished, show 0s.
        // The behavior of resetting to 30 days is removed as the targetDate is fixed.
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // initial call

    return () => clearInterval(timer);
  }, [targetDate]); // Add targetDate to dependency array

  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((unit, index) => (
        <div key={index} className="text-center animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {unit.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-sm sm:text-base text-gray-600 mt-2 block">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
} 