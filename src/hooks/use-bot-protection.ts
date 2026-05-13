import { useState, useEffect } from 'react';

export function useBotProtection() {
  const [startTime] = useState(Date.now());
  const [honeypot, setHoneypot] = useState('');

  const validateSubmission = () => {
    // 1. Honeypot check: If the hidden field is filled, it's likely a bot
    if (honeypot) {
      console.warn('Bot detected: Honeypot field filled');
      return false;
    }

    // 2. Time-to-submit check: If submitted too fast (< 3 seconds), it's likely a bot
    const timeElapsed = Date.now() - startTime;
    if (timeElapsed < 3000) {
      console.warn('Bot detected: Form submitted too fast');
      return false;
    }

    return true;
  };

  return {
    honeypot,
    setHoneypot,
    validateSubmission
  };
}
