import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { ChevronLeft, ChevronRight, Calendar, User, Phone, Mail, CreditCard, Clock } from 'lucide-react';

export default function CalendarView({ onSelectBooking }) {
  const { properties, propertyUnits, bookings } = useDb();

  // Current calendar view date (defaults to current month)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Set to June 2026 to align with mock database records

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate days array
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
    return {
      dayNum: i + 1,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayName: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayOfWeek]
    };
  });

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Build active units lists
  const activeUnits = [];
  properties.filter(p => p.status !== 'archived').forEach(p => {
    const units = propertyUnits.filter(u => u.propertyId === p.id);
    units.forEach(u => {
      activeUnits.push({
        id: u.id,
        propertyId: p.id,
        title: `${p.title} - ${u.unitName}`,
        unitName: u.unitName,
        propertyTitle: p.title,
        status: u.status,
        unitType: u.unitType
      });
    });
  });

  // Helper to determine reservation bar geometry
  const getReservationPosition = (booking, daysCount) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    // View limits
    const viewStart = new Date(year, month, 1);
    const viewEnd = new Date(year, month, daysCount, 23, 59, 59);

    // If booking lies entirely outside this month
    if (checkOut < viewStart || checkIn > viewEnd) return null;

    // Calculate start day within this month
    let startDay = 1;
    if (checkIn >= viewStart) {
      startDay = checkIn.getDate();
    }

    // Calculate end day within this month
    let endDay = daysCount;
    if (checkOut <= viewEnd) {
      endDay = checkOut.getDate();
    }

    const durationDays = (endDay - startDay) + 1;
    
    // Width and left position (in pixels, column size is 45px)
    const dayWidth = 45;
    const left = (startDay - 1) * dayWidth;
    const width = durationDays * dayWidth;

    return { left, width };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--color-warning)';
      case 'approved': return 'var(--color-success)';
      case 'completed': return 'var(--color-info)';
      case 'cancelled':
      case 'rejected':
        return 'var(--color-danger)';
      default: return 'var(--text-tertiary)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
      {/* Calendar Header Toolbar */}
      <div className="flex align-center justify-between no-print" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)'
      }}>
        <div className="flex align-center gap-2">
          <Calendar style={{ color: 'var(--color-primary)' }} />
          <h4 style={{ margin: 0 }}>Reservations Schedule</h4>
        </div>
        
        <div className="flex align-center gap-3">
          <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, minWidth: '130px', textAlign: 'center', fontSize: '1.05rem' }}>
            {monthNames[month]} {year}
          </span>
          <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
 
        <div className="flex align-center gap-2" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          <div className="flex align-center gap-1"><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-warning)' }}></span> Pending</div>
          <div className="flex align-center gap-1"><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-success)' }}></span> Approved</div>
          <div className="flex align-center gap-1"><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-info)' }}></span> Completed</div>
        </div>
      </div>

      {/* Calendar Timeline Grid */}
      <div className="calendar-timeline">
        {/* Properties/Units Column */}
        <div className="calendar-sidebar">
          <div className="calendar-header-cell">Unit Option Name</div>
          {activeUnits.map(unit => (
            <div key={unit.id} className="calendar-row" title={unit.title} style={{ fontSize: '0.82rem', padding: '12px 8px', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{unit.unitName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{unit.propertyTitle}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Timeline Area */}
        <div className="calendar-grid-container">
          {/* Timeline Dates Header */}
          <div className="calendar-grid-header" style={{ width: `${daysInMonth * 45}px` }}>
            {daysArray.map(d => (
              <div
                key={d.dayNum}
                className={`calendar-grid-day-column ${d.isWeekend ? 'weekend' : ''}`}
              >
                <span style={{ color: d.isWeekend ? 'var(--color-primary)' : 'var(--text-secondary)' }}>{d.dayName}</span>
                <span>{d.dayNum}</span>
              </div>
            ))}
          </div>

          {/* Timeline Unit Rows */}
          <div style={{ position: 'relative', width: `${daysInMonth * 45}px` }}>
            {activeUnits.map(unit => {
              // Find active bookings for this specific unit (or fallback to property bookings for legacy matches on entire property)
              const unitBookings = bookings.filter(b => {
                if (b.status === 'cancelled' || b.status === 'rejected') return false;
                if (b.unitId) {
                  return b.unitId === unit.id;
                } else {
                  // Legacy fallback
                  return b.propertyId === unit.propertyId && unit.unitType === 'Entire Property';
                }
              });

              return (
                <div key={unit.id} className="calendar-grid-row" style={{ width: `${daysInMonth * 45}px`, height: '40px' }}>
                  {/* Render grid lines background */}
                  {daysArray.map(d => (
                    <div
                      key={d.dayNum}
                      style={{
                        width: '45px',
                        height: '100%',
                        borderRight: '1px solid var(--border-color)',
                        backgroundColor: d.isWeekend ? 'var(--bg-secondary)' : 'transparent',
                        flexShrink: 0
                      }}
                    />
                  ))}

                  {/* Render reservation bars */}
                  {unitBookings.map(b => {
                    const pos = getReservationPosition(b, daysInMonth);
                    if (!pos) return null;

                    return (
                      <div
                        key={b.id}
                        className="calendar-reservation-bar"
                        style={{
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          height: '24px',
                          top: '8px',
                          backgroundColor: getStatusColor(b.status)
                        }}
                        onClick={() => onSelectBooking(b)}
                        title={`Ref: ${b.id} | Check-in: ${b.checkIn} | Check-out: ${b.checkOut}`}
                      >
                        {b.id} ({b.guestsCount}g)
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
