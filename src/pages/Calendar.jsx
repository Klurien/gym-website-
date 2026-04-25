import React, { useState, useEffect } from 'react';

export default function Calendar() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate a dynamic matrix of 21 days centered around today
  const [activeDate, setActiveDate] = useState(new Date().getDate());
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - 10)); // 10 days ago to 10 days ahead
    return {
      date: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      isToday: i === 10,
      hasSession: Math.random() > 0.7 // In a real app derived from bookings
    };
  });

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmCancel) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ booking_id: bookingId })
      });
      if (res.ok) {
        // Optimistic toggle off
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      }
    } catch (e) {
      console.error('Cancellation failed', e);
    }
  };

  return (
    <main className="pt-28 pb-32 px-edge-margin space-y-stack-lg max-w-2xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col gap-unit">
        <p className="text-label-sm font-label-sm text-lime-400 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]">Training Schedule</p>
        <h2 className="text-headline-lg font-headline-lg text-primary">{currentMonth}</h2>
      </div>

      {/* Monthly Calendar Card */}
      <section className="bg-zinc-900/60 rounded-[24px] p-container-padding shadow-2xl border border-white/5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-400/10 blur-[80px] rounded-full"></div>
        <div className="grid grid-cols-7 gap-y-stack-md text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Sun</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Mon</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Tue</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Wed</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Thu</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Fri</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Sat</span>
          
          {days.map((dayObj, idx) => {
            const isSelected = activeDate === dayObj.date;
            if (dayObj.isToday) {
              return (
                <div key={idx} onClick={() => setActiveDate(dayObj.date)} className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform">
                  <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full shadow-[0_0_15px_rgba(204,255,0,0.4)] ${isSelected ? 'bg-lime-400 text-black border-2 border-white' : 'bg-lime-400 text-black'}`}>
                    {dayObj.date}
                  </span>
                </div>
              );
            }
            return (
              <span 
                key={idx} 
                onClick={() => setActiveDate(dayObj.date)}
                className={`text-body-md font-body-md relative cursor-pointer hover:text-white transition-colors flex items-center justify-center w-8 h-8 mx-auto rounded-full ${isSelected ? 'bg-zinc-800 text-white' : (idx < 10 ? 'text-zinc-600' : 'text-primary')} active:scale-90 transition-transform`}
              >
                {dayObj.date}
                {dayObj.hasSession && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-lime-400' : 'bg-zinc-500'}`}></span>
                )}
              </span>
            );
          })}
        </div>
      </section>

      {/* Bookings Output */}
      <section className="space-y-stack-md">
        <h3 className="text-headline-md font-headline-md text-primary">Your Sessions</h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-lime-400">refresh</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-zinc-900/30 rounded-[24px] p-container-padding text-center border border-white/5 shadow-2xl">
             <p className="text-zinc-500 font-label-bold uppercase tracking-widest text-[10px]">No Upcoming Classes</p>
             <button className="mt-4 px-6 py-2 border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all">Book Open Session</button>
          </div>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-zinc-900/50 rounded-[24px] overflow-hidden shadow-2xl border border-white/5 group hover:border-lime-400/30 transition-colors duration-300 mb-6">
              <div className="relative h-24 w-full overflow-hidden cursor-pointer">
                <img 
                  alt="Gym classification" 
                  className="w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD95XSlFYb76FfDl3GnhBu3Sxf1MEEDIBLAO7qnBPt_mn_d1orVdxZPtkLfnlN1m_xZLIH3DBs6lSoUJmjTMz2ukZti8uglOQOprN52kpl27KfizZZt4CuAVaV6Rf8ttjqVvH3mNYSct4jCWJCam6ogFKU0upxP-BLMxROO2euxdmHiJKQqRm9NtwQOGo-MqHOOOCCSX0rNl6AZj_oE24cMarObXftrFFppVo_NAReCGgyGOpVkGlJFlLGH_B2TEkUJsl-dC92J-4LY"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <span className="px-3 py-1 bg-lime-400/20 text-lime-400 border border-lime-400 text-label-sm font-bold rounded-full tracking-widest uppercase text-[10px]">
                    {booking.status}
                  </span>
                </div>
              </div>
              <div className="p-container-padding space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-headline-md font-headline-md text-primary">{booking.name}</h4>
                    <p className="text-body-md font-body-md text-zinc-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span> {booking.instructor}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display-xl text-lime-400 leading-none">
                      {new Date(booking.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleCancelBooking(booking.id)}
                  className="w-full bg-zinc-950 border border-red-500/30 text-red-400 font-lexend font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors active:scale-95 duration-150 uppercase tracking-widest text-xs"
                >
                  <span className="material-symbols-outlined font-variation-settings-'FILL' 1 text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                  Cancel Booking
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
