import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isStudent } from '../lib/auth';

export default function StudentJobReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const [job, setJob] = useState(location.state?.job || null);
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [loading, setLoading] = useState(!location.state?.job);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken() || !isStudent()) {
      clearAuth();
      navigate('/login');
      return;
    }

    const loadJob = async () => {
      if (job) {
        return;
      }

      try {
        setLoading(true);
        const jobs = await api.getJobs();
        const selected = jobs.find((item) => String(item.jobId) === String(jobId));
        if (!selected) {
          window.alert('Job not found');
          navigate('/student-dashboard');
          return;
        }
        if (selected.applied) {
          window.alert('You already applied for this job');
          navigate('/student-dashboard');
          return;
        }
        setJob(selected);
      } catch {
        clearAuth();
        window.alert('Please login first');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [job, jobId, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const trimmed = reviewOpinion.trim();

    if (!trimmed) {
      window.alert('Review opinion is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.applyJob(jobId, trimmed);
      window.alert('Applied successfully ✅');
      navigate('/student-dashboard');
    } catch (error) {
      window.alert(error.message || 'Unable to apply for this job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Apply With Review</h1>
          <p>Share your opinion before submitting your application.</p>
        </div>
      </div>

      <section className="card">
        <h2 className="section-title">Job Details</h2>
        <div className="job-review-meta">
          <p><strong>Title:</strong> {job.title}</p>
          <p><strong>Salary:</strong> Rs. {job.salary}</p>
          <p><strong>Eligibility CGPA:</strong> {job.eligibilityCgpa}</p>
          <p><strong>Deadline:</strong> {job.deadlineDate}</p>
        </div>

        <form onSubmit={onSubmit} className="review-form">
          <div className="field">
            <label htmlFor="reviewOpinion">Your Review Opinion (Required)</label>
            <textarea
              id="reviewOpinion"
              rows="5"
              placeholder="Why are you interested in this job? Mention your suitability and motivation."
              value={reviewOpinion}
              onChange={(event) => setReviewOpinion(event.target.value)}
            />
          </div>

          <div className="actions review-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/student-dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
