import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000";

function App() {
  const [requests, setRequests] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("English");
  const [category, setCategory] = useState("Road");
  const [description, setDescription] = useState("");

  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [requestsRes, hotspotsRes, recommendationsRes] =
        await Promise.all([
          fetch(`${API}/api/requests`),
          fetch(`${API}/api/hotspots`),
          fetch(`${API}/api/recommendations`),
        ]);

      setRequests(await requestsRes.json());
      setHotspots(await hotspotsRes.json());
      setRecommendations(await recommendationsRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🎤 Voice input
  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      language === "Bengali"
        ? "bn-IN"
        : language === "Hindi"
        ? "hi-IN"
        : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setMessage("🎤 Listening... Please speak your development request.");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setDescription(text);
      setMessage("✅ Voice request captured successfully.");
    };

    recognition.onerror = () => {
      setMessage("❌ Could not understand the voice. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  // Submit citizen request
  const submitRequest = async (event) => {
    event.preventDefault();

    if (!location.trim() || !description.trim()) {
      setMessage("⚠️ Please enter location and request description.");
      return;
    }

    setLoading(true);
    setMessage("🤖 AI is analyzing your request...");

    try {
      const response = await fetch(`${API}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name || "Anonymous Citizen",
          location: location,
          language: language,
          category: category,
          description: description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `✅ Request submitted successfully! AI classified it as ${
            data.ai_category || "a development need"
          } with ${data.priority || "LOW"} priority.`
        );

        setName("");
        setLocation("");
        setDescription("");

        await loadData();
      } else {
        setMessage(`❌ ${data.error || "Could not submit request."}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "❌ Backend connection failed. Make sure Flask is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = requests.length;

  const highPriority = requests.filter(
    (r) => r.priority === "HIGH"
  ).length;

  const mediumPriority = requests.filter(
    (r) => r.priority === "MEDIUM"
  ).length;

  const lowPriority = requests.filter(
    (r) => r.priority === "LOW"
  ).length;

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div>
          <h1>🌍 CivicPulse AI</h1>
          <p>
            AI-powered citizen development intelligence platform
          </p>
        </div>

        <button className="refresh-btn" onClick={loadData}>
          🔄 Refresh
        </button>
      </header>

      {/* CITIZEN REQUEST FORM */}
      <section className="section citizen-section">

        <div className="section-title">
          <div>
            <h2>🧑 Citizen Development Request</h2>
            <p>
              Tell CivicPulse AI about a development problem in your area.
            </p>
          </div>
        </div>

        <form className="request-form" onSubmit={submitRequest}>

          <div className="form-row">

            <div className="form-group">
              <label>Your Name</label>

              <input
                type="text"
                placeholder="Optional"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>📍 Location *</label>

              <input
                type="text"
                placeholder="Example: Asansol"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

          </div>

          <div className="form-row">

            <div className="form-group">
              <label>🌐 Language</label>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Bengali</option>
                <option>Hindi</option>
              </select>
            </div>

            <div className="form-group">
              <label>🏗️ Development Category</label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Road">Road</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Internet">Internet</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Transport">Transport</option>
              </select>
            </div>

          </div>

          <div className="form-group">
            <label>📝 Describe the problem *</label>

            <textarea
              rows="5"
              placeholder="Example: The main road has many potholes and becomes dangerous during rain."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* VOICE BUTTON */}
          <div className="voice-area">

            <button
              type="button"
              className={`voice-btn ${listening ? "listening" : ""}`}
              onClick={startVoiceInput}
              disabled={listening}
            >
              {listening
                ? "🎤 Listening..."
                : "🎤 Speak Your Request"}
            </button>

            <span>
              Speak in English, Bengali or Hindi
            </span>

          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading
              ? "🤖 AI Analyzing..."
              : "🚀 Submit Citizen Request"}
          </button>

          {message && (
            <div className="form-message">
              {message}
            </div>
          )}

        </form>

      </section>

      {/* STATISTICS */}
      <section className="stats-grid">

        <div className="stat-card">
          <h3>Total Requests</h3>
          <div className="stat-number">{totalRequests}</div>
          <p>Citizen development requests</p>
        </div>

        <div className="stat-card high">
          <h3>High Priority</h3>
          <div className="stat-number">{highPriority}</div>
          <p>Urgent development needs</p>
        </div>

        <div className="stat-card medium">
          <h3>Medium Priority</h3>
          <div className="stat-number">{mediumPriority}</div>
          <p>Important development needs</p>
        </div>

        <div className="stat-card low">
          <h3>Low Priority</h3>
          <div className="stat-number">{lowPriority}</div>
          <p>Normal development needs</p>
        </div>

      </section>

      {/* AI RECOMMENDATIONS */}
      <section className="section">

        <div className="section-title">
          <div>
            <h2>🤖 AI Development Recommendations</h2>
            <p>
              AI-generated recommendations based on citizen demand
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="empty-card">
            No recommendations available yet.
          </div>
        ) : (
          <div className="recommendation-grid">

            {recommendations.map((item, index) => (

              <div className="recommendation-card" key={index}>

                <div className="recommendation-header">

                  <div>
                    <h3>{item.recommendation}</h3>

                    <p className="location">
                      📍 {item.location}
                    </p>
                  </div>

                  <span
                    className={`priority ${item.priority.toLowerCase()}`}
                  >
                    {item.priority}
                  </span>

                </div>

                <div className="recommendation-info">

                  <div>
                    <strong>{item.request_count}</strong>
                    <span> Requests</span>
                  </div>

                  <div>
                    <strong>{item.high_priority_requests}</strong>
                    <span> High Priority</span>
                  </div>

                  <div>
                    <strong>
                      {item.medium_priority_requests}
                    </strong>
                    <span> Medium</span>
                  </div>

                </div>

                <div className="recommendation-reason">

                  <strong>Why this matters:</strong>

                  <p>{item.reason}</p>

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

      {/* HOTSPOTS */}
      <section className="section">

        <div className="section-title">
          <div>
            <h2>📍 Demand Hotspots</h2>
            <p>
              Locations with concentrated citizen requests
            </p>
          </div>
        </div>

        <div className="hotspot-grid">

          {hotspots.map((hotspot, index) => (

            <div className="hotspot-card" key={index}>

              <div className="hotspot-icon">
                📍
              </div>

              <div>
                <h3>{hotspot.location}</h3>

                <p>
                  {hotspot.request_count} citizen request
                  {hotspot.request_count !== 1 ? "s" : ""}
                </p>

                <span
                  className={`hotspot-level ${hotspot.hotspot_level.toLowerCase()}`}
                >
                  {hotspot.hotspot_level} HOTSPOT
                </span>
              </div>

            </div>

          ))}

        </div>

      </section>

      {/* CATEGORIES */}
      <section className="section">

        <div className="section-title">
          <div>
            <h2>📊 Development Categories</h2>
            <p>
              Areas requested by citizens
            </p>
          </div>
        </div>

        <div className="category-grid">

          {[
            "Road Infrastructure",
            "Healthcare",
            "Education",
            "Water",
            "Electricity",
            "Internet",
            "Sanitation",
            "Transport",
          ].map((categoryName) => {

            const count = requests.filter(
              (request) =>
                request.ai_category === categoryName ||
                request.category === categoryName
            ).length;

            return (
              <div className="category-card" key={categoryName}>

                <h3>{categoryName}</h3>

                <div className="category-number">
                  {count}
                </div>

                <p>Requests</p>

              </div>
            );
          })}

        </div>

      </section>

      {/* REQUEST TABLE */}
      <section className="section">

        <div className="section-title">
          <div>
            <h2>🧑‍🤝‍🧑 Citizen Requests</h2>
            <p>
              Latest development requests received
            </p>
          </div>
        </div>

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Location</th>
                <th>Language</th>
                <th>AI Category</th>
                <th>Description</th>
                <th>Priority</th>
              </tr>

            </thead>

            <tbody>

              {requests.length === 0 ? (

                <tr>
                  <td colSpan="6" className="empty-table">
                    No citizen requests available.
                  </td>
                </tr>

              ) : (

                requests.map((request) => (

                  <tr key={request.id}>

                    <td>#{request.id}</td>

                    <td>
                      📍 {request.location}
                    </td>

                    <td>
                      {request.language}
                    </td>

                    <td>
                      {request.ai_category || "Analyzing..."}
                    </td>

                    <td>
                      {request.description}
                    </td>

                    <td>

                      <span
                        className={`priority ${
                          request.priority
                            ? request.priority.toLowerCase()
                            : "low"
                        }`}
                      >
                        {request.priority || "LOW"}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">

        <p>
          CivicPulse AI • AI-powered Digital Public Good
        </p>

        <p>
          Citizen Feedback → AI Analysis → Development Intelligence
        </p>

      </footer>

    </div>
  );
}

export default App;