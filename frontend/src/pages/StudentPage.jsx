import { useState, useEffect } from "react";
import axios from "axios";
import "./StudentPage.css";

const DefaultIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const StudentPage = () => {
    const [activeTab, setActiveTab] = useState("profile");
    const [browseTab, setBrowseTab] = useState("jobs");
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [internships, setInternships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedOpp, setSelectedOpp] = useState(null); // For detail modal

    const [formData, setFormData] = useState({
        bio: "", skills: "", degree: "B.Tech", year: 1, branch: "", cgpa: "", admissionNumber: ""
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const studentId = localStorage.getItem("studentId");

    useEffect(() => {
        if (studentId) fetchData();
    }, [studentId]);

    const fetchData = async () => {
        try {
            // 1. Fetch student profile first to get CGPA
            const stdRes = await axios.get("http://localhost:5000/api/students");
            const current = stdRes.data.find(s => s._id === studentId);
            let currentCgpa = 0;

            if (current) {
                setProfile(current);
                currentCgpa = current.cgpa || 0;
                setFormData({
                    bio: current.bio || "",
                    skills: current.skills?.join(", ") || "",
                    degree: current.degree || "B.Tech",
                    year: current.year || 1,
                    branch: current.branch || "",
                    cgpa: current.cgpa || "",
                    admissionNumber: current.admissionNumber || ""
                });
                if (!current.admissionNumber || !current.branch) setEditMode(true);
            }

            // 2. Fetch jobs, internships (filtered by CGPA) and applications in parallel
            const [jobsRes, intsRes, appsRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/jobs?cgpa=${currentCgpa}`),
                axios.get(`http://localhost:5000/api/internships?cgpa=${currentCgpa}`),
                axios.get(`http://localhost:5000/api/student/applications/${studentId}`)
            ]);

            setJobs(jobsRes.data);
            setInternships(intsRes.data);
            setApplications(appsRes.data);
        } catch (err) { console.error(err); }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                skills: formData.skills.split(",").map(s => s.trim()).filter(s => s),
                year: Number(formData.year),
                cgpa: Number(formData.cgpa)
            };

            if (payload.cgpa > 10 || payload.cgpa < 0) {
                setMsg({ type: "error", text: "CGPA must be between 0 and 10" });
                return;
            }
            await axios.put(`http://localhost:5000/api/student/profile/${studentId}`, payload);
            setMsg({ type: "success", text: "Profile updated successfully!" });
            setEditMode(false);
            fetchData();
        } catch (err) { setMsg({ type: "error", text: err.response?.data?.error || "Update failed" }); }
    };

    const handleApply = async (id, type) => {
        try {
            const payload = { studentId };
            if (type === "job") payload.jobId = id; else payload.internshipId = id;
            await axios.post("http://localhost:5000/api/applications", payload);
            setMsg({ type: "success", text: "Applied successfully!" });
            setSelectedOpp(null);
            fetchData();
        } catch (err) { setMsg({ type: "error", text: err.response?.data?.error || "Already applied" }); }
    };

    const changeTab = (tab) => { setMsg({ type: "", text: "" }); setActiveTab(tab); };

    return (
        <div className="dashboard-wrapper">
            <nav className="dashboard-nav glass-card">
                <div className="nav-brand">CareerLink</div>
                <div className="nav-links">
                    <button className={activeTab === "profile" ? "active" : ""} onClick={() => changeTab("profile")}>Profile</button>
                    <button className={activeTab === "browse" ? "active" : ""} onClick={() => changeTab("browse")}>Browse</button>
                    <button className={activeTab === "apps" ? "active" : ""} onClick={() => changeTab("apps")}>My Applications</button>
                    <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-main">
                {msg.text && <div className={`status-banner ${msg.type}`}>{msg.text}</div>}

                {activeTab === "profile" && (
                    <div className="profile-container">
                        {!editMode ? (
                            <div className="glass-card profile-view">
                                <div className="profile-hero">
                                    <div className="photo-container">
                                        {profile?.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" /> : <DefaultIcon />}
                                    </div>
                                    <div className="hero-text">
                                        <h1>{profile?.name}</h1>
                                        <p className="adm-no">Admission No: {profile?.admissionNumber || "Not Set"}</p>
                                        <span className="badge">{profile?.degree} • {profile?.branch}</span>
                                    </div>
                                </div>
                                <div className="profile-details">
                                    <div className="detail-item"><label>Email</label><p>{profile?.email}</p></div>
                                    <div className="detail-item"><label>Academic Year</label><p>{profile?.year}</p></div>
                                    <div className="detail-item"><label>CGPA</label><p className="highlight">{profile?.cgpa || "0.0"}</p></div>
                                </div>
                                <div className="profile-bio"><label>Professional Bio</label><p>{profile?.bio || "No bio added yet."}</p></div>
                                <div className="skills-section">
                                    <label>Professional Skills</label>
                                    <div className="skills-tags">
                                        {profile?.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                                    </div>
                                </div>
                                <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
                            </div>
                        ) : (
                            <div className="glass-card profile-edit">
                                <h2>Edit Professional Profile</h2>
                                <form onSubmit={handleProfileUpdate} className="edit-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Admission Number</label>
                                            <input placeholder="Enter admission number" value={formData.admissionNumber} onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Branch / Specialization</label>
                                            <input placeholder="e.g. Computer Science" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Degree</label>
                                            <select value={formData.degree} onChange={e => setFormData({ ...formData, degree: e.target.value })}>
                                                <option value="B.Tech">B.Tech</option>
                                                <option value="M.Tech">M.Tech</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Current Year</label>
                                            <input type="number" placeholder="1-4" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Current CGPA</label>
                                            <input type="number" step="0.01" placeholder="e.g. 8.5" value={formData.cgpa} onChange={e => setFormData({ ...formData, cgpa: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Professional Bio</label>
                                        <textarea placeholder="Tell us about yourself..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Skills</label>
                                        <input placeholder="e.g. React, Python, UI Design (comma separated)" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="save-btn">Save Changes</button>
                                        <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "browse" && (
                    <div className="browse-container">
                        <div className="browse-tabs">
                            <button className={browseTab === "jobs" ? "active" : ""} onClick={() => setBrowseTab("jobs")}>Jobs</button>
                            <button className={browseTab === "internships" ? "active" : ""} onClick={() => setBrowseTab("internships")}>Internships</button>
                        </div>
                        <div className="list-grid">
                            {(browseTab === "jobs" ? jobs : internships).map(opp => {
                                const applied = applications.some(a => a.jobId?._id === opp._id || a.internshipId?._id === opp._id);
                                return (
                                    <div key={opp._id} className="glass-card opp-card">
                                        <div className="card-top">
                                            <h3>{opp.position}</h3>
                                            <p className="company">{opp.companyName}</p>
                                        </div>
                                        <div className="card-mid">
                                            <span className="loc-badge">📍 {opp.location || "Remote"}</span>
                                            <span className="pay-badge">💰 {opp.salary || opp.stipend || "TBD"}</span>
                                            <span className="cgpa-badge">🎓 Min CGPA: {opp.minCgpa || "0.0"}</span>
                                            <span className="deadline-badge">⏳ Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                                        </div>
                                        <div className="card-actions">
                                            {applied && <div className="applied-tag">Applied</div>}
                                            <button className="view-details-btn" onClick={() => setSelectedOpp({ ...opp, type: browseTab.slice(0, -1) })}>View Details</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === "apps" && (
                    <div className="apps-container">
                        {applications.length === 0 ? (
                            <div className="empty-state glass-card">
                                <p className="empty-msg">You haven't applied for any opening yet.</p>
                                <button className="main-btn" onClick={() => setActiveTab("browse")}>Browse Opportunities</button>
                            </div>
                        ) : (
                            <div className="list-grid">
                                {applications.map(app => (
                                    <div key={app._id} className="glass-card app-card">
                                        <div className="app-info">
                                            <h3>{app.jobId ? `${app.jobId.position} (Job)` : `${app.internshipId?.position} (Internship)`}</h3>
                                            <p>{app.jobId?.companyName || app.internshipId?.companyName}</p>
                                        </div>
                                        <div className="app-status-box">
                                            <span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span>
                                            <p className="date">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {selectedOpp && (
                <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedOpp.position}</h2>
                            <p className="company-lg">{selectedOpp.companyName}</p>
                        </div>
                        <div className="modal-body">
                            <div className="info-section"><h4>Description</h4><p>{selectedOpp.description}</p></div>
                            <div className="info-section"><h4>Requirements</h4><p>{selectedOpp.requirements}</p></div>
                            <div className="info-grid">
                                <div className="info-pill"><strong>Location:</strong> {selectedOpp.location || "Remote"}</div>
                                <div className="info-pill"><strong>Compensation:</strong> {selectedOpp.salary || selectedOpp.stipend || "Unpaid"}</div>
                                <div className="info-pill"><strong>Deadline:</strong> {new Date(selectedOpp.deadline).toLocaleDateString()}</div>
                                {selectedOpp.duration && <div className="info-pill"><strong>Duration:</strong> {selectedOpp.duration}</div>}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {applications.some(a => a.jobId?._id === selectedOpp._id || a.internshipId?._id === selectedOpp._id) ? (
                                <button className="applied-btn-lg" disabled>Already Applied</button>
                            ) : (
                                <button className="apply-btn-lg" onClick={() => handleApply(selectedOpp._id, selectedOpp.type)}>Apply Now</button>
                            )}
                            <button className="close-btn" onClick={() => setSelectedOpp(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPage;
