import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import { FileText, Download, Plus, RefreshCw, AlertCircle, CheckCircle, Cloud, ShieldCheck, ExternalLink } from 'lucide-react';

export const ReportsView = () => {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getFiles();
      if (res.success) {
        setFiles(res.files);
      }
    } catch (err) {
      setError(err.message || 'Failed to list stored files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleGenerate = async (format) => {
    setGenerating(true);
    setError('');
    toast.info(`Generating ${format} report on EC2 instance & streaming to Amazon S3...`);
    try {
      const res = await api.generateReport(format);
      if (res.success) {
        toast.success(`Generated ${format} audit report (${res.file.file_name}) successfully stored in S3 bucket (${res.file.s3_bucket}).`);
        fetchFiles();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      toast.info(`Generating AWS S3 secure 15-minute Pre-signed URL...`);
      const res = await api.getDownloadUrl(file.id);
      if (res.success && res.downloadUrl) {
        if (res.isPresignedS3) {
          toast.success(`Opening private S3 pre-signed link.`);
          window.open(res.downloadUrl, '_blank');
        } else {
          toast.success(`Opening report file.`);
          window.open(`${API_BASE_URL}${res.downloadUrl}`, '_blank');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve S3 download URL');
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Cloud Reports & File Storage (S3)</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Automated utilization audits and PDF/CSV report generation backed by Amazon S3 & IAM
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            disabled={generating}
            onClick={() => handleGenerate('PDF')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} /> {generating ? 'Generating PDF...' : 'Generate PDF Audit'}
          </button>
          <button
            disabled={generating}
            onClick={() => handleGenerate('CSV')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} /> Generate CSV Data
          </button>
          <button onClick={fetchFiles} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Cloud Architecture Badge Card */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '14px',
        padding: '16px 22px',
        marginBottom: '24px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cloud size={20} color="var(--accent-primary)" />
          <span>
            Reports are generated server-side on EC2, streamed to private S3 bucket, and accessed via temporary 15-minute Pre-signed URLs.
          </span>
        </div>
        <span className="badge badge-blue">IAM Scoped Access</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '10px' }}>Querying Amazon S3 object metadata...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No reports generated yet</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Click "Generate PDF Audit" or "Generate CSV Data" above to generate a live report from real database bookings.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Report / File Name</th>
                <th style={{ padding: '12px 16px' }}>Format</th>
                <th style={{ padding: '12px 16px' }}>Size</th>
                <th style={{ padding: '12px 16px' }}>S3 Bucket</th>
                <th style={{ padding: '12px 16px' }}>Created Date (IST)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--accent-primary)" />
                      <span>{f.file_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${f.file_type === 'REPORT_PDF' ? 'badge-red' : 'badge-green'}`}>
                      {f.file_type === 'REPORT_PDF' ? 'PDF' : 'CSV'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {(f.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {f.s3_bucket}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(f.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDownload(f)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Download size={13} /> S3 Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
