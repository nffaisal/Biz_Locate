import React, { useState, useRef, useEffect } from 'react';
import { MapPin, DollarSign, Users, Briefcase, ChevronRight, TrendingUp, VolumeX, Clock, Map, MessageSquare, Send, AlertTriangle, ChevronDown, Car } from 'lucide-react';
import './index.css';

function App() {
  const [formData, setFormData] = useState({
    budget: "50000",
    allocationType: 'percentage',
    rentAllocationValue: "20",
    spaceSize: 'Medium',
    demographic: 'Mixed',
    areaNeed: 'Retail'
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isApproximation, setIsApproximation] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am the BizLocate AI Business Advisor. Ask me about market trends, marketing strategies, competitor analysis, or accessibility in Peshawar!' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);
  const formRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === "" || (!isNaN(rawValue) && Number(rawValue) >= 0)) {
      if (formData.allocationType === 'percentage' && Number(rawValue) > 100) return;
      setFormData(prev => ({ ...prev, rentAllocationValue: rawValue }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowOthers(false);
    
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setResults(data);
      if (data.length > 0 && data[0].is_approximation) {
        setIsApproximation(true);
      } else {
        setIsApproximation(false);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput("");

    try {
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I am having trouble connecting to the server." }]);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-orange';
    return 'score-red';
  };

  const getFillColor = (score) => {
    if (score >= 80) return 'fill-green';
    if (score >= 50) return 'fill-orange';
    return 'fill-red';
  };

  const renderLocationCard = (loc, isTopMatch = false) => (
    <div key={loc.id} className={isTopMatch ? "top-match-card" : "recommendation-card"}>
      {isTopMatch && <div className="top-match-badge">👑 #1 Recommended</div>}
      
      {isTopMatch && (
        <div className="map-container" style={{marginBottom: '1.5rem'}}>
          <iframe 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(loc.name + " Peshawar")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            title="Interactive Location Map"
          ></iframe>
        </div>
      )}

      <div className="card-header">
        <div className="location-name">{loc.name}</div>
        {!loc.is_approximation && (
          <div className={`match-score ${getScoreColor(loc.score)}`}>
            {loc.score.toFixed(0)}% Match
          </div>
        )}
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

      {loc.is_approximation && loc.budget_increase_needed > 0 && (
        <div style={{marginBottom: '1rem', fontSize: '0.9rem', color: '#b45309', fontWeight: 600}}>
          Requires ~PKR {loc.budget_increase_needed.toLocaleString()} more in monthly rent.
        </div>
      )}

      <div className="progress-container">
        <div className="progress-item">
          <div className="progress-label">
            <span>Accessibility (Disabled/Elderly)</span>
            <span>{loc.disabled_score}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className={`progress-fill ${getFillColor(loc.disabled_score)}`} style={{width: `${loc.disabled_score}%`}}></div>
          </div>
        </div>
        <div className="progress-item">
          <div className="progress-label">
            <span>Accessibility (Public Transit/BRT)</span>
            <span>{loc.transit_score}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className={`progress-fill ${getFillColor(loc.transit_score)}`} style={{width: `${loc.transit_score}%`}}></div>
          </div>
        </div>
      </div>

      <div className="insights-box">
        <h4><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> Area Insights</h4>
        <p>{loc.description}</p>
        <p>{loc.accessibility}</p>
        
        <div style={{marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.85rem', fontWeight: 600}}>
            <TrendingUp size={16} /> +{loc.projected_rent_hike_percent}% /yr
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: loc.noise_level === 'High' ? '#dc2626' : '#059669', fontSize: '0.85rem', fontWeight: 600}}>
            <VolumeX size={16} /> {loc.noise_level} Noise
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7', fontSize: '0.85rem', fontWeight: 600}}>
            <Clock size={16} /> Hours: {loc.best_open_time} - {loc.best_close_time}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: 600, width: '100%'}}>
            <Car size={16} /> Parking: {loc.parking_prediction}
          </div>
        </div>
      </div>
    </div>
  );

  const topMatch = results.length > 0 ? results[0] : null;
  const otherMatches = results.length > 1 ? results.slice(1) : [];

  return (
    <>
      <div className="hero-section">
        <div className="hero-content">
          <h1>BizLocate</h1>
          <p>Your business, our solution.</p>
        </div>
        <div className="scroll-indicator" onClick={scrollToForm}>
          <ChevronDown size={48} />
        </div>
      </div>

      <div className="main-wrapper" ref={formRef}>
        <div className="header-section">
          <h2 className="section-title">Find Your Perfect Location</h2>
          <p style={{color: 'var(--text-muted)'}}>Enter your business details below to get data-driven recommendations.</p>
        </div>

        <div className="app-container">
          <div className="panel form-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label><DollarSign size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Total Business Budget</label>
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
              </div>

              <div className="form-group">
                <label>Rent Allocation</label>
                <div className="allocation-toggle">
                  <button 
                    type="button" 
                    className={formData.allocationType === 'percentage' ? 'active' : ''}
                    onClick={() => setFormData(prev => ({...prev, allocationType: 'percentage', rentAllocationValue: ''}))}
                  >
                    Percentage (%)
                  </button>
                  <button 
                    type="button" 
                    className={formData.allocationType === 'amount' ? 'active' : ''}
                    onClick={() => setFormData(prev => ({...prev, allocationType: 'amount', rentAllocationValue: ''}))}
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
              </div>

              <div className="form-group">
                <label><Briefcase size={18} style={{verticalAlign: 'middle', marginRight: '5px'}}/> Space Size Required</label>
                <select name="spaceSize" value={formData.spaceSize} onChange={handleChange}>
                  <option value="Small">Small (500 sq ft)</option>
                  <option value="Medium">Medium (1000 sq ft)</option>
                  <option value="Large">Large (2000 sq ft)</option>
                </select>
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
              </div>

              <button type="submit" className="btn-primary">
                Analyze Locations
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
                <Map size={64} style={{marginBottom: '1rem'}} />
                <h2>Awaiting Input</h2>
                <p>Fill out the form to generate interactive map recommendations.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <h2>No matches found</h2>
                <p>Try adjusting your requirements for better results.</p>
              </div>
            ) : (
              <>
                {isApproximation && (
                  <div className="approximation-banner">
                    <AlertTriangle size={24} style={{flexShrink: 0}} />
                    <div>
                      <strong>No exact matches found for your current budget.</strong>
                      <p style={{fontSize: '0.9rem', marginTop: '0.2rem'}}>We found the closest premium locations. If you increase your rent budget, these become viable options.</p>
                    </div>
                  </div>
                )}

                {/* Render only Top Match initially */}
                {topMatch && renderLocationCard(topMatch, true)}

                {otherMatches.length > 0 && (
                  <button className="btn-secondary" onClick={() => setShowOthers(!showOthers)}>
                    {showOthers ? "Hide Other Options" : "Show Other Options"}
                  </button>
                )}

                {showOthers && (
                  <div className="recommendations-grid" style={{marginTop: '1rem'}}>
                    {otherMatches.map(loc => renderLocationCard(loc, false))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dedicated Chatbot Section */}
        <div className="chatbot-section">
          <div className="chatbot-info">
            <h2>AI Business Advisor</h2>
            <p>Not ready to search for a location? Or need advice on what area suits your niche best? Chat directly with our BizLocate AI.</p>
            <p>Ask about:</p>
            <ul style={{listStylePosition: 'inside', color: 'var(--text-muted)', marginBottom: '1rem'}}>
              <li>Marketing strategies & trends</li>
              <li>Competitive landscape in Peshawar</li>
              <li>Demographic breakdowns (DHA, Hayatabad)</li>
              <li>Accessibility requirements</li>
            </ul>
          </div>
          <div className="chatbot-ui">
            <div className="chatbot-header">
              <MessageSquare size={20} /> BizLocate AI
            </div>
            <div className="chatbot-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chatbot-input-area" onSubmit={handleChatSubmit}>
              <input 
                type="text" 
                placeholder="Ask your business question..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit"><Send size={18} /></button>
            </form>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Real-life Advice & Consulting</h3>
            <p>Need hands-on help setting up your physical store?</p>
            <a href="#">Book a Consultation</a>
            <a href="#">Business Strategy Help</a>
          </div>
          <div className="footer-section">
            <h3>Contractor Connections</h3>
            <p>We connect you with trusted local contractors in Peshawar.</p>
            <a href="#">Find Interior Designers</a>
            <a href="#">Find Plumbers & Electricians</a>
          </div>
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Email: contact@bizlocate.com</p>
            <p>Phone: +92 300 1234567</p>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2026 Copyright by Team Fajeeta Atomcamp</p>
          <p>Developed by: Noor Fatima, Zartaj Barg, Wajeeha Rauf</p>
        </div>
      </footer>
    </>
  );
}

export default App;
