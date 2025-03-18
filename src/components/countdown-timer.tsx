'use client';

import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Get the stored launch date or set a new one
    const getLaunchDate = () => {
      const storedDate = localStorage.getItem('launchDate');
      if (storedDate) {
        return new Date(storedDate);
      }
      // Set launch date to 30 days from now if not stored
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 30);
      localStorage.setItem('launchDate', newDate.toISOString());
      return newDate;
    };

    const launchDate = getLaunchDate();

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
        // If countdown is finished, reset it to 30 days from now
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 30);
        localStorage.setItem('launchDate', newDate.toISOString());
        setTimeLeft({
          days: 30,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, []);

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