import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isSameDay,
} from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CalendarPage: React.FC = () => {
  const { data } = useData();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');

  // Calendar navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Get days of the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Map journal entries and emotions to days
  const dayMap = daysInMonth.reduce((acc, day) => {
    const dateString = format(day, 'yyyy-MM-dd');
    acc[dateString] = {
      date: day,
      journalEntry: data.journalEntries.find(entry => entry.date === dateString),
      emotions: [] as { id: string; isPositive: boolean }[],
    };
    return acc;
  }, {} as Record<string, { date: Date; journalEntry: any; emotions: { id: string; isPositive: boolean }[] }>);

  // Fill in emotion data
  data.journalEntries.forEach(entry => {
    if (dayMap[entry.date]) {
      entry.emotions.forEach(emotionId => {
        const emotion = data.emotions.find(e => e.id === emotionId);
        if (emotion) {
          dayMap[entry.date].emotions.push({ id: emotionId, isPositive: emotion.isPositive });
        }
      });
    }
  });

  // Handle calendar day click
  const handleDayClick = (dateString: string) => {
    const entry = data.journalEntries.find(entry => entry.date === dateString);
    if (entry) {
      navigate('/journal');
    }
  };

  // Calculate stats for charts
  const emotionCounts = data.emotions.reduce((acc, emotion) => {
    acc[emotion.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  data.journalEntries.forEach(entry => {
    entry.emotions.forEach(emotionId => {
      if (emotionCounts[emotionId] !== undefined) {
        emotionCounts[emotionId]++;
      }
    });
  });

  // Prepare chart data for emotions
  const emotionChartData = {
    labels: data.emotions.map(emotion => `${emotion.emoji} ${emotion.name}`),
    datasets: [
      {
        label: 'Times Experienced',
        data: data.emotions.map(emotion => emotionCounts[emotion.id] || 0),
        backgroundColor: data.emotions.map(emotion => 
          emotion.isPositive ? 'rgba(75, 255, 75, 0.6)' : 'rgba(255, 75, 75, 0.6)'
        ),
        borderColor: data.emotions.map(emotion => 
          emotion.isPositive ? 'rgb(75, 192, 75)' : 'rgb(192, 75, 75)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Calculate positive vs negative days
  const emotionDays = {
    positive: 0,
    negative: 0,
    mixed: 0,
  };

  Object.values(dayMap).forEach(day => {
    const hasPositive = day.emotions.some(e => e.isPositive);
    const hasNegative = day.emotions.some(e => !e.isPositive);
    
    if (hasPositive && hasNegative) emotionDays.mixed++;
    else if (hasPositive) emotionDays.positive++;
    else if (hasNegative) emotionDays.negative++;
  });

  // Prepare chart data for emotion days
  const emotionDaysChartData = {
    labels: ['Positive Days', 'Negative Days', 'Mixed Days'],
    datasets: [
      {
        label: 'Day Distribution',
        data: [emotionDays.positive, emotionDays.negative, emotionDays.mixed],
        backgroundColor: [
          'rgba(75, 255, 75, 0.6)',
          'rgba(255, 75, 75, 0.6)',
          'rgba(180, 180, 180, 0.6)',
        ],
        borderColor: [
          'rgb(75, 192, 75)',
          'rgb(192, 75, 75)',
          'rgb(150, 150, 150)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Days of the week header
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Calendar & Stats</h1>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-6 font-medium ${
            activeTab === 'calendar'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`py-2 px-6 font-medium ${
            activeTab === 'stats'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={prevMonth}
            >
              &lt;
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={nextMonth}
            >
              &gt;
            </button>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Days of the week header */}
            {daysOfWeek.map(day => (
              <div 
                key={day} 
                className="text-center font-medium p-2"
              >
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: startDay }).map((_, index) => (
              <div key={`empty-${index}`} className="p-2" />
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map(day => {
              const dateString = format(day, 'yyyy-MM-dd');
              const dayData = dayMap[dateString];
              const hasJournal = dayData?.journalEntry != null;
              const hasPositive = dayData?.emotions.some(e => e.isPositive);
              const hasNegative = dayData?.emotions.some(e => !e.isPositive);
              
              return (
                <button
                  key={dateString}
                  className={`h-14 relative rounded-md flex flex-col items-center justify-center border transition-colors ${
                    isToday(day) 
                      ? 'border-primary font-bold' 
                      : hasJournal 
                      ? 'border-gray-300' 
                      : 'border-transparent hover:border-gray-200'
                  } ${hasPositive && hasNegative ? 'bg-purple-50' : hasPositive ? 'bg-green-50' : hasNegative ? 'bg-red-50' : ''}`}
                  onClick={() => handleDayClick(dateString)}
                >
                  <span>{format(day, 'd')}</span>
                  <div className="flex space-x-1 mt-1">
                    {hasJournal && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    )}
                    {hasPositive && (
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                    )}
                    {hasNegative && (
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2" />
              <span>Journal Entry</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2" />
              <span>Positive Emotion</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-400 rounded-full mr-2" />
              <span>Negative Emotion</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics View */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Emotion Distribution</h3>
            <div className="h-80">
              <Bar 
                data={emotionChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Day Types</h3>
            <div className="h-80">
              <Bar 
                data={emotionDaysChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Stats Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <div className="text-4xl font-bold text-center">
                  {data.journalEntries.length}
                </div>
                <div className="text-center text-gray-600">Journal Entries</div>
              </div>
              <div className="bg-green-100 p-4 rounded-md">
                <div className="text-4xl font-bold text-center">
                  {emotionDays.positive}
                </div>
                <div className="text-center text-gray-600">Positive Days</div>
              </div>
              <div className="bg-red-100 p-4 rounded-md">
                <div className="text-4xl font-bold text-center">
                  {emotionDays.negative}
                </div>
                <div className="text-center text-gray-600">Negative Days</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 