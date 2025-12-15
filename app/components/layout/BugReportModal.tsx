import { useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");

  // Show success message and close modal
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success) {
      alert(t("bugReport.reportSubmitted") || "Bug report submitted successfully!");
      setTitle("");
      setDescription("");
      setSeverity("medium");
      onClose();
    }
  }, [fetcher.data, onClose, t]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert(t("bugReport.fillAllFields") || "Please fill in all fields");
      return;
    }

    fetcher.submit(
      {
        intent: "submitReport",
        title,
        description,
        severity,
      },
      { method: "post", action: "/api/bug-reports" }
    );
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          maxWidth: '500px',
          width: '90%',
        }}
      >
        <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🐛 {t("bugReport.bugReport") || "Bug Report"}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {t("bugReport.bugReportDescription") || "Help us improve by reporting bugs."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>{t("bugReport.title") || "Title"}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("bugReport.titlePlaceholder") || "Brief description of the problem"}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>{t("bugReport.description") || "Description"}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("bugReport.descriptionPlaceholder") || "Detailed description of the problem and steps to reproduce"}
              required
              rows={6}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>{t("bugReport.severity") || "Severity"}</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high")}
              style={{ width: '100%' }}
            >
              <option value="low">{t("bugReport.low") || "Low - Minor issue"}</option>
              <option value="medium">{t("bugReport.medium") || "Medium - Affects functionality"}</option>
              <option value="high">{t("bugReport.high") || "High - Critical problem"}</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary"
              disabled={fetcher.state === 'submitting'}
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button 
              type="submit"
              className="btn-primary"
              disabled={fetcher.state === 'submitting'}
            >
              {fetcher.state === 'submitting' 
                ? (t("common.sending") || "Sending...") 
                : (t("bugReport.submit") || "Submit Report")
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
