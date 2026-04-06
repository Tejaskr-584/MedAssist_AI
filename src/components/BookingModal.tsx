import { useState } from 'react';
import { X, Calendar, Clock, CheckCircle, Loader2, MapPin, Star } from 'lucide-react';
import { cn } from '../utils/cn';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeForFirestore } from '../utils/firestore';

interface Expert {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  image: string;
  available: boolean;
}

interface BookingModalProps {
  expert: Expert;
  onClose: () => void;
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', 
  '01:00 PM', '02:00 PM', '03:00 PM', 
  '04:00 PM', '05:00 PM'
];

const DATES = [
  { label: 'Today', value: new Date().toISOString().split('T')[0] },
  { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
];

export function BookingModal({ expert, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState(DATES[0].value);
  const [selectedTime, setSelectedTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBooking = async () => {
    if (!selectedTime) {
      setError('Please select a time slot.');
      return;
    }

    if (!auth.currentUser) {
      setError('You must be logged in to book an appointment.');
      return;
    }

    setIsBooking(true);
    setError(null);

    try {
      const bookingData = sanitizeForFirestore({
        userId: auth.currentUser.uid,
        doctorId: expert.id,
        doctorName: expert.name,
        specialty: expert.specialty,
        date: selectedDate,
        time: selectedTime,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'appointments'), bookingData);

      setIsSuccess(true);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-card rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-border text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-foreground tracking-tight">Booking Confirmed!</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Your appointment with <span className="text-foreground font-black">{expert.name}</span> has been successfully booked for <span className="text-foreground font-black">{selectedDate}</span> at <span className="text-foreground font-black">{selectedTime}</span>.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-brand-primary/20 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card rounded-[3rem] w-full max-w-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
              <Calendar size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-foreground tracking-tight">Book Consultation</h3>
              <p className="text-xs font-black text-brand-primary uppercase tracking-widest">Schedule your session</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Doctor Info */}
          <div className="flex items-start gap-6 p-6 bg-muted/40 rounded-[2rem] border border-border/50">
            <div className="w-20 h-20 bg-muted rounded-2xl overflow-hidden border-2 border-card shadow-md">
              <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-foreground tracking-tight">{expert.name}</h4>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{expert.specialty}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <MapPin size={14} className="text-brand-primary" />
                  {expert.location}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  {expert.rating} ({expert.reviews} reviews)
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Select Date</h4>
            <div className="flex gap-4">
              {DATES.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={cn(
                    "flex-1 py-5 rounded-2xl text-sm font-black transition-all border uppercase tracking-widest",
                    selectedDate === date.value
                      ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary"
                  )}
                >
                  {date.label}
                  <span className="block text-[10px] opacity-60 mt-1">{date.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Select Time Slot</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "py-4 rounded-xl text-xs font-black transition-all border uppercase tracking-widest",
                    selectedTime === time
                      ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary"
                  )}
                >
                  <Clock size={12} className="inline mr-2 -mt-0.5" />
                  {time}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-xs font-bold text-center">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border bg-muted/30">
          <button 
            onClick={handleBooking}
            disabled={isBooking}
            className="w-full py-5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isBooking ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                CONFIRMING...
              </>
            ) : (
              'CONFIRM BOOKING'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
