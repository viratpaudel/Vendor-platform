import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

export default function VendorPlatform() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("login");
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("vendor");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  // Forms
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationDesc, setQuotationDesc] = useState("");

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          type: userType,
          location,
          phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setPage(userType === "vendor" ? "vendor-profile" : "post-project");
      }
    } catch (err) {
      alert("Registration failed");
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setPage(
          data.type === "vendor" ? "vendor-dashboard" : "contractor-dashboard",
        );
      } else {
        alert("Login failed");
      }
    } catch (err) {
      alert("Login error");
    }
  };

  // Post Project
  const handlePostProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: currentUser.id,
          title: projectTitle,
          description: projectDesc,
          category: projectCategory,
          budget: projectBudget,
          location: projectLocation,
          deadline: projectDeadline,
          required_skills: projectCategory,
        }),
      });
      if (res.ok) {
        alert("Project posted!");
        setProjectTitle("");
        setProjectDesc("");
        setProjectCategory("");
        setProjectBudget("");
        loadProjects();
        setPage("contractor-dashboard");
      }
    } catch (err) {
      alert("Failed to post project");
    }
  };

  // Load projects
  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      const data = await res.json();
      setProjects(data || []);
    } catch (err) {
      console.log("Error loading projects");
    }
  };

  // Load quotations
  const loadQuotations = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/quotations/${projectId}`);
      const data = await res.json();
      setQuotations(data || []);
    } catch (err) {
      console.log("Error loading quotations");
    }
  };

  // Submit quotation
  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProject.id,
          vendor_id: currentUser.id,
          amount: quotationAmount,
          description: quotationDesc,
        }),
      });
      if (res.ok) {
        alert("Quotation submitted!");
        setQuotationAmount("");
        setQuotationDesc("");
        loadQuotations(selectedProject.id);
      }
    } catch (err) {
      alert("Failed to submit quotation");
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUser.id,
          recipient_id: selectedVendor.id,
          project_id: selectedProject.id,
          message: messageText,
        }),
      });
      if (res.ok) {
        setMessageText("");
        loadMessages();
      }
    } catch (err) {
      alert("Failed to send message");
    }
  };

  // Load messages
  const loadMessages = async () => {
    if (!selectedProject || !selectedVendor) return;
    try {
      const res = await fetch(
        `${API_URL}/messages/${selectedProject.id}/${currentUser.id}`,
      );
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.log("Error loading messages");
    }
  };

  // Search vendors
  const handleSearchVendors = async (category, loc) => {
    try {
      const res = await fetch(
        `${API_URL}/vendors/search?category=${category}&location=${loc}`,
      );
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      console.log("Error searching vendors");
    }
  };

  useEffect(() => {
    if (
      currentUser &&
      (page === "contractor-dashboard" ||
        page === "browse-vendors" ||
        page === "browse-projects" ||
        page === "my-projects")
    ) {
      loadProjects();
    }
  }, [page, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedProject && selectedVendor && page === "chat") {
        loadMessages();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedProject, selectedVendor, page]);

  // ===== RENDER PAGES =====

  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-shell">
          <section className="auth-hero">
            <div className="brand-mark">VP</div>
            <p className="auth-kicker">Build better, together</p>
            <h1>Find the right people for the work that matters.</h1>
            <p className="auth-intro">
              A focused marketplace for trusted vendors and ambitious project
              owners. Post a brief, compare proposals, and keep every detail in
              one place.
            </p>
            <div className="auth-stats">
              <div>
                <strong>01</strong>
                <span>Post a project</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Meet your match</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Make it happen</span>
              </div>
            </div>
            <div className="auth-note">
              <span className="status-dot" />
              Clear proposals. Direct conversations. Better outcomes.
            </div>
          </section>

          <div className="auth-box">
            <p className="form-eyebrow">Welcome back</p>
            <h2>{page === "login" ? "Sign in to your workspace" : "Create your workspace"}</h2>
          {page === "login" ? (
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
              <p>
                Don't have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setPage("register"); }}>
                  Register
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Location (e.g., Dehradun)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="vendor">Vendor/Contractor</option>
                <option value="contractor">Project Poster</option>
              </select>
              <button type="submit">Register</button>
              <p>
                Already have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setPage("login"); }}>
                  Login
                </a>
              </p>
            </form>
          )}
          </div>
        </div>
      </div>
    );
  }

  // Vendor Dashboard
  if (page === "vendor-dashboard" || page === "vendor-profile") {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Vendor Platform</h1>
          <div className="nav-buttons">
            <button onClick={() => setPage("browse-projects")}>
              Browse Projects
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                setPage("login");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="container">
          {page === "vendor-profile" ? (
            <div className="card">
              <h2>Complete Your Profile</h2>
              <form>
                <input
                  type="text"
                  placeholder="Services (e.g., Electrical, Plumbing)"
                />
                <input type="text" placeholder="Years of Experience" />
                <textarea placeholder="Portfolio/Previous Work"></textarea>
                <input type="text" placeholder="Pricing" />
                <button
                  type="button"
                  onClick={() => setPage("vendor-dashboard")}
                >
                  Save & Continue
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="card">
                <h2>Welcome, {currentUser.name}!</h2>
                <p>Your vendor dashboard</p>
                <p>
                  Browse projects and submit quotations to grow your business.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Browse Projects
  if (page === "browse-projects") {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Available Projects</h1>
          <div className="nav-buttons">
            <button onClick={() => setPage("vendor-dashboard")}>
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                setPage("login");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="container">
          <div className="projects-grid">
            {projects.map((p) => (
              <div key={p.id} className="card project-card">
                <div className="project-image-placeholder">
                  {p.category === "Plumbing" && "🔧"}
                  {p.category === "Electrical" && "⚡"}
                  {p.category === "Construction" && "🏗️"}
                  {p.category === "Carpentry" && "🪵"}
                  {p.category === "Painting" && "🎨"}
                  {p.category === "Web Development" && "💻"}
                  {p.category === "App Development" && "📱"}
                  {p.category === "Design" && "🎭"}
                </div>
                <h3>{p.title}</h3>
                <p className="project-description">
                  {p.description.substring(0, 120)}...
                </p>
                <div className="project-details">
                  <span>💰 {p.budget}</span>
                  <span>📍 {p.location}</span>
                  <span>📅 {new Date(p.deadline).toLocaleDateString()}</span>
                  <span>🏷️ {p.category}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(p);
                    loadQuotations(p.id);
                    setPage("submit-quotation");
                  }}
                >
                  View & Submit Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Submit Quotation
  if (page === "submit-quotation" && selectedProject) {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Project: {selectedProject.title}</h1>
          <button onClick={() => setPage("browse-projects")}>← Back</button>
        </header>

        <div className="container">
          <div className="card">
            <h3>Project Details</h3>
            <p>
              <strong>Description:</strong> {selectedProject.description}
            </p>
            <p>
              <strong>Budget:</strong> ₹{selectedProject.budget}
            </p>
            <p>
              <strong>Location:</strong> {selectedProject.location}
            </p>
            <p>
              <strong>Deadline:</strong> {selectedProject.deadline}
            </p>
          </div>

          <div className="card">
            <h3>Submit Your Quotation</h3>
            <form onSubmit={handleSubmitQuotation}>
              <input
                type="number"
                placeholder="Your Quote Amount (₹)"
                value={quotationAmount}
                onChange={(e) => setQuotationAmount(e.target.value)}
                required
              />
              <textarea
                placeholder="Describe your proposal, timeline, and why you're best for this project"
                value={quotationDesc}
                onChange={(e) => setQuotationDesc(e.target.value)}
                required
              ></textarea>
              <button type="submit">Submit Quotation</button>
            </form>
          </div>

          <div className="card">
            <h3>Other Quotations ({quotations.length})</h3>
            {quotations.map((q) => (
              <div key={q.id} className="quotation-item">
                <p>
                  <strong>{q.vendor_name}</strong> - ⭐ {q.rating || "N/A"}
                </p>
                <p>
                  ₹{q.amount} - {q.status}
                </p>
                <p>{q.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Contractor Dashboard
  if (page === "contractor-dashboard") {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Contractor Dashboard</h1>
          <div className="nav-buttons">
            <button onClick={() => setPage("post-project")}>
              Post Project
            </button>
            <button onClick={() => setPage("my-projects")}>My Projects</button>
            <button
              onClick={() => {
                setCurrentUser(null);
                setPage("login");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="container">
          <div className="card">
            <h2>Welcome, {currentUser.name}!</h2>
            <p>Post projects and find the best vendors for your needs.</p>
          </div>
        </div>
      </div>
    );
  }

  // Post Project
  if (page === "post-project") {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Post a New Project</h1>
          <button onClick={() => setPage("contractor-dashboard")}>
            ← Back
          </button>
        </header>

        <div className="container">
          <div className="card">
            <form onSubmit={handlePostProject}>
              <input
                type="text"
                placeholder="Project Title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Detailed Description"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                required
              ></textarea>
              <select
                value={projectCategory}
                onChange={(e) => setProjectCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="Electrical">Electrical Work</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Construction">Construction</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Painting">Painting</option>
                <option value="Web Development">Web Development</option>
                <option value="App Development">App Development</option>
                <option value="Design">Design</option>
              </select>
              <input
                type="text"
                placeholder="Budget (₹)"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                required
              />
              <input
                type="date"
                value={projectDeadline}
                onChange={(e) => setProjectDeadline(e.target.value)}
                required
              />
              <button type="submit">Post Project</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // My Projects
  if (page === "my-projects") {
    const myProjects = projects.filter(
      (p) => p.contractor_id === currentUser.id,
    );
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>My Projects</h1>
          <div className="nav-buttons">
            <button onClick={() => setPage("post-project")}>Post New</button>
            <button onClick={() => setPage("contractor-dashboard")}>
              ← Back
            </button>
          </div>
        </header>

        <div className="container">
          <div className="projects-grid">
            {myProjects.map((p) => (
              <div key={p.id} className="card project-card">
                <div className="project-image-placeholder">
                  {p.category === "Plumbing" && "🔧"}
                  {p.category === "Electrical" && "⚡"}
                  {p.category === "Construction" && "🏗️"}
                  {p.category === "Carpentry" && "🪵"}
                  {p.category === "Painting" && "🎨"}
                  {p.category === "Web Development" && "💻"}
                  {p.category === "App Development" && "📱"}
                  {p.category === "Design" && "🎭"}
                </div>
                <h3>{p.title}</h3>
                <p className="project-description">
                  {p.description.substring(0, 100)}...
                </p>
                <div className="project-details">
                  <span>💰 {p.budget}</span>
                  <span>📍 {p.location}</span>
                  <span>📅 {new Date(p.deadline).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(p);
                    loadQuotations(p.id);
                    setPage("view-quotations");
                  }}
                >
                  View Quotations
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View Quotations
  if (page === "view-quotations" && selectedProject) {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Quotations for: {selectedProject.title}</h1>
          <button onClick={() => setPage("my-projects")}>← Back</button>
        </header>

        <div className="container">
          {quotations.length === 0 ? (
            <div className="card">
              <p>No quotations received yet. Wait for vendors to respond!</p>
            </div>
          ) : (
            quotations.map((q) => (
              <div key={q.id} className="card quotation-item">
                <h3>{q.vendor_name}</h3>
                <p>
                  ⭐ Rating: {q.rating ? q.rating.toFixed(1) : "New Vendor"}
                </p>
                <p>
                  <strong>Amount:</strong> ₹{q.amount}
                </p>
                <p>
                  <strong>Proposal:</strong> {q.description}
                </p>
                <p>
                  <strong>Status:</strong> {q.status}
                </p>
                <div className="quotation-actions">
                  <button
                    onClick={() => {
                      setSelectedVendor({
                        id: q.vendor_id,
                        name: q.vendor_name,
                      });
                      setPage("chat");
                    }}
                  >
                    Chat with Vendor
                  </button>
                  {q.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          fetch(`${API_URL}/quotations/${q.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "accepted" }),
                          }).then(() => loadQuotations(selectedProject.id));
                        }}
                        className="accept-btn"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          fetch(`${API_URL}/quotations/${q.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "rejected" }),
                          }).then(() => loadQuotations(selectedProject.id));
                        }}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat
  if (page === "chat" && selectedProject && selectedVendor) {
    return (
      <div className="dashboard">
        <header className="navbar">
          <h1>Chat with {selectedVendor.name}</h1>
          <button onClick={() => setPage("view-quotations")}>← Back</button>
        </header>

        <div className="container">
          <div className="card chat-container">
            <div className="messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message ${m.sender_id === currentUser.id ? "sent" : "received"}`}
                >
                  <p>{m.message}</p>
                  <small>{new Date(m.created_at).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <div className="container">Loading...</div>;
}
