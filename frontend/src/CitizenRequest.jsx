import { useState } from "react";

function CitizenRequest() {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    language: "English",
    category: "Roads",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Citizen Request:", formData);

    alert("Your development request has been submitted!");
  };

  return (
    <div className="request-page">
      <div className="request-container">

        <div className="request-heading">
          <div className="request-icon">🏘️</div>

          <h1>Tell Us What Your Community Needs</h1>

          <p>
            Submit a development request and help improve your community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="request-form">

          <label>Your Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Location</label>
          <input
            type="text"
            name="location"
            placeholder="City / Village / District"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <label>Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
          >
            <option>English</option>
            <option>Bengali</option>
            <option>Hindi</option>
            <option>Portuguese</option>
            <option>Russian</option>
            <option>Chinese</option>
            <option>Arabic</option>
          </select>

          <label>Development Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option>Roads</option>
            <option>Healthcare</option>
            <option>Education</option>
            <option>Water</option>
            <option>Electricity</option>
            <option>Transport</option>
            <option>Internet</option>
            <option>Sanitation</option>
          </select>

          <label>Describe the Problem</label>

          <textarea
            name="description"
            placeholder="Tell us what development problem your community is facing..."
            value={formData.description}
            onChange={handleChange}
            rows="6"
            required
          />

          <button type="submit" className="submit-request">
            Submit Development Request →
          </button>

        </form>
      </div>
    </div>
  );
}

export default CitizenRequest;