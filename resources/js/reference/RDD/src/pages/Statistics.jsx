import React, { useState, useRef } from 'react';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

const Statistics = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredSdg, setHoveredSdg] = useState(null);
  const tooltipContainerRef = useRef(null);
  const dostTooltipContainerRef = useRef(null);
  const sdgTooltipContainerRef = useRef(null);

  // Data for Research Proposal Status per RDE Agenda
  const rdeAgendaData = [
    { name: 'Agriculture, Aquatic, and Agro-Forestry', ongoing: 35, completed: 25, total: 60 },
    { name: 'Business and Trade', ongoing: 30, completed: 20, total: 50 },
    { name: 'Social Sciences and Education', ongoing: 15, completed: 10, total: 25 },
    { name: 'Engineering and Technology', ongoing: 18, completed: 12, total: 30 },
    { name: 'Environment and Natural Resources', ongoing: 25, completed: 20, total: 45 },
    { name: 'Health and Wellness', ongoing: 12, completed: 8, total: 20 },
    { name: 'Peace and Security', ongoing: 25, completed: 15, total: 40 },
  ];

  // Data for Distribution of Research Proposals by DOST 6Ps
  const dost6PsData = [
    { name: 'Publications', value: 99 },
    { name: 'Patent', value: 12 },
    { name: 'Product', value: 10 },
    { name: 'People Services', value: 23 },
    { name: 'Places and Partner', value: 12 },
    { name: 'Policies', value: 68 },
  ];

  const maxValue = Math.max(...rdeAgendaData.map(item => item.total));
  const maxDostValue = Math.max(...dost6PsData.map(item => item.value));

  // Data for Distribution by Sustainable Development Goal
  const sdgData = [
    { name: '1', fullName: 'No Poverty', value: 45, color: '#E5243B' },
    { name: '2', fullName: 'Zero Hunger', value: 38, color: '#DDA63A' },
    { name: '3', fullName: 'Good Health and Well-being', value: 41, color: '#4C9F38' },
    { name: '4', fullName: 'Quality Education', value: 42, color: '#C5192D' },
    { name: '5', fullName: 'Gender Equality', value: 48, color: '#FF3A21' },
    { name: '6', fullName: 'Clean Water and Sanitation', value: 25, color: '#26BDE2' },
    { name: '7', fullName: 'Affordable and Clean Energy', value: 55, color: '#FCC30B' },
    { name: '8', fullName: 'Decent Work and Economic Growth', value: 40, color: '#A21942' },
    { name: '9', fullName: 'Industry, Innovation and Infrastructure', value: 43, color: '#FD6925' },
    { name: '10', fullName: 'Reduced Inequalities', value: 18, color: '#DD1367' },
    { name: '11', fullName: 'Sustainable Cities and Communities', value: 35, color: '#FD9D24' },
    { name: '12', fullName: 'Responsible Consumption and Production', value: 52, color: '#BF8B2E' },
    { name: '13', fullName: 'Climate Action', value: 30, color: '#3F7E44' },
    { name: '14', fullName: 'Life Below Water', value: 22, color: '#0A97D9' },
    { name: '15', fullName: 'Life on Land', value: 33, color: '#56C02B' },
    { name: '16', fullName: 'Peace, Justice and Strong Institutions', value: 46, color: '#00689D' },
    { name: '17', fullName: 'Partnerships for the Goals', value: 50, color: '#19486A' },
  ];

  const maxSdgValue = Math.max(...sdgData.map(item => item.value));

  // Calculate totals for overview cards
  const totalProposals = rdeAgendaData.reduce((sum, item) => sum + item.total, 0);
  const totalOngoing = rdeAgendaData.reduce((sum, item) => sum + item.ongoing, 0);
  const totalCompleted = rdeAgendaData.reduce((sum, item) => sum + item.completed, 0);
  const completionRate = Math.round((totalCompleted / totalProposals) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header (unified style) */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
              Research Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Comprehensive overview of research proposals and outcomes
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Proposals</p>
                <p className="text-3xl font-bold text-gray-900">{totalProposals}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ongoing</p>
                <p className="text-3xl font-bold text-orange-500">{totalOngoing}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-500">{totalCompleted}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RDE Agenda Chart Container */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <div className="space-y-6 relative" ref={tooltipContainerRef}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Research Proposal Status per RDE Agenda
              </h2>
            </div>

            <div className="space-y-4">
              {rdeAgendaData.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center space-x-6 p-4 rounded-xl hover:bg-white/50 transition-all duration-200">
                    <div className="w-72 text-sm font-medium text-gray-700">
                      {item.name}
                    </div>
                    
                    <div className="flex-1 flex items-center space-x-4">
                      <div 
                        className="flex-1 h-12 rounded-xl overflow-hidden cursor-pointer relative flex shadow-inner bg-gray-100"
                        onMouseEnter={() => setHoveredItem(item)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onMouseMove={(e) => {
                          const rect = tooltipContainerRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300 hover:from-orange-500 hover:to-orange-600 relative"
                          style={{ width: `${(item.ongoing / maxValue) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300 hover:from-green-500 hover:to-green-600 relative"
                          style={{ width: `${(item.completed / maxValue) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      </div>
                      
                      <div className="w-16 text-right">
                        <span className="text-lg font-bold text-gray-900 bg-red-800 bg-clip-text text-transparent">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Hover Tooltip */}
            {hoveredItem && (
              <div
                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                style={{
                  left: `${hoverPosition.x}px`,
                  top: `${hoverPosition.y - 16}px`,
                  transform: 'translate(-50%, -100%)',
                  minWidth: '280px'
                }}
              >
                <div className="font-bold text-gray-900 mb-3 text-base">{hoveredItem.name}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Ongoing</span>
                    </div>
                    <span className="font-bold text-orange-600">{hoveredItem.ongoing}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Completed</span>
                    </div>
                    <span className="font-bold text-green-600">{hoveredItem.completed}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-gray-900">{hoveredItem.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Legend */}
            <div className="flex justify-center space-x-8 mt-8">
              <div className="flex items-center space-x-3 px-4 py-2 bg-orange-50 rounded-xl">
                <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">Ongoing</span>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 rounded-xl">
                <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced DOST 6Ps Chart Container */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
          <div className="space-y-6 relative" ref={dostTooltipContainerRef}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Distribution of Research Proposals by DOST 6Ps
              </h2>
            </div>

            <div className="flex items-end justify-between space-x-4 h-96 px-4">
              {dost6PsData.map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-4 flex-1 group">
                  <div className="relative">
                    <div 
                      className="w-20 bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 rounded-t-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 relative overflow-hidden"
                      style={{ height: `${(item.value / maxDostValue) * 280}px` }}
                      onMouseEnter={() => setHoveredBar(item)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onMouseMove={(e) => {
                        const rect = dostTooltipContainerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700 max-w-20 leading-tight">
                      {item.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DOST 6Ps Hover Tooltip */}
            {hoveredBar && (
              <div
                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                style={{
                  left: `${hoverPosition.x - 100}px`,
                  top: `${hoverPosition.y - 100}px`,
                  minWidth: '200px'
                }}
              >
                <div className="font-bold text-gray-900 mb-2 text-base">{hoveredBar.name}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Proposals</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">{hoveredBar.value}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced SDG Chart Container */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="space-y-6 relative" ref={sdgTooltipContainerRef}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Distribution by Sustainable Development Goals
              </h2>
            </div>

            <div className="flex items-end justify-between space-x-1 h-80 px-2">
              {sdgData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center space-y-2 flex-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredSdg(item)}
                  onMouseLeave={() => setHoveredSdg(null)}
                  onMouseMove={(e) => {
                    const rect = sdgTooltipContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-10 rounded-t-lg transition-all duration-300 hover:shadow-lg transform hover:scale-110 relative overflow-hidden"
                      style={{
                        height: `${(item.value / maxSdgValue) * 250}px`,
                        backgroundColor: item.color,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/30"></div>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  </div>

                  <div className="w-8 h-8 flex items-center justify-center">
                    <img 
                      src={`/sdg-goal-${item.name}.jpg`} 
                      alt={`SDG ${item.name}`}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* SDG Hover Tooltip */}
            {hoveredSdg && (
              <div
                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                style={{
                  left: `${hoverPosition.x}px`,
                  top: `${hoverPosition.y - 16}px`,
                  transform: 'translate(-50%, -100%)',
                  minWidth: '240px'
                }}
              >
                <div className="font-bold text-gray-900 mb-2 text-base">SDG {hoveredSdg.name}</div>
                <div className="text-gray-700 font-medium mb-3 text-sm">{hoveredSdg.fullName}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: hoveredSdg.color }}
                    ></div>
                    <span className="text-gray-700 font-medium">Projects</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">{hoveredSdg.value}</span>
                </div>
              </div>
            )}

            <div className="text-center text-sm font-semibold text-gray-600 mt-6 bg-gray-50/50 rounded-xl p-2">
              Sustainable Development Goals (SDG)
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              {sdgData.map((item) => (
                <div key={item.name} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl hover:bg-white/70 transition-all duration-200">
                  <img 
                    src={`/sdg-goal-${item.name}.jpg`} 
                    alt={`SDG ${item.name}`}
                    className="w-6 h-6 object-cover rounded-lg shadow-sm flex-shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">SDG {item.name}</span>
                    <span className="text-xs text-gray-600 leading-tight">{item.fullName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;