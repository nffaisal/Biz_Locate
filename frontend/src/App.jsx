import React, { useState } from 'react';
import { MapPin, DollarSign, Users, Briefcase, ChevronRight, TrendingUp, VolumeX, Clock } from 'lucide-react';
import './index.css';

function App() {
  const [formData, setFormData] = useState({
    budget: 50000,
    rentAllocation: 20,
    spaceSize: 'Medium',
    demographic: 'Mixed',
    areaNeed: 'Retail'
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'rentAllocation' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
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
        <h1>Peshawar Location Finder</h1>
        <p className="subtitle">Discover the perfect spot for your business based on data-driven insights.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><DollarSign size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Total Business Budget (PKR)</label>
            <input 
              type="number" 
              name="budget" 
              value={formData.budget} 
              onChange={handleChange} 
              min="10000"
              step="5000"
              required
            />
            <span className="help-text">Your total capital available for the business setup.</span>
          </div>

          <div className="form-group">
            <label>Rent Allocation (%)</label>
            <input 
              type="number" 
              name="rentAllocation" 
              value={formData.rentAllocation} 
              onChange={handleChange} 
              min="1" 
              max="100"
              required
            />
            <span className="help-text">How much of your budget can go towards monthly rent? (Usually 15-25%)</span>
          </div>

          <div className="form-group">
            <label><Briefcase size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Space Size Required</label>
            <select name="spaceSize" value={formData.spaceSize} onChange={handleChange}>
              <option value="Small">Small (500 sq ft)</option>
              <option value="Medium">Medium (1000 sq ft)</option>
              <option value="Large">Large (2000 sq ft)</option>
            </select>
            <span className="help-text">Select the approximate size of the location you need.</span>
          </div>

          <div className="form-group">
            <label><Users size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Target Demographic</label>
            <select name="demographic" value={formData.demographic} onChange={handleChange}>
              <option value="Mixed">Mixed (General Public)</option>
              <option value="Families">Families</option>
              <option value="Students">Students / Youth</option>
              <option value="High-Income">High-Income Individuals</option>
              <option value="Bargain Shoppers">Bargain Shoppers</option>
            </select>
            <span className="help-text">Who are your primary customers?</span>
          </div>

          <div className="form-group">
            <label><MapPin size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Business Type</label>
            <select name="areaNeed" value={formData.areaNeed} onChange={handleChange}>
              <option value="Retail">Retail Store</option>
              <option value="Food">Food / Restaurant</option>
              <option value="Tech">Tech / Electronics</option>
              <option value="Clinics">Clinic / Medical</option>
              <option value="Industrial">Industrial / Warehousing</option>
            </select>
            <span className="help-text">What type of business are you opening?</span>
          </div>

          <button type="submit" className="btn-primary">
            Find Best Locations
          </button>
        </form>
      </div>

      <div className="panel results-panel">
        <div className="results-header">
          <h2>Top Recommendations</h2>
        </div>

        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        ) : !searched ? (
          <div className="empty-state">
            <MapPin size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
            <p>Fill out the form to see the best matching locations for your business in Peshawar.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p>No suitable locations found matching your criteria. Try increasing your budget or changing the requirements.</p>
          </div>
        ) : (
          <div className="recommendations-list">
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
                  <h4><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> Area Insights</h4>
                  <p>{loc.description}</p>
                  
                  <div style={{marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.85rem'}}>
                      <TrendingUp size={16} /> <strong>Future Rent Hike:</strong> +{loc.projected_rent_hike_percent}% /yr
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: loc.noise_level === 'High' ? '#ef4444' : '#10b981', fontSize: '0.85rem'}}>
                      <VolumeX size={16} /> <strong>Noise:</strong> {loc.noise_level}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.85rem', width: '100%'}}>
                      <Clock size={16} /> <strong>Best Operating Hours:</strong> {loc.best_open_time} - {loc.best_close_time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
