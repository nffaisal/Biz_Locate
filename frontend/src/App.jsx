import React, { useState } from 'react';
import { MapPin, DollarSign, Users, Briefcase, ChevronRight, TrendingUp, VolumeX, Clock, Map } from 'lucide-react';
import './index.css';
import mapPlaceholder from './assets/map_placeholder.png';

function App() {
  const [formData, setFormData] = useState({
    budget: "50000",
    allocationType: 'percentage', // 'percentage' or 'amount'
    rentAllocationValue: "20",
    spaceSize: 'Medium',
    demographic: 'Mixed',
    areaNeed: 'Retail'
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const formatNumber = (num) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleBudgetChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (!isNaN(rawValue) && Number(rawValue) >= 0) {
      setFormData(prev => ({ ...prev, budget: rawValue }));
    }
  };

  const handleAllocationChange = (e) => {
    const val = e.target.value;
    if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
      if (formData.allocationType === 'percentage' && Number(val) > 100) return;
      setFormData(prev => ({ ...prev, rentAllocationValue: val }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Process form data for API
    const budgetNum = Number(formData.budget) || 0;
    let rentAllocPercent = 0;

    if (formData.allocationType === 'percentage') {
      rentAllocPercent = Number(formData.rentAllocationValue) || 0;
    } else {
      const rentAmount = Number(formData.rentAllocationValue) || 0;
      rentAllocPercent = budgetNum > 0 ? (rentAmount / budgetNum) * 100 : 0;
    }

    const apiData = {
      budget: budgetNum,
      rentAllocation: rentAllocPercent,
      spaceSize: formData.spaceSize,
      demographic: formData.demographic,
      areaNeed: formData.areaNeed
    };

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch('http://localhost:8080/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      // Fallback for demonstration if backend fails
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="panel form-panel">
        <div className="header-section">
          <h1>BizLocate</h1>
          <p className="subtitle">Your business, our solution.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><DollarSign size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Total Business Budget</label>
            <div className="input-with-currency">
              <input
                type="text"
                name="budget"
                value={formatNumber(formData.budget)}
                onChange={handleBudgetChange}
                required
                placeholder="e.g. 50,000"
              />
              <span>PKR</span>
            </div>
            <span className="help-text">Your total capital available for the business setup.</span>
          </div>

          <div className="form-group">
            <label>Rent Allocation</label>
            <div className="allocation-toggle">
              <button
                type="button"
                className={formData.allocationType === 'percentage' ? 'active' : ''}
                onClick={() => setFormData(prev => ({ ...prev, allocationType: 'percentage', rentAllocationValue: '' }))}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                className={formData.allocationType === 'amount' ? 'active' : ''}
                onClick={() => setFormData(prev => ({ ...prev, allocationType: 'amount', rentAllocationValue: '' }))}
              >
                Exact Amount
              </button>
            </div>
            <div className="input-with-currency">
              <input
                type="text"
                value={formData.allocationType === 'amount' ? formatNumber(formData.rentAllocationValue) : formData.rentAllocationValue}
                onChange={handleAllocationChange}
                required
                placeholder={formData.allocationType === 'percentage' ? "e.g. 20" : "e.g. 10,000"}
              />
              <span>{formData.allocationType === 'percentage' ? '%' : 'PKR'}</span>
            </div>
            <span className="help-text">How much of your budget can go towards monthly rent?</span>
          </div>

          <div className="form-group">
            <label><Briefcase size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Space Size Required</label>
            <select name="spaceSize" value={formData.spaceSize} onChange={handleChange}>
              <option value="Small">Small (500 sq ft)</option>
              <option value="Medium">Medium (1000 sq ft)</option>
              <option value="Large">Large (2000 sq ft)</option>
            </select>
          </div>

          <div className="form-group">
            <label><Users size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Target Demographic</label>
            <select name="demographic" value={formData.demographic} onChange={handleChange}>
              <option value="Mixed">Mixed (General Public)</option>
              <option value="Families">Families</option>
              <option value="Students">Students / Youth</option>
              <option value="High-Income">High-Income Individuals</option>
              <option value="Bargain Shoppers">Bargain Shoppers</option>
            </select>
          </div>

          <div className="form-group">
            <label><MapPin size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Business Type</label>
            <select name="areaNeed" value={formData.areaNeed} onChange={handleChange}>
              <option value="Retail">Retail Store</option>
              <option value="Food">Food / Restaurant</option>
              <option value="Tech">Tech / Electronics</option>
              <option value="Clinics">Clinic / Medical</option>
              <option value="Industrial">Industrial / Warehousing</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Find Best Locations
          </button>
        </form>
      </div>

      <div className="results-container">
        {loading ? (
          <div className="panel loader">
            <div className="spinner"></div>
          </div>
        ) : !searched ? (
          <div className="empty-state">
            <Map size={64} style={{ marginBottom: '1rem' }} />
            <h2>Ready to find your next spot?</h2>
            <p> discover data-driven location recommendations tailored to your business needs.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <h2>No exact matches found</h2>
            <p>Try increasing your budget or adjusting your requirements for better results.</p>
          </div>
        ) : (
          <>
            <div className="map-placeholder">
              <img src={mapPlaceholder} alt="Recommended Area Map Layout" />
              <div className="map-overlay">
                <MapPin size={18} /> Viewing Top Recommendations
              </div>
            </div>

            <div className="results-header">
              <h2>Top Matches for You</h2>
            </div>

            <div className="recommendations-grid">
              {results.map((loc) => (
                <div key={loc.id} className="recommendation-card">
                  <div className="card-header">
                    <div className="location-name">{loc.name}</div>
                    <div className="match-score">
                      {loc.score.toFixed(0)}% Match
                    </div>
                  </div>

                  <div className="card-details">
                    <div className="detail-item">
                      <span className="detail-label">Est. Monthly Rent</span>
                      <span className="detail-value">PKR {loc.estimated_monthly_rent.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Area Type</span>
                      <span className="detail-value">{loc.type}</span>
                    </div>
                  </div>

                  <div className="insights-box">
                    <h4><ChevronRight size={14} style={{ verticalAlign: 'middle' }} /> Area Insights</h4>
                    <p>{loc.description}</p>

                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>
                        <TrendingUp size={16} /> +{loc.projected_rent_hike_percent}% /yr
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: loc.noise_level === 'High' ? '#dc2626' : '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                        <VolumeX size={16} /> {loc.noise_level} Noise
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.85rem', width: '100%', fontWeight: 600 }}>
                        <Clock size={16} /> Best Hours: {loc.best_open_time} - {loc.best_close_time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
