import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isStudent } from '../lib/auth';
import { buildGoogleCalendarUrl, buildInterviewCalendarEvent, downloadCalendarEvent } from '../lib/calendar';

export default function StudentInterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        const data = await api.getStudentInterviews();
        setInterviews(data);
      } catch {
        clearAuth();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    if (!getToken() || !isStudent()) {
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
          <h1>Interviews</h1>
          <p>View upcoming interview schedules and export them to your calendar.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/student-dashboard')}>Back</button>
      </div>

      <section className="card table-card">
        {loading ? (
          <div className="inline-state">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="inline-state">No interviews scheduled yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Scheduled At</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Join</th>
                <th>Calendar</th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => {
                const event = buildInterviewCalendarEvent(interview);
                return (
                  <tr key={interview.interviewId}>
                    <td>{interview.application?.job?.title || 'N/A'}</td>
                    <td>{interview.scheduledAt || 'N/A'}</td>
                    <td>{interview.mode || 'N/A'}</td>
                    <td>{interview.status || 'N/A'}</td>
                    <td>{interview.meetingLink ? <a href={interview.meetingLink} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-secondary" onClick={() => downloadCalendarEvent(event)}>ICS</button>
                        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noreferrer">Google</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}