import { useState } from 'react';

export function useEmergency() {
  const [isEmergency, setIsEmergency] = useState(false);

  return { isEmergency, setIsEmergency };
}
