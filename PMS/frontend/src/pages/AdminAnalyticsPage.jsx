import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isAdmin } from '../lib/auth';

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch {
        clearAuth();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    if (!getToken() || !isAdmin()) {
      clearAuth();
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, []);

  const downloadAnalytics = async () => {
    try {
      const blob = await api.downloadAnalyticsReport();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics-report.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error.message || 'Download failed');
    }
  };

  const jobRows = analytics?.applicationsByJob || [];
  const departmentRows = analytics?.selectedByDepartment || [];
  const maxJobCount = Math.max(1, ...jobRows.map((item) => Number(item[1] || 0)));

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Analytics Workspace</h1>
          <p>Review placement performance and export the current report as PDF.</p>
        </div>
        <div className="inline-actions">
          <button className="btn" onClick={downloadAnalytics}>Download PDF</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>Back</button>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading analytics...</div>
      ) : !analytics ? (
        <div className="card">Analytics are unavailable.</div>
      ) : (
        <>
          <section className="card table-card">
            <div className="analytics-grid analytics-grid--compact">
              <div className="mini-card"><strong>Total Applications</strong><p>{analytics.totalApplications}</p></div>
              <div className="mini-card"><strong>Selected</strong><p>{analytics.selected}</p></div>
              <div className="mini-card"><strong>Rejected</strong><p>{analytics.rejected}</p></div>
              <div className="mini-card"><strong>Offered</strong><p>{analytics.offered}</p></div>
              <div className="mini-card"><strong>Selection Rate</strong><p>{Number(analytics.selectionRate || 0).toFixed(2)}%</p></div>
            </div>
          </section>

          <section className="card table-card">
            <h2 className="section-title">Applications by Job</h2>
            <div className="stack-list">
              {jobRows.length === 0 ? <p>No job analytics available.</p> : jobRows.map(([jobTitle, count]) => (
                <div key={jobTitle} className="bar-row">
                  <div className="bar-row__label">{jobTitle}</div>
                  <div className="bar-row__track">
                    <div className="bar-row__fill" style={{ width: `${(Number(count) / maxJobCount) * 100}%` }} />
                  </div>
                  <div className="bar-row__value">{count}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card table-card">
            <h2 className="section-title">Selected by Department</h2>
            {departmentRows.length === 0 ? (
              <p>No department analytics available.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Selected Count</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentRows.map(([department, count]) => (
                    <tr key={department}>
                      <td>{department}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}