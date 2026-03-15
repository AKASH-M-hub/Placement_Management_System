import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearAuth, getToken, isAdmin } from '../lib/auth';

export default function AdminOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        const data = await api.getOffers();
        setOffers(data);
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

    loadOffers();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Offers Workspace</h1>
          <p>Track issued, accepted, and rejected offers separately from the main dashboard.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>Back</button>
      </div>

      <section className="card table-card">
        {loading ? (
          <div className="inline-state">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="inline-state">No offers issued yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Job</th>
                <th>Offered CTC</th>
                <th>Offered Date</th>
                <th>Status</th>
                <th>Response Date</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.offerId}>
                  <td>{offer.application?.student?.name || 'N/A'}</td>
                  <td>{offer.application?.job?.title || 'N/A'}</td>
                  <td>{offer.offeredCtc || 'N/A'}</td>
                  <td>{offer.offeredDate || 'N/A'}</td>
                  <td>{offer.status || 'N/A'}</td>
                  <td>{offer.responseDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}