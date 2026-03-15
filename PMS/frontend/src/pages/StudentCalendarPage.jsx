import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isStudent } from '../lib/auth';
import {
  buildDeadlineCalendarEvent,
  buildGoogleCalendarUrl,
  buildInterviewCalendarEvent,
  downloadCalendarEvent,
} from '../lib/calendar';

export default function StudentCalendarPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true);
        const [applicationsData, interviewsData] = await Promise.all([
          api.getStudentApplications(),
          api.getStudentInterviews(),
        ]);
        setApplications(applicationsData);
        setInterviews(interviewsData);
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

    loadCalendar();
  }, []);

  const events = useMemo(() => {
    const deadlineEvents = applications
      .filter((item) => item.job?.deadlineDate)
      .map((application) => ({
        kind: 'Deadline',
        label: application.job?.deadlineDate,
        sourceId: `deadline-${application.applicationId}`,
        details: buildDeadlineCalendarEvent(application),
      }));

    const interviewEvents = interviews
      .filter((item) => item.scheduledAt)
      .map((interview) => ({
        kind: 'Interview',
        label: interview.scheduledAt,
        sourceId: `interview-${interview.interviewId}`,
        details: buildInterviewCalendarEvent(interview),
      }));

    return [...interviewEvents, ...deadlineEvents].sort((first, second) => {
      const firstTime = first.details.start.getTime();
      const secondTime = second.details.start.getTime();
      return firstTime - secondTime;
    });
  }, [applications, interviews]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Placement Calendar</h1>
          <p>Export interview and deadline events to your calendar or sync them into Google Calendar.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/student-dashboard')}>Back</button>
      </div>

      {loading ? (
        <div className="card">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="card">No events available yet.</div>
      ) : (
        <div className="stack-list">
          {events.map((event) => (
            <section key={event.sourceId} className="card calendar-card">
              <div className="calendar-card__content">
                <div>
                  <span className="status-chip">{event.kind}</span>
                  <h2>{event.details.title}</h2>
                  <p>{event.label}</p>
                  {event.details.description ? <p>{event.details.description}</p> : null}
                </div>
                <div className="inline-actions">
                  <button className="btn" onClick={() => downloadCalendarEvent(event.details)}>Download ICS</button>
                  <a className="btn btn-secondary" href={buildGoogleCalendarUrl(event.details)} target="_blank" rel="noreferrer">Open in Google Calendar</a>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}