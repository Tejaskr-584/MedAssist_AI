import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: any;
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(appointmentsData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching appointments:', err);
      handleFirestoreError(err, OperationType.LIST, 'appointments');
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { appointments, loading, error };
}
