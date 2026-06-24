import React, { useState } from "react";

const Calendar = ({ setSelectedDate }) => {
  const [notes, setNotes] = useState("");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Get the first day of January 2022 and number of days
  const firstDay = new Date(2022, 0, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = 31;
  
  // Adjust for Monday-first calendar (MON-SUN)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Generate calendar days array
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateClick = (day) => {
    if (!day) return;
    
    if (!startDate) {
      // First click - set start date
      setStartDate(day);
      setEndDate(null);
    } else if (!endDate) {
      // Second click - set end date
      if (day >= startDate) {
        setEndDate(day);
      } else {
        // If clicked day is before start date, swap them
        setEndDate(startDate);
        setStartDate(day);
      }
    } else {
      // Third click - start new selection
      setStartDate(day);
      setEndDate(null);
    }
    
    // Update selected date for external use
    setSelectedDate(`2022-01-${day.toString().padStart(2, '0')}`);
  };

  const isWeekend = (day) => {
    if (!day) return false;
    const dayOfWeek = new Date(2022, 0, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && today.getMonth() === 0 && today.getFullYear() === 2022;
  };

  const isInRange = (day) => {
    return startDate && endDate && day >= startDate && day <= endDate;
  };

  const isStartOrEnd = (day) => {
    return day === startDate || day === endDate;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105">
      {/* Header Section with Image */}
      <div className="relative h-80 bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/random/1200x600/?mountain,climbing,ice,winter')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/70 via-blue-500/60 to-blue-400/50 flex items-center justify-center">
          <div className="text-center transform transition-all duration-500 hover:scale-110">
            <h1 className="text-6xl font-bold text-white mb-3 drop-shadow-lg tracking-wider">2022</h1>
            <h2 className="text-4xl font-semibold text-white drop-shadow-md tracking-wide">JANUARY</h2>
          </div>
        </div>
        
        {/* Decorative spiral binding */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-lg"></div>
          <div className="w-2 h-8 bg-gradient-to-b from-gray-400 to-gray-600"></div>
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-md"></div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-white/30 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-white/30 rounded-tr-lg"></div>
      </div>

      {/* Content Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row">
          {/* Notes Section - Left Side */}
          <div className="lg:w-1/2 p-8 border-r border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Notes</h3>
              <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
            </div>
            
            <div className="space-y-3 mb-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-10 border-b-2 border-dashed border-amber-200/50 hover:border-amber-300 transition-colors duration-200"></div>
              ))}
            </div>
            
            <div className="relative">
              <textarea
                className="w-full p-4 border-2 border-amber-200 rounded-xl resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                rows={6}
                placeholder="Write your thoughts here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full shadow-md"></div>
            </div>
          </div>

          {/* Calendar Grid - Right Side */}
          <div className="lg:w-1/2 p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Calendar</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mt-2"></div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Day headers */}
              {weekDays.map((day) => (
                <div key={day} className="font-bold text-sm py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-md">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`h-12 flex items-center justify-center cursor-pointer text-sm font-medium rounded-lg transition-all duration-300 transform
                    ${!day ? 'invisible' : 
                      isToday(day) && !isStartOrEnd(day) ? 'bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-lg scale-110 ring-2 ring-pink-300' :
                      isStartOrEnd(day) ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-110 ring-2 ring-green-300 font-bold' :
                      isInRange(day) ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 shadow-md' :
                      isWeekend(day) ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 hover:from-blue-200 hover:to-blue-300 shadow-md' : 
                      'bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 text-gray-700 hover:shadow-lg hover:scale-105 border border-gray-200'}
                    ${hoveredDay === day ? 'scale-110 shadow-xl z-10' : ''}
                  `}
                >
                  {day && (
                    <span className={`${isToday(day) ? 'animate-pulse' : ''}`}>
                      {day}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Range Status */}
            {startDate && (
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-800 text-center">
                  {endDate ? 
                    `Selected: Jan ${startDate} - Jan ${endDate} (${endDate - startDate + 1} days)` : 
                    `Start date: Jan ${startDate} (click end date to complete range)`
                  }
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full"></div>
                <span className="text-gray-600">Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full"></div>
                <span className="text-gray-600">Weekend</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full"></div>
                <span className="text-gray-600">Range Start/End</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full"></div>
                <span className="text-gray-600">Selected Range</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced hanging hook */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-20">
        <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"></div>
        <div className="w-2 h-6 bg-gradient-to-b from-gray-500 to-gray-700 mx-auto"></div>
      </div>

      {/* Decorative shadow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/10 to-transparent"></div>
    </div>
  );
};

export default Calendar;