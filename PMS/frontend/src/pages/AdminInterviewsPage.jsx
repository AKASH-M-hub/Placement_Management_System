import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isAdmin } from '../lib/auth';

export default function AdminInterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        const data = await api.getInterviews();
        setInterviews(data);
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

    loadInterviews();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Interview Schedule</h1>
          <p>Review all scheduled interviews in one dedicated workspace.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>Back</button>
      </div>

      <section className="card table-card">
        {loading ? (
          <div className="inline-state">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="inline-state">No interviews scheduled.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Job</th>
                <th>Scheduled At</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Meeting Link</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview.interviewId}>
                  <td>{interview.application?.student?.name || 'N/A'}</td>
                  <td>{interview.application?.job?.title || 'N/A'}</td>
                  <td>{interview.scheduledAt || 'N/A'}</td>
                  <td>{interview.mode || 'N/A'}</td>
                  <td>{interview.status || 'N/A'}</td>
                  <td>{interview.meetingLink ? <a href={interview.meetingLink} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}