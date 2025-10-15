import React, { useState, useEffect } from 'react';
import { Clock, Timer, Plus, User, Calendar, DollarSign } from 'lucide-react';

interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration: string;
  amount: number;
  date: string;
}

interface WeeklySummary {
  hoursThisWeek: number;
  payRate: number;
  earnings: number;
}

const TimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      startTime: '9:00 AM',
      endTime: '9:00 AM',
      duration: '10 min',
      amount: 0,
      date: 'Today'
    },
    {
      id: '2',
      startTime: '9:00 AM',
      endTime: '6:00 AM',
      duration: '03:45',
      amount: 247.50,
      date: 'Yesterday'
    },
    {
      id: '3',
      startTime: '6:00 AM',
      endTime: '9:00 AM',
      duration: '23.75',
      amount: 247.50,
      date: 'Thursday'
    }
  ]);

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({
    hoursThisWeek: 32.75,
    payRate: 20.00,
    earnings: 655.00
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update current duration when clocked in
  useEffect(() => {
    if (isClockedIn && clockInTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - clockInTime.getTime();
        setCurrentDuration(Math.floor(diff / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isClockedIn, clockInTime]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    setIsClockedIn(true);
    setClockInTime(new Date());
    setCurrentDuration(0);
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setClockInTime(null);
    setCurrentDuration(0);
    
    // Add new entry to recent entries
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      startTime: clockInTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) || '',
      endTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: formatDuration(currentDuration),
      amount: (currentDuration / 3600) * weeklySummary.payRate,
      date: 'Today'
    };
    
    setRecentEntries(prev => [newEntry, ...prev.slice(0, 2)]);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Time Tracking</h1>
          <p className="text-gray-300">Clock in/out and manage your time entries</p>
        </div>

        {/* Top Row Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Time Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-6 h-6 mr-3 text-blue-400" />
              <h2 className="text-xl font-semibold">Current Time</h2>
            </div>
            <div className="text-3xl font-mono mb-2">{formatTime(currentTime)}</div>
            <div className="text-gray-300 mb-4">{formatDate(currentTime)}</div>
            <div className="inline-block bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
              {isClockedIn ? 'Clocked In' : 'Clocked Out'}
            </div>
          </div>

          {/* Time Clock Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Timer className="w-6 h-6 mr-3 text-blue-400" />
              <h2 className="text-xl font-semibold">Time Clock</h2>
            </div>
            
            {isClockedIn ? (
              <>
                <div className="text-4xl font-mono mb-4 text-green-400">
                  {formatDuration(currentDuration)}
                </div>
                <div className="flex justify-between text-sm text-gray-300 mb-6">
                  <span>Next Job: Start in 10min</span>
                  <span className="text-green-400">${((currentDuration / 3600) * weeklySummary.payRate).toFixed(2)}</span>
                </div>
                <button
                  onClick={handleClockOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-colors"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent mr-2"></div>
                  Clock Out
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl font-mono mb-4 text-gray-400">
                  00:00:00
                </div>
                <div className="flex justify-between text-sm text-gray-300 mb-6">
                  <span>Ready to start work</span>
                  <span className="text-gray-400">$0.00</span>
                </div>
                <button
                  onClick={handleClockIn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-colors"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent mr-2"></div>
                  Clock In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Add Hours and Materials Button */}
        <div className="mb-6">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Add Hours and Materials
          </button>
        </div>

        {/* Bottom Row Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Time Entries */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Time Entries</h2>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{entry.date}</span>
                      <span className="text-gray-400">{entry.startTime} - {entry.endTime}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center w-32 ml-4">
                    <span className="text-sm text-gray-300">{entry.duration}</span>
                    <span className="text-sm font-semibold text-green-400">${entry.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Weekly Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Hours This Week</span>
                <span className="text-2xl font-bold text-blue-400">{weeklySummary.hoursThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pay Rate</span>
                <span className="text-lg font-semibold">${weeklySummary.payRate.toFixed(2)}/h</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                <span className="text-gray-300">Earnings</span>
                <span className="text-2xl font-bold text-green-400">${weeklySummary.earnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClock;
