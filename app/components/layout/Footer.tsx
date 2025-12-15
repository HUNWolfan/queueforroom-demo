import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const [showBugModal, setShowBugModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium"
  });
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      setShowBugModal(false);
      setFormData({ title: "", description: "", severity: "medium" });
      alert(t('footer.reportSubmitted'));
    }
  };

  return (
    <>
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.5rem 1rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <style>{`
          @media (max-width: 640px) {
            footer {
              padding: 0.25rem 0.75rem !important;
            }
            .footer-copyright {
              display: none !important;
            }
            .footer-demo-badge-desktop {
              display: none !important;
            }
          }
          @media (min-width: 641px) {
            .footer-demo-badge-mobile {
              display: none !important;
            }
          }
        `}</style>
        <div className="footer-copyright" style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span>© {currentYear} QueueForRoom. {t("footer.allRightsReserved")}</span>
          <span className="footer-demo-badge-desktop" style={{
            background: 'rgba(255, 152, 0, 0.2)',
            color: '#ff9800',
            padding: '0.25rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            border: '1px solid rgba(255, 152, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🚧 Demo
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="footer-demo-badge-mobile" style={{
            background: 'rgba(255, 152, 0, 0.2)',
            color: '#ff9800',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: '600',
            border: '1px solid rgba(255, 152, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🚧 DEMO
          </span>
          <button
          onClick={() => setShowBugModal(true)}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '0.4rem 0.9rem',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '1rem' }}>🐛</span>
          {t("footer.reportBug")}
        </button>
        </div>
      </footer>

      {/* Responsive Bug Report Modal with Theme Support */}
      {showBugModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease',
          padding: '1rem'
        }}
        onClick={() => setShowBugModal(false)}
        >
          <div 
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideUp 0.3s ease',
              boxShadow: '0 20px 40px var(--shadow-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.25rem', 
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  🐛 {t("footer.bugReport")}
                </h2>
                <p style={{
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {t("footer.bugReportDescription")}
                </p>
              </div>
              <button
                onClick={() => setShowBugModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--glass-bg)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {t("footer.bugTitle")}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t("footer.bugTitlePlaceholder")}
                  required
                  className="bug-report-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(103, 126, 234, 1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {t("footer.bugDescription")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("footer.bugDescriptionPlaceholder")}
                  required
                  rows={5}
                  className="bug-report-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    minHeight: '100px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(103, 126, 234, 1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {t("footer.severity")}
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="bug-report-select"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(103, 126, 234, 1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(103, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="low" style={{ background: '#2a2438', color: '#ffffff' }}>{t("footer.severityLow")}</option>
                  <option value="medium" style={{ background: '#2a2438', color: '#ffffff' }}>{t("footer.severityMedium")}</option>
                  <option value="high" style={{ background: '#2a2438', color: '#ffffff' }}>{t("footer.severityHigh")}</option>
                  <option value="critical" style={{ background: '#2a2438', color: '#ffffff' }}>{t("footer.severityCritical")}</option>
                </select>
              </div>

              {/* Action Buttons - Responsive */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setShowBugModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--glass-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    minWidth: '120px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t("footer.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Bug report form inputs */
        .bug-report-input::placeholder {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .bug-report-select option {
          background: #2a2438 !important;
          color: #ffffff !important;
        }

        [data-theme="light"] .bug-report-input {
          background: rgba(0, 0, 0, 0.05) !important;
          color: #1a202c !important;
        }

        [data-theme="light"] .bug-report-input::placeholder {
          color: rgba(0, 0, 0, 0.5) !important;
        }

        [data-theme="light"] .bug-report-select {
          background: rgba(0, 0, 0, 0.05) !important;
          color: #1a202c !important;
        }

        [data-theme="light"] .bug-report-select option {
          background: #ffffff !important;
          color: #1a202c !important;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          footer {
            padding: 0.25rem 0.75rem !important;
            font-size: 0.7rem !important;
            flex-direction: column !important;
            gap: 0.25rem !important;
            align-items: flex-start !important;
          }
          
          footer button {
            font-size: 0.7rem !important;
            padding: 0.25rem 0.6rem !important;
          }
          
          footer > div {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
        }

        /* Tablet and small screens */
        @media (max-width: 768px) {
          .modal-content form {
            padding: 1rem !important;
          }
          
          .modal-header {
            padding: 1rem !important;
          }

          .modal-header h2 {
            font-size: 1.1rem !important;
          }

          button[type="submit"],
          button[type="button"] {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
