import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface LocationContextType {
  location: string;
  setLocation: (location: string) => void;
  useCurrentLocation: () => Promise<void>;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<string>(() => {
    return localStorage.getItem('user_location') || 'Bangalore, India';
  });
  const [isLoading, setIsLoading] = useState(false);

  const setLocation = (newLocation: string) => {
    setLocationState(newLocation);
    localStorage.setItem('user_location', newLocation);
  };

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // In a real app, we'd use reverse geocoding here.
          // For this demo, we'll simulate it.
          const { latitude, longitude } = position.coords;
          console.log('Lat/Long:', latitude, longitude);
          
          // Simulating reverse geocoding
          const mockLocation = 'Bangalore, India'; 
          setLocation(mockLocation);
        } catch (error) {
          console.error('Error getting location name:', error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        alert('Unable to retrieve your location');
      }
    );
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, useCurrentLocation, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
