import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SystemMessage {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  active: boolean;
}

export default function SystemBanner() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch system messages from API
    fetch("/api/system-messages")
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {
        // Silently fail - no messages to show
      });
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
      }, 8000); // Change message every 8 seconds

      return () => clearInterval(interval);
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return null;
  }

  const currentMessage = messages[currentIndex];
  const bgColors = {
    info: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
    warning: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
    success: 'linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))'
  };

  const borderColors = {
    info: 'rgba(59, 130, 246, 0.4)',
    warning: 'rgba(245, 158, 11, 0.4)',
    success: 'rgba(34, 197, 94, 0.4)'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: bgColors[currentMessage.type],
      borderBottom: `1px solid ${borderColors[currentMessage.type]}`,
      backdropFilter: 'blur(10px)',
      padding: '0.5rem 2rem',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        animation: 'slideInFromLeft 1s ease-out'
      }}>
        <span>{icons[currentMessage.type]}</span>
        <span>{currentMessage.message}</span>
        {messages.length > 1 && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            marginLeft: '1rem'
          }}>
            ({currentIndex + 1}/{messages.length})
          </span>
        )}
      </div>
    </div>
  );
}
