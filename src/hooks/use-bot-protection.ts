import { useState } from 'react';

export function useBotProtection() {
  const [startTime] = useState(Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const onInteraction = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  const validateSubmission = () => {
    // 1. Honeypot check: If the hidden field is filled, it's likely a bot
    if (honeypot) {
      console.warn('Bot detected: Honeypot field filled');
      return false;
    }

    // 2. Interaction check: If no focus/click events were triggered, it's likely a bot
    if (!hasInteracted) {
      console.warn('Bot detected: No user interaction detected');
      return false;
    }

    // 3. Time-to-submit check: If submitted too fast (< 3 seconds), it's likely a bot
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
    onInteraction,
    validateSubmission
  };
}

