import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface DateTimePickerProps {
  value: string; // ISO datetime string (YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  min?: string;
  step?: string;
  className?: string;
}

export default function DateTimePicker({ 
  value, 
  onChange, 
  onBlur,
  min, 
  step,
  className 
}: DateTimePickerProps) {
  const { i18n, t } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parse ISO datetime to components
  const parseDateTime = (isoString: string) => {
    if (!isoString) {
      const now = new Date();
      return {
        date: now.toISOString().split('T')[0],
        hour24: now.getHours(),
        minute: now.getMinutes(),
      };
    }
    const [datePart, timePart] = isoString.split('T');
    const [hourStr, minuteStr] = (timePart || '00:00').split(':');
    return {
      date: datePart,
      hour24: parseInt(hourStr, 10) || 0,
      minute: parseInt(minuteStr, 10) || 0,
    };
  };

  const { date, hour24, minute } = parseDateTime(value);

  // Convert 24h to 12h format
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';

  const [localDate, setLocalDate] = useState(date);
  const [localHour, setLocalHour] = useState(isEnglish ? hour12 : hour24);
  const [localMinute, setLocalMinute] = useState(minute);
  const [localAmPm, setLocalAmPm] = useState(ampm);

  // Update local state when value changes externally
  useEffect(() => {
    const parsed = parseDateTime(value);
    setLocalDate(parsed.date);
    setLocalMinute(parsed.minute);
    if (isEnglish) {
      const h12 = parsed.hour24 === 0 ? 12 : parsed.hour24 > 12 ? parsed.hour24 - 12 : parsed.hour24;
      setLocalHour(h12);
      setLocalAmPm(parsed.hour24 >= 12 ? 'PM' : 'AM');
    } else {
      setLocalHour(parsed.hour24);
    }
  }, [value, isEnglish]);

  const buildISOString = (d: string, h: number, m: number, ap?: string) => {
    let hour24 = h;
    if (isEnglish && ap) {
      // Convert 12h to 24h
      if (ap === 'AM') {
        hour24 = h === 12 ? 0 : h;
      } else {
        hour24 = h === 12 ? 12 : h + 12;
      }
    }
    const hourStr = String(hour24).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    return `${d}T${hourStr}:${minStr}`;
  };

  const handleDateChange = (newDate: string) => {
    setLocalDate(newDate);
    const newValue = buildISOString(newDate, localHour, localMinute, localAmPm);
    onChange(newValue);
  };

  const handleHourChange = (newHour: number) => {
    setLocalHour(newHour);
    const newValue = buildISOString(localDate, newHour, localMinute, localAmPm);
    onChange(newValue);
  };

  const handleMinuteChange = (newMinute: number) => {
    setLocalMinute(newMinute);
    const newValue = buildISOString(localDate, localHour, newMinute, localAmPm);
    onChange(newValue);
  };

  const handleAmPmChange = (newAmPm: string) => {
    setLocalAmPm(newAmPm);
    const newValue = buildISOString(localDate, localHour, localMinute, newAmPm);
    onChange(newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      const finalValue = buildISOString(localDate, localHour, localMinute, localAmPm);
      onBlur(finalValue);
    }
  };

  // Mobile version - always use select dropdowns
  if (isMobile) {
    const hours24Array = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 4 }, (_, i) => i * 15); // 0, 15, 30, 45

    return (
      <div style={{ width: '100%' }} className="datetime-picker-mobile">
        {/* Date selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem', 
            fontSize: '0.95rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            📅 <span>{t("reservation.date") || "Dátum"}</span>
          </label>
          <input
            type="date"
            value={localDate}
            onChange={(e) => handleDateChange(e.target.value)}
            onBlur={handleBlur}
            min={min?.split('T')[0]}
            className="datetime-picker-input"
            style={{
              width: '100%',
              padding: '1rem !important',
              fontSize: '1.05rem !important',
              borderRadius: '12px',
              border: '2px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              transition: 'all 0.3s ease',
              fontWeight: '500',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Time selectors */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem', 
            fontSize: '0.95rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            🕐 <span>{t("reservation.time") || "Idő"}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontWeight: '500',
              }}>
                {isEnglish ? t("reservation.hour") || "Hour" : t("reservation.hour") || "Óra"}
              </label>
              <select
                value={isEnglish ? localHour : hour24}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isEnglish) {
                    handleHourChange(val);
                  } else {
                    const newValue = buildISOString(localDate, val, localMinute);
                    onChange(newValue);
                  }
                }}
                onBlur={handleBlur}
                className="datetime-picker-select"
                style={{
                  width: '100%',
                  padding: '1rem !important',
                  fontSize: '1.05rem !important',
                  fontWeight: '600',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '2px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
              >
                {isEnglish ? (
                  Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))
                ) : (
                  hours24Array.map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontWeight: '500',
              }}>
                {t("reservation.minute") || "Perc"}
              </label>
              <select
                value={localMinute}
                onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                onBlur={handleBlur}
                className="datetime-picker-select"
                style={{
                  width: '100%',
                  padding: '1rem !important',
                  fontSize: '1.05rem !important',
                  fontWeight: '600',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '2px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
              >
                {minutes.map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AM/PM for English */}
        {isEnglish && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleAmPmChange('AM')}
                style={{
                  padding: '1rem',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  border: `2px solid ${localAmPm === 'AM' ? 'rgba(103, 126, 234, 0.8)' : 'var(--glass-border)'}`,
                  background: localAmPm === 'AM' ? 'rgba(103, 126, 234, 0.3)' : 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                🌅 AM
              </button>
              <button
                type="button"
                onClick={() => handleAmPmChange('PM')}
                style={{
                  padding: '1rem',
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  border: `2px solid ${localAmPm === 'PM' ? 'rgba(103, 126, 234, 0.8)' : 'var(--glass-border)'}`,
                  background: localAmPm === 'PM' ? 'rgba(103, 126, 234, 0.3)' : 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                🌙 PM
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version - For Hungarian or when using 24h format
  if (!isEnglish) {
    return (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur && onBlur(e.target.value)}
        min={min}
        step={step}
        className={className}
      />
    );
  }

  // For English - custom AM/PM picker
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 4 }, (_, i) => i * 15); // 0, 15, 30, 45

  return (
    <div className="datetime-picker-wrapper" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="date"
        value={localDate}
        onChange={(e) => handleDateChange(e.target.value)}
        onBlur={handleBlur}
        min={min?.split('T')[0]}
        className={className}
        style={{ flex: '1 1 100%', minWidth: '0' }}
      />
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1 1 100%' }}>
        <select
          value={localHour}
          onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
          onBlur={handleBlur}
          className={className}
          style={{ flex: '1', minWidth: '60px', maxWidth: '80px' }}
        >
          {hours12.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>:</span>
        
        <select
          value={localMinute}
          onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
          onBlur={handleBlur}
          className={className}
          style={{ flex: '1', minWidth: '60px', maxWidth: '80px' }}
        >
          {minutes.map(m => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        
        <select
          value={localAmPm}
          onChange={(e) => handleAmPmChange(e.target.value)}
          onBlur={handleBlur}
          className={className}
          style={{ flex: '1', minWidth: '70px', maxWidth: '90px' }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
