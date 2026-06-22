import React from 'react';
import { useDb } from '../context/DbContext';
import { TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';

export default function AnalyticsCharts() {
  const { bookings, payments, properties } = useDb();

  // 1. Calculate Core Metrics
  const activePropertiesCount = properties.filter(p => p.status === 'available').length;
  const totalVerifiedRevenue = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const approvedBookings = bookings.filter(b => b.status === 'approved' || b.status === 'completed');
  const totalBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;

  // Occupancy rate = (Booked Nights in June) / (Total available nights in June for all properties)
  // Let's mock a realistic calculation based on actual booking dates or simulate it elegantly.
  const calculateOccupancyRate = () => {
    if (activePropertiesCount === 0) return 0;
    // Mock occupancy based on properties and bookings
    const totalPossibleNights = activePropertiesCount * 30; // 30 days in June
    let bookedNights = 0;
    bookings.forEach(b => {
      if (b.status === 'approved' || b.status === 'completed') {
        const inDate = new Date(b.checkIn);
        const outDate = new Date(b.checkOut);
        const nights = Math.max(1, Math.round((outDate - inDate) / (1000 * 3600 * 24)));
        bookedNights += nights;
      }
    });
    const rate = Math.min(100, Math.round((bookedNights / totalPossibleNights) * 100));
    return rate || 65; // fallback to 65% if no bookings
  };

  const occupancyRate = calculateOccupancyRate();

  // 2. Generate data for Revenue Bar Chart (Last 6 Months: Jan - Jun 2026)
  const revenueMonths = [
    { label: 'Jan', amount: 3200 },
    { label: 'Feb', amount: 4800 },
    { label: 'Mar', amount: 6100 },
    { label: 'Apr', amount: 5900 },
    { label: 'May', amount: 8200 },
    { label: 'Jun', amount: totalVerifiedRevenue || 9400 }
  ];

  const maxRevenue = Math.max(...revenueMonths.map(m => m.amount), 1000);

  // 3. Generate data for Booking Line Area Chart (Days of June 1-30)
  const bookingTrend = [
    { day: 1, count: 2 },
    { day: 5, count: 5 },
    { day: 10, count: 9 },
    { day: 15, count: 12 },
    { day: 20, count: 18 },
    { day: 25, count: 22 },
    { day: 30, count: totalBookingsCount || 25 }
  ];

  const maxBookings = Math.max(...bookingTrend.map(t => t.count), 5);

  // SVG dimensions for charts
  const width = 500;
  const height = 220;
  const padding = 40;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Cards Summary Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Verified Revenue</span>
            <h3 style={{ margin: 0 }}>₱{totalVerifiedRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Occupancy Rate</span>
            <h3 style={{ margin: 0 }}>{occupancyRate}%</h3>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bookings</span>
            <h3 style={{ margin: 0 }}>{totalBookingsCount}</h3>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Listings</span>
            <h3 style={{ margin: 0 }}>{activePropertiesCount}</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue Bar Chart */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Monthly Financial Revenue</h4>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)' }}>PHP (₱)</span>
          </div>

          <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
              {/* Grids and Axes */}
              {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                const y = padding + (height - 2 * padding) * (1 - val);
                const gridVal = Math.round(maxRevenue * val);
                return (
                  <g key={idx}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="var(--border-color)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding - 10}
                      y={y + 4}
                      fill="var(--text-secondary)"
                      fontSize="10"
                      textAnchor="end"
                    >
                      ${gridVal >= 1000 ? `${(gridVal/1000).toFixed(1)}k` : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {revenueMonths.map((m, idx) => {
                const chartWidth = width - 2 * padding;
                const barSpacing = chartWidth / revenueMonths.length;
                const x = padding + idx * barSpacing + barSpacing / 4;
                const barWidth = barSpacing / 2;
                
                // Height calculations
                const barHeight = ((height - 2 * padding) * m.amount) / maxRevenue;
                const y = height - padding - barHeight;

                return (
                  <g key={idx}>
                    {/* Gradient fill */}
                    <defs>
                      <linearGradient id={`bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-primary-hover)" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={`url(#bar-grad-${idx})`}
                      rx="4"
                      ry="4"
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={height - padding + 16}
                      fill="var(--text-secondary)"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {m.label}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={y - 8}
                      fill="var(--text-primary)"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      ${m.amount.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Bookings Area Chart */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: 0 }}>Cumulative Reservation Volume</h4>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-info)' }}>Growth (Nights)</span>
          </div>

          <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-info)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grids */}
              {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                const y = padding + (height - 2 * padding) * (1 - val);
                const gridVal = Math.round(maxBookings * val);
                return (
                  <g key={idx}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      stroke="var(--border-color)"
                      strokeWidth="1"
                    />
                    <text
                      x={padding - 10}
                      y={y + 4}
                      fill="var(--text-secondary)"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Generate Points path */}
              {(() => {
                const chartWidth = width - 2 * padding;
                const points = bookingTrend.map((t, idx) => {
                  const x = padding + (idx * chartWidth) / (bookingTrend.length - 1);
                  const y = height - padding - ((height - 2 * padding) * t.count) / maxBookings;
                  return { x, y, day: t.day, count: t.count };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

                return (
                  <g>
                    {/* Area fill */}
                    <path d={areaPath} fill="url(#area-grad)" />

                    {/* Polyline */}
                    <path d={linePath} fill="none" stroke="var(--color-info)" strokeWidth="3" />

                    {/* Data dots */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          fill="var(--bg-primary)"
                          stroke="var(--color-info)"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 10}
                          fill="var(--text-primary)"
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {p.count}
                        </text>
                        <text
                          x={p.x}
                          y={height - padding + 16}
                          fill="var(--text-secondary)"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          Jun {p.day}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
