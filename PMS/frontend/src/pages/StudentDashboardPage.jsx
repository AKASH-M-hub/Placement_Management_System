import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isStudent } from '../lib/auth';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [profile, setProfile] = useState({
    name: '',
    dept: '',
    cgpa: '',
    skills: '',
    portfolioUrl: '',
  });
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [feedbackForm, setFeedbackForm] = useState({
    applicationId: '',
    comment: '',
    rating: 5,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [jobsData, applicationsData, profileData, feedbackData] = await Promise.all([
        api.getJobs(),
        api.getStudentApplications(),
        api.getStudentProfile(),
        api.getStudentFeedback(),
      ]);

      setJobs(jobsData);
      setApplications(applicationsData);
      setFeedbackItems(feedbackData);

      if (profileData?.student) {
        setProfile({
          name: profileData.student.name || '',
          dept: profileData.student.dept || '',
          cgpa: profileData.student.cgpa ?? '',
          skills: profileData.student.skills || '',
          portfolioUrl: profileData.student.portfolioUrl || '',
        });
        setProfileCompleteness(profileData.completeness?.percentage ?? 0);
      }
    } catch {
      clearAuth();
      window.alert('Please login first');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken() || !isStudent()) {
      clearAuth();
      navigate('/login');
      return;
    }
    loadDashboard();
  }, []);

  const openReviewPage = (job) => {
    navigate(`/student-review/${job.jobId}`, { state: { job } });
  };

  const saveProfile = async () => {
    try {
      const payload = {
        ...profile,
        cgpa: profile.cgpa === '' ? null : Number(profile.cgpa),
      };
      const response = await api.updateStudentProfile(payload);
      setProfileCompleteness(response.completeness?.percentage ?? 0);
      window.alert('Profile updated');
    } catch (error) {
      window.alert(error.message || 'Failed to update profile');
    }
  };

  const uploadDocument = async (type, file) => {
    if (!file) {
      return;
    }
    try {
      await api.uploadStudentDocument(type, file);
      window.alert(`${type} uploaded`);
      const refreshed = await api.getStudentProfile();
      setProfileCompleteness(refreshed.completeness?.percentage ?? 0);
    } catch (error) {
      window.alert(error.message || 'Upload failed');
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.applicationId || !feedbackForm.comment.trim()) {
      window.alert('Select application and enter feedback comment');
      return;
    }

    try {
      await api.submitStudentFeedback({
        applicationId: Number(feedbackForm.applicationId),
        comment: feedbackForm.comment,
        rating: Number(feedbackForm.rating),
      });
      window.alert('Feedback submitted');
      setFeedbackForm({ applicationId: '', comment: '', rating: 5 });
      const list = await api.getStudentFeedback();
      setFeedbackItems(list);
    } catch (error) {
      window.alert(error.message || 'Failed to submit feedback');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>Track your placements lifecycle and apply to new opportunities.</p>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading dashboard...</div>
      ) : (
        <>
          <section className="page-link-grid">
            <button type="button" className="nav-card" onClick={() => navigate('/student-calendar')}>
              <span className="nav-card__eyebrow">Calendar</span>
              <h2>Export and Sync Events</h2>
              <p>Download ICS files or push deadlines and interviews into Google Calendar.</p>
            </button>

            <button type="button" className="nav-card" onClick={() => navigate('/student-interviews')}>
              <span className="nav-card__eyebrow">Interviews</span>
              <h2>{applications.filter((item) => item.status === 'INTERVIEW_SCHEDULED').length} Scheduled</h2>
              <p>Open the dedicated interview workspace to view timings, meeting links, and calendar actions.</p>
            </button>

            <button type="button" className="nav-card" onClick={() => navigate('/student-offers')}>
              <span className="nav-card__eyebrow">Offers</span>
              <h2>{applications.filter((item) => item.status === 'OFFERED' || item.status === 'SELECTED').length} Active</h2>
              <p>Review offers and respond from a dedicated page instead of the dashboard.</p>
            </button>
          </section>

          <section className="card table-card">
            <h2 className="section-title">Applied Jobs</h2>
            {applications.length === 0 ? (
              <p>No applications yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th>Review Opinion</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.applicationId}>
                      <td>{application.job?.title || 'N/A'}</td>
                      <td><span className="status-chip">{application.status}</span></td>
                      <td>{application.appliedDate || 'N/A'}</td>
                      <td className="review-cell">{application.reviewOpinion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card student-layout">
            <div>
              <h2 className="section-title">Profile & Documents</h2>
              <p className="profile-meter">Profile completeness: {profileCompleteness}%</p>
              <div className="form-grid">
                <div className="field">
                  <label>Name</label>
                  <input
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Department</label>
                  <input
                    value={profile.dept}
                    onChange={(event) => setProfile({ ...profile, dept: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.cgpa}
                    onChange={(event) => setProfile({ ...profile, cgpa: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Skills</label>
                  <input
                    value={profile.skills}
                    onChange={(event) => setProfile({ ...profile, skills: event.target.value })}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Portfolio URL</label>
                  <input
                    value={profile.portfolioUrl}
                    onChange={(event) => setProfile({ ...profile, portfolioUrl: event.target.value })}
                  />
                </div>
              </div>
              <div className="actions">
                <button className="btn" onClick={saveProfile}>Save Profile</button>
              </div>

              <div className="document-row">
                <label className="upload-control">
                  Upload Resume
                  <input
                    type="file"
                    onChange={(event) => uploadDocument('resume', event.target.files?.[0])}
                  />
                </label>
                <label className="upload-control">
                  Upload Certificates
                  <input
                    type="file"
                    onChange={(event) => uploadDocument('certificates', event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
            <div>
              <h2 className="section-title">Quick Snapshot</h2>
              <div className="stack-list">
                <div className="mini-card">
                  <strong>{applications.length}</strong>
                  <p>Total applications submitted</p>
                </div>
                <div className="mini-card">
                  <strong>{applications.filter((item) => item.status === 'INTERVIEW_SCHEDULED').length}</strong>
                  <p>Interview stages reached</p>
                </div>
                <div className="mini-card">
                  <strong>{applications.filter((item) => item.status === 'OFFERED' || item.status === 'SELECTED').length}</strong>
                  <p>Offers and final selections</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card table-card">
            <h2 className="section-title">Submit Feedback</h2>
            <div className="form-grid">
              <div className="field">
                <label>Application</label>
                <select
                  value={feedbackForm.applicationId}
                  onChange={(event) => setFeedbackForm({ ...feedbackForm, applicationId: event.target.value })}
                >
                  <option value="">Select application</option>
                  {applications.map((item) => (
                    <option key={item.applicationId} value={item.applicationId}>
                      {(item.job?.title || 'Job')} - {item.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Rating</label>
                <select
                  value={feedbackForm.rating}
                  onChange={(event) => setFeedbackForm({ ...feedbackForm, rating: event.target.value })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Comment</label>
                <textarea
                  rows={3}
                  value={feedbackForm.comment}
                  onChange={(event) => setFeedbackForm({ ...feedbackForm, comment: event.target.value })}
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={submitFeedback}>Submit Feedback</button>
            </div>

            <div className="stack-list">
              {feedbackItems.map((item) => (
                <div key={item.feedbackId} className="mini-card">
                  <strong>{item.application?.job?.title || 'Application'}</strong>
                  <p>{item.comment}</p>
                  <small>Rating: {item.rating}/5</small>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Open Jobs</h2>
            <div className="job-grid">
              {jobs.map((job) => (
                <div key={job.jobId} className="job-card">
                  <div>
                    <h3>{job.title}</h3>
                    <p className="job-meta">Salary: ₹{job.salary}</p>
                    <p className="job-meta">Eligibility CGPA: {job.eligibilityCgpa}</p>
                    <p className="job-meta">Deadline: {job.deadlineDate}</p>
                  </div>
                  {job.applied ? (
                    <button className="btn btn-muted" disabled>
                      Registered
                    </button>
                  ) : (
                    <button className="btn" onClick={() => openReviewPage(job)}>
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
