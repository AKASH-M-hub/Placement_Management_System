import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isAdmin } from '../lib/auth';

const initialJob = {
  title: '',
  salary: '',
  eligibilityCgpa: '',
  deadlineDate: '',
  registrationLink: '',
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minCgpaFilter, setMinCgpaFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('SHORTLISTED');
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'appliedDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [job, setJob] = useState(initialJob);
  const pageSize = 8;

  const loadApplications = async (params = {}) => {
    try {
      setLoadingApplications(true);
      const data = await api.getApplications(params);
      setApplications(data);
    } catch {
      clearAuth();
      window.alert('Admin login required');
      navigate('/login');
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (!getToken() || !isAdmin()) {
      clearAuth();
      navigate('/login');
      return;
    }
    loadApplications();
  }, []);

  const onAddJob = async () => {
    const { title, salary, eligibilityCgpa, deadlineDate, registrationLink } = job;

    if (!title || !salary || !eligibilityCgpa || !deadlineDate || !registrationLink) {
      window.alert('Please fill in all job fields');
      return;
    }

    if (Number.isNaN(Number(salary)) || Number.isNaN(Number(eligibilityCgpa))) {
      window.alert('Salary and CGPA must be valid numbers');
      return;
    }

    try {
      await api.addJob({
        title,
        salary: Number(salary),
        eligibilityCgpa: Number(eligibilityCgpa),
        deadlineDate,
        registrationLink,
      });
      window.alert('Job added successfully ✅');
      setJob(initialJob);
      loadApplications(buildServerFilters());
    } catch (error) {
      window.alert(error.message || 'Only admin can add jobs');
    }
  };

  const buildServerFilters = () => ({
    status: statusFilter === 'ALL' ? '' : statusFilter,
    department: departmentFilter,
    skill: skillFilter,
    minCgpa: minCgpaFilter,
  });

  const applyServerFilters = async () => {
    setCurrentPage(1);
    setExpandedApplicationId(null);
    await loadApplications(buildServerFilters());
  };

  const toggleSelect = (applicationId) => {
    setSelectedIds((ids) => (ids.includes(applicationId)
      ? ids.filter((id) => id !== applicationId)
      : [...ids, applicationId]));
  };

  const updateStatus = async (applicationId, status) => {
    const remarks = window.prompt(`Remarks for ${status} (optional):`, '') || '';
    try {
      await api.updateApplicationStatus(applicationId, { status, remarks });
      await loadApplications(buildServerFilters());
      window.alert('Application status updated');
    } catch (error) {
      window.alert(error.message || 'Could not update status');
    }
  };

  const runBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) {
      window.alert('Select at least one application');
      return;
    }

    try {
      await api.bulkUpdateStatus({
        applicationIds: selectedIds,
        status: bulkStatus,
        remarks: bulkRemarks,
      });
      setSelectedIds([]);
      setBulkRemarks('');
      await loadApplications(buildServerFilters());
      window.alert('Bulk update completed');
    } catch (error) {
      window.alert(error.message || 'Bulk update failed');
    }
  };

  const scheduleInterview = async (applicationId) => {
    const scheduledAt = window.prompt('Interview date-time (YYYY-MM-DDTHH:mm):', '');
    if (!scheduledAt) {
      return;
    }
    const mode = window.prompt('Interview mode (ONLINE/OFFLINE):', 'ONLINE') || 'ONLINE';
    const meetingLink = window.prompt('Meeting link (optional):', '') || '';
    const remarks = window.prompt('Remarks (optional):', '') || '';
    try {
      await api.scheduleInterview(applicationId, { scheduledAt, mode, meetingLink, remarks });
      await loadApplications(buildServerFilters());
      window.alert('Interview scheduled');
    } catch (error) {
      window.alert(error.message || 'Unable to schedule interview');
    }
  };

  const issueOffer = async (applicationId) => {
    const offeredCtc = window.prompt('Offered CTC:', '');
    if (!offeredCtc) {
      return;
    }
    const remarks = window.prompt('Offer remarks (optional):', '') || '';
    try {
      await api.issueOffer(applicationId, { offeredCtc: Number(offeredCtc), remarks });
      await loadApplications(buildServerFilters());
      window.alert('Offer issued');
    } catch (error) {
      window.alert(error.message || 'Unable to issue offer');
    }
  };

  const normalizedApplications = useMemo(
    () => applications.map((application) => {
      const student = application.student || {};
      const jobData = application.job || {};

      return {
        ...application,
        studentName: student.name || application.studentName || 'N/A',
        studentEmail: student.email || application.studentEmail || 'N/A',
        studentDept: student.dept || 'N/A',
        studentCgpa: student.cgpa ?? 'N/A',
        studentSkills: student.skills || 'N/A',
        jobTitle: jobData.title || application.jobTitle || 'N/A',
        appliedDate: application.appliedDate || 'N/A',
        status: application.status || 'N/A',
        reviewOpinion: application.reviewOpinion || 'No review provided',
      };
    }),
    [applications]
  );

  const jobOptions = useMemo(() => {
    const uniqueTitles = [...new Set(normalizedApplications.map((item) => item.jobTitle))];
    return uniqueTitles.filter((title) => title !== 'N/A').sort((a, b) => a.localeCompare(b));
  }, [normalizedApplications]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return normalizedApplications.filter((application) => {
      const matchesSearch = !query
        || application.studentName.toLowerCase().includes(query)
        || application.studentEmail.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesJob = jobFilter === 'ALL' || application.jobTitle === jobFilter;
      return matchesSearch && matchesStatus && matchesJob;
    });
  }, [normalizedApplications, searchTerm, statusFilter, jobFilter]);

  const sortedApplications = useMemo(() => {
    const sortable = [...filteredApplications];
    const { key, direction } = sortConfig;

    sortable.sort((first, second) => {
      const firstValue = first[key] ?? '';
      const secondValue = second[key] ?? '';

      if (key === 'appliedDate') {
        const firstDate = Date.parse(firstValue) || 0;
        const secondDate = Date.parse(secondValue) || 0;
        return direction === 'asc' ? firstDate - secondDate : secondDate - firstDate;
      }

      const compareResult = String(firstValue).localeCompare(String(secondValue), undefined, {
        sensitivity: 'base',
        numeric: true,
      });

      return direction === 'asc' ? compareResult : -compareResult;
    });

    return sortable;
  }, [filteredApplications, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedApplications.slice(start, start + pageSize);
  }, [currentPage, sortedApplications]);

  const pageNumbers = useMemo(() => {
    const visible = 5;
    const firstPage = Math.max(1, currentPage - 2);
    const lastPage = Math.min(totalPages, firstPage + visible - 1);
    const adjustedFirstPage = Math.max(1, lastPage - visible + 1);
    return Array.from({ length: lastPage - adjustedFirstPage + 1 }, (_, index) => adjustedFirstPage + index);
  }, [currentPage, totalPages]);

  const onSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortLabel = (key) => {
    if (sortConfig.key !== key) {
      return '';
    }
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const onFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
    setExpandedApplicationId(null);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage job postings and track student applications.</p>
        </div>
      </div>

      <section className="card">
        <h2 className="section-title">Add Job</h2>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              placeholder="Job Title"
              value={job.title}
              onChange={(event) => setJob({ ...job, title: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="salary">Salary</label>
            <input
              id="salary"
              type="number"
              min="0"
              step="1"
              placeholder="Salary"
              value={job.salary}
              onChange={(event) => setJob({ ...job, salary: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="cgpa">Eligibility CGPA</label>
            <input
              id="cgpa"
              type="number"
              min="0"
              step="0.01"
              placeholder="Eligibility CGPA"
              value={job.eligibilityCgpa}
              onChange={(event) => setJob({ ...job, eligibilityCgpa: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="deadline">Deadline</label>
            <input
              id="deadline"
              type="date"
              value={job.deadlineDate}
              onChange={(event) => setJob({ ...job, deadlineDate: event.target.value })}
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="link">Registration Link</label>
            <input
              id="link"
              type="url"
              placeholder="Registration Link"
              value={job.registrationLink}
              onChange={(event) => setJob({ ...job, registrationLink: event.target.value })}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={onAddJob}>Add Job</button>
        </div>
      </section>

      <section className="card table-card">
        <h2 className="section-title">Applied Students</h2>
        <div className="page-link-grid page-link-grid--admin">
          <button type="button" className="nav-card" onClick={() => navigate('/admin-interviews')}>
            <span className="nav-card__eyebrow">Interviews</span>
            <h2>Interview Workspace</h2>
            <p>Open the dedicated schedule view for all interview rounds and meeting links.</p>
          </button>
          <button type="button" className="nav-card" onClick={() => navigate('/admin-offers')}>
            <span className="nav-card__eyebrow">Offers</span>
            <h2>Offer Workspace</h2>
            <p>Track issued, accepted, and rejected offers outside the main dashboard.</p>
          </button>
          <button type="button" className="nav-card" onClick={() => navigate('/admin-analytics')}>
            <span className="nav-card__eyebrow">Analytics</span>
            <h2>Analytics Workspace</h2>
            <p>Review KPIs and download the PDF report in a dedicated page.</p>
          </button>
        </div>

        <div className="table-controls">
          <input
            value={searchTerm}
            onChange={onFilterChange(setSearchTerm)}
            placeholder="Search by student name or email"
            aria-label="Search students"
          />
          <select value={statusFilter} onChange={onFilterChange(setStatusFilter)} aria-label="Filter by status">
            <option value="ALL">All Status</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
            <option value="OFFERED">OFFERED</option>
            <option value="SELECTED">SELECTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <select value={jobFilter} onChange={onFilterChange(setJobFilter)} aria-label="Filter by job">
            <option value="ALL">All Jobs</option>
            {jobOptions.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div className="table-controls">
          <input
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            placeholder="Department filter"
          />
          <input
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value)}
            placeholder="Skill filter"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={minCgpaFilter}
            onChange={(event) => setMinCgpaFilter(event.target.value)}
            placeholder="Min CGPA"
          />
        </div>

        <div className="bulk-row">
          <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SELECTED">SELECTED</option>
          </select>
          <input
            value={bulkRemarks}
            onChange={(event) => setBulkRemarks(event.target.value)}
            placeholder="Bulk remarks"
          />
          <button type="button" className="btn btn-secondary" onClick={applyServerFilters}>Apply Server Filters</button>
          <button type="button" className="btn" onClick={runBulkStatusUpdate}>Bulk Update Selected</button>
        </div>

        <div className="table-summary">
          Showing {pagedApplications.length} of {sortedApplications.length} matching applications
        </div>

        {loadingApplications ? (
          <div className="card inline-state">Loading applications...</div>
        ) : sortedApplications.length === 0 ? (
          <div className="card inline-state">No applications match the current filters.</div>
        ) : (
          <>
            <table className="data-table interactive-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => onSort('studentName')}>
                      Student{sortLabel('studentName')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => onSort('studentEmail')}>
                      Email{sortLabel('studentEmail')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => onSort('jobTitle')}>
                      Job{sortLabel('jobTitle')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => onSort('status')}>
                      Status{sortLabel('status')}
                    </button>
                  </th>
                  <th>Review Opinion</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => onSort('appliedDate')}>
                      Applied Date{sortLabel('appliedDate')}
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedApplications.map((application) => {
                  const expanded = expandedApplicationId === application.applicationId;

                  return (
                    <Fragment key={application.applicationId}>
                      <tr
                        className={`expandable-row ${expanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedApplicationId(expanded ? null : application.applicationId)}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(application.applicationId)}
                            onChange={() => toggleSelect(application.applicationId)}
                          />
                        </td>
                        <td>{application.studentName}</td>
                        <td>{application.studentEmail}</td>
                        <td>{application.jobTitle}</td>
                        <td>{application.status}</td>
                        <td className="review-cell">{application.reviewOpinion}</td>
                        <td>{application.appliedDate}</td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="inline-actions">
                            <button className="btn btn-secondary" onClick={() => updateStatus(application.applicationId, 'SHORTLISTED')}>Shortlist</button>
                            <button className="btn btn-secondary" onClick={() => scheduleInterview(application.applicationId)}>Interview</button>
                            <button className="btn btn-secondary" onClick={() => issueOffer(application.applicationId)}>Offer</button>
                            <button className="btn btn-secondary" onClick={() => updateStatus(application.applicationId, 'REJECTED')}>Reject</button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="detail-row">
                          <td colSpan={8}>
                            <div className="detail-grid">
                              <p><strong>Department:</strong> {application.studentDept}</p>
                              <p><strong>CGPA:</strong> {application.studentCgpa}</p>
                              <p><strong>Skills:</strong> {application.studentSkills}</p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination-wrap">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((page) => Math.max(1, page - 1));
                  setExpandedApplicationId(null);
                }}
              >
                Previous
              </button>

              <div className="page-number-list">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`page-btn ${pageNumber === currentPage ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentPage(pageNumber);
                      setExpandedApplicationId(null);
                    }}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((page) => Math.min(totalPages, page + 1));
                  setExpandedApplicationId(null);
                }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
