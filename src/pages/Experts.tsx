import { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, Search, Filter, Stethoscope, Heart, Brain, Baby, Eye, Bone, ShieldCheck, User, Calendar, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLocation } from '../hooks/useLocation';
import { useSearchParams } from 'react-router-dom';
import { BookingModal } from '../components/BookingModal';

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

const EXPERTS: Expert[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'General Physician', rating: 4.9, reviews: 124, location: 'Bangalore, India', image: 'https://i.pravatar.cc/150?img=1', available: true },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiologist', rating: 4.8, reviews: 89, location: 'Mumbai, India', image: 'https://i.pravatar.cc/150?img=2', available: true },
  { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Neurologist', rating: 4.7, reviews: 56, location: 'Delhi, India', image: 'https://i.pravatar.cc/150?img=3', available: false },
  { id: '4', name: 'Dr. David Wilson', specialty: 'Pediatrician', rating: 4.9, reviews: 210, location: 'Bangalore, India', image: 'https://i.pravatar.cc/150?img=4', available: true },
  { id: '5', name: 'Dr. Lisa Park', specialty: 'Dermatologist', rating: 4.6, reviews: 78, location: 'Hyderabad, India', image: 'https://i.pravatar.cc/150?img=5', available: true },
  { id: '6', name: 'Dr. James Miller', specialty: 'Orthopedic Surgeon', rating: 4.8, reviews: 112, location: 'Chennai, India', image: 'https://i.pravatar.cc/150?img=6', available: true },
  { id: '7', name: 'Dr. Ananya Sharma', specialty: 'General Physician', rating: 4.9, reviews: 156, location: 'Mumbai, India', image: 'https://i.pravatar.cc/150?img=7', available: true },
  { id: '8', name: 'Dr. Rajesh Kumar', specialty: 'Cardiologist', rating: 4.7, reviews: 94, location: 'Delhi, India', image: 'https://i.pravatar.cc/150?img=8', available: true },
  { id: '9', name: 'Dr. Priya Patel', specialty: 'Pediatrician', rating: 4.8, reviews: 128, location: 'Bangalore, India', image: 'https://i.pravatar.cc/150?img=9', available: true },
];

const SPECIALTIES = [
  { name: 'All', icon: Stethoscope },
  { name: 'General Physician', icon: Stethoscope },
  { name: 'Cardiologist', icon: Heart },
  { name: 'Neurologist', icon: Brain },
  { name: 'Pediatrician', icon: Baby },
  { name: 'Dermatologist', icon: ShieldCheck },
  { name: 'Orthopedic Surgeon', icon: Bone },
];

export function Experts() {
  const [searchParams] = useSearchParams();
  const { location, setLocation, useCurrentLocation, isLoading: isLocating } = useLocation();
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  const [selectedExpertForBooking, setSelectedExpertForBooking] = useState<Expert | null>(null);

  const filteredExperts = EXPERTS.filter(expert => {
    const matchesSpecialty = selectedSpecialty === 'All' || expert.specialty === selectedSpecialty;
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          expert.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = expert.location.toLowerCase().includes(location.toLowerCase().split(',')[0].trim());
    return matchesSpecialty && matchesSearch && matchesLocation;
  });

  const handleUpdateLocation = () => {
    setLocation(tempLocation);
    setIsLocationModalOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Medical Experts</h1>
          <p className="text-muted-foreground font-medium">Connect with top-rated specialists in {location}.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest hover:bg-brand-primary/20 transition-all shadow-sm"
          >
            <MapPin size={16} />
            {location}
          </button>
          <div className="hidden sm:flex -space-x-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-card bg-muted overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-card bg-brand-primary flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              +50
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6 border border-border">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground tracking-tight">Set Your Location</h3>
              <p className="text-muted-foreground font-medium">We use this to recommend doctors near you.</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  placeholder="Enter city or pincode..."
                  className="w-full bg-muted border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                />
              </div>
              
              <button 
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="w-full py-4 bg-muted border border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-muted/80 transition-all"
              >
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                Use Current Location
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateLocation}
                className="flex-1 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedExpertForBooking && (
        <BookingModal 
          expert={selectedExpertForBooking} 
          onClose={() => setSelectedExpertForBooking(null)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters */}
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Search Experts</h3>
            <div className="relative group">
              <div className="absolute -inset-1 bg-brand-primary rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                  type="text" 
                  placeholder="Name or specialty..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Specialties</h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec.name}
                  onClick={() => setSelectedSpecialty(spec.name)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-black transition-all text-left uppercase tracking-widest",
                    selectedSpecialty === spec.name 
                      ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/30 translate-x-1" 
                      : "bg-card/40 border border-border/50 text-muted-foreground hover:border-brand-primary/40 hover:text-brand-primary"
                  )}
                >
                  <spec.icon size={18} />
                  {spec.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <h4 className="text-lg font-black tracking-tight leading-tight">Need urgent help?</h4>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Book an instant video consultation with our on-call general physicians.
              </p>
              <button className="w-full py-3 bg-white text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/90 transition-colors">
                Book Instant Call
              </button>
            </div>
          </div>
        </div>

        {/* Experts Grid */}
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredExperts.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-6 bg-card/40 border border-dashed border-border rounded-[3rem] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground/40 mx-auto shadow-inner">
                  <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-foreground tracking-tight">No doctors available nearby</p>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    We couldn't find any specialists in <span className="text-foreground font-black">{location}</span> matching your criteria. Please try a different location or check back later.
                  </p>
                </div>
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  className="px-8 py-4 bg-brand-primary/10 text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
                >
                  Change Location
                </button>
              </div>
            ) : (
              filteredExperts.map((expert) => (
                <div 
                  key={expert.id}
                  className="bg-card/40 border border-border/50 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-6">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full shadow-sm">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black">{expert.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-brand-primary rounded-[2rem] blur opacity-0 group-hover:opacity-20 transition duration-500" />
                      <div className="w-20 h-20 bg-muted rounded-[1.5rem] overflow-hidden relative z-10 border-2 border-card shadow-lg">
                        <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      {expert.available && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-card rounded-full z-20" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-brand-primary transition-colors">{expert.name}</h3>
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">{expert.specialty}</p>
                      <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <MapPin size={14} />
                        <span className="text-xs font-medium">{expert.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Availability</p>
                      <p className={cn(
                        "text-xs font-bold",
                        expert.available ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {expert.available ? 'Available Today' : 'Not Available'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-muted text-muted-foreground rounded-2xl hover:bg-brand-primary/10 hover:text-brand-primary transition-all">
                        <User size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedExpertForBooking(expert)}
                        disabled={!expert.available}
                        className={cn(
                          "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95",
                          expert.available 
                            ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-brand-primary/10 hover:opacity-90" 
                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        )}
                      >
                        {expert.available ? 'Book Consult' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
