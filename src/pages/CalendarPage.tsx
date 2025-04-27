import React, { useState, useRef } from 'react';
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

interface EmotionCount {
  emoji: string;
  name: string;
  count: number;
  isPositive: boolean;
}

const CalendarPage: React.FC = () => {
  const { data } = useData();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');
  const [hoverDayInfo, setHoverDayInfo] = useState<{
    date: string;
    emotions: EmotionCount[];
    position: { x: number; y: number };
  } | null>(null);
  
  // Ref for tooltip positioning
  const calendarRef = useRef<HTMLDivElement>(null);

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
      emotions: [] as { id: string; isPositive: boolean; emoji: string; name: string }[],
      emotionCounts: {} as Record<string, EmotionCount>,
    };
    return acc;
  }, {} as Record<string, { 
    date: Date; 
    journalEntry: any; 
    emotions: { id: string; isPositive: boolean; emoji: string; name: string }[];
    emotionCounts: Record<string, EmotionCount>;
  }>);

  // Fill in emotion data from emotionRecords
  data.journalEntries.forEach(entry => {
    if (dayMap[entry.date]) {
      // Process each emotion record
      entry.emotionRecords.forEach(record => {
        const emotion = data.emotions.find(e => e.id === record.emotionId);
        if (emotion) {
          // Add to emotions array
          dayMap[entry.date].emotions.push({ 
            id: record.emotionId, 
            isPositive: emotion.isPositive,
            emoji: emotion.emoji,
            name: emotion.name
          });
          
          // Count emotions for tooltip
          if (!dayMap[entry.date].emotionCounts[record.emotionId]) {
            dayMap[entry.date].emotionCounts[record.emotionId] = {
              emoji: emotion.emoji,
              name: emotion.name,
              count: 1,
              isPositive: emotion.isPositive
            };
          } else {
            dayMap[entry.date].emotionCounts[record.emotionId].count++;
          }
        }
      });
    }
  });

  // Handle calendar day click
  const handleDayClick = (dateString: string) => {
    // Navigate to journal page 
    navigate('/journal');
    // We could also pass the date as a parameter or through state
    // For now we'll just navigate to the journal page
  };
  
  // Handle day hover
  const handleDayHover = (dateString: string, event: React.MouseEvent) => {
    const dayData = dayMap[dateString];
    if (dayData && Object.keys(dayData.emotionCounts).length > 0) {
      // Get mouse position relative to calendar container
      const rect = calendarRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Create array of emotions with counts
        const emotions = Object.values(dayData.emotionCounts)
          .sort((a, b) => b.count - a.count); // Sort by count, highest first
        
        setHoverDayInfo({
          date: dateString,
          emotions,
          position: { x, y }
        });
      }
    }
  };
  
  // Handle mouse leave
  const handleDayLeave = () => {
    setHoverDayInfo(null);
  };

  // Calculate stats for charts
  const emotionCounts = data.emotions.reduce((acc, emotion) => {
    acc[emotion.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  // Count emotions from emotionRecords
  data.journalEntries.forEach(entry => {
    entry.emotionRecords.forEach(record => {
      if (emotionCounts[record.emotionId] !== undefined) {
        emotionCounts[record.emotionId]++;
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
    <div className="max-w-4xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Calendar & Stats</h1>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-700">
        <button
          className={`py-2 px-6 font-medium ${
            activeTab === 'calendar'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`py-2 px-6 font-medium ${
            activeTab === 'stats'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 relative" ref={calendarRef}>
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-6">
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300"
              onClick={prevMonth}
            >
              &lt;
            </button>
            <h2 className="text-xl font-semibold text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300"
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
                className="text-center font-medium p-2 text-gray-300"
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
              const emotionCount = dayData?.emotions.length || 0;
              
              return (
                <button
                  key={dateString}
                  className={`h-14 relative rounded-md flex flex-col items-center justify-center border transition-colors ${
                    isToday(day) 
                      ? 'border-primary font-bold' 
                      : hasJournal 
                      ? 'border-gray-600' 
                      : 'border-transparent hover:border-gray-600'
                  } ${
                    hasPositive && hasNegative 
                      ? 'bg-purple-900/30' 
                      : hasPositive 
                      ? 'bg-green-900/30' 
                      : hasNegative 
                      ? 'bg-red-900/30' 
                      : 'bg-gray-700'
                  }`}
                  onClick={() => handleDayClick(dateString)}
                  onMouseEnter={(e) => handleDayHover(dateString, e)}
                  onMouseLeave={handleDayLeave}
                >
                  <span className="text-white">{format(day, 'd')}</span>
                  {emotionCount > 0 && (
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
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Emotion hover tooltip */}
          {hoverDayInfo && (
            <div 
              className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3 z-10 min-w-[200px]"
              style={{
                left: `${hoverDayInfo.position.x}px`,
                top: `${hoverDayInfo.position.y + 10}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-center font-medium mb-2 text-gray-200">
                {format(parseISO(hoverDayInfo.date), 'MMMM d, yyyy')}
              </div>
              <div className="space-y-1.5">
                {hoverDayInfo.emotions.map((emotion, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{emotion.emoji}</span>
                      <span className={`text-sm ${emotion.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {emotion.name}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm font-medium">
                      {emotion.count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-400 rounded-full mr-2" />
              <span className="text-gray-300">Journal Entry</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2" />
              <span className="text-gray-300">Positive Emotion</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-400 rounded-full mr-2" />
              <span className="text-gray-300">Negative Emotion</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-900/70 rounded mr-2" style={{ width: '16px', height: '16px' }} />
              <span className="text-gray-300">Mixed Emotions</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics View */}
      {activeTab === 'stats' && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Emotion Distribution</h3>
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
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      }
                    },
                    x: {
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(20, 20, 20, 0.9)',
                      titleColor: 'rgba(255, 255, 255, 0.9)',
                      bodyColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                    }
                  },
                }}
              />
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Day Types</h3>
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
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      }
                    },
                    x: {
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(20, 20, 20, 0.9)',
                      titleColor: 'rgba(255, 255, 255, 0.9)',
                      bodyColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                    }
                  },
                }}
              />
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Stats Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-md">
                <div className="text-4xl font-bold text-center text-white">
                  {data.journalEntries.length}
                </div>
                <div className="text-center text-gray-300">Journal Entries</div>
              </div>
              <div className="bg-green-900/30 p-4 rounded-md">
                <div className="text-4xl font-bold text-center text-green-400">
                  {emotionDays.positive}
                </div>
                <div className="text-center text-gray-300">Positive Days</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded-md">
                <div className="text-4xl font-bold text-center text-red-400">
                  {emotionDays.negative}
                </div>
                <div className="text-center text-gray-300">Negative Days</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 