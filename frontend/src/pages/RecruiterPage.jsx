import { useState, useEffect } from "react";
import axios from "axios";
import "./RecruiterPage.css";

const DefaultUserIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const RecruiterPage = () => {
    const [activeTab, setActiveTab] = useState("my-postings");
    const [jobs, setJobs] = useState([]);
    const [internships, setInternships] = useState([]);
    const [selectedPosting, setSelectedPosting] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    const [form, setForm] = useState({
        type: "job", position: "", description: "", requirements: "", location: "", salary: "", stipend: "", duration: "", deadline: "", minCgpa: ""
    });
    const [recruiterProfile, setRecruiterProfile] = useState(null);

    const recruiterId = localStorage.getItem("recruiterId");

    useEffect(() => {
        if (recruiterId) {
            fetchPostings();
            fetchProfile();
        }
    }, [recruiterId]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/recruiter/profile/${recruiterId}`);
            setRecruiterProfile(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchPostings = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/recruiter/postings/${recruiterId}`);
            setJobs(res.data.jobs);
            setInternships(res.data.internships);
        } catch (err) { console.error(err); }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        try {
            if (form.minCgpa && (Number(form.minCgpa) > 10 || Number(form.minCgpa) < 0)) {
                alert("Minimum CGPA criteria must be between 0 and 10");
                return;
            }
            const endpoint = form.type === "job" ? "/api/jobs" : "/api/internships";
            await axios.post(`http://localhost:5000${endpoint}`, { 
                ...form, 
                companyName: recruiterProfile.companyName,
                postedBy: recruiterId 
            });
            alert(`${form.type === "job" ? "Job" : "Internship"} posted successfully!`);
            setForm({ ...form, position: "", description: "", requirements: "", salary: "", stipend: "", duration: "", deadline: "", minCgpa: "" });
            fetchPostings();
            setActiveTab("my-postings");
        } catch (err) { alert("Failed to post opening"); }
    };

    const viewApplicants = async (postingId, title) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/applications/posting/${postingId}`);
            setApplicants(res.data);
            setSelectedPosting({ id: postingId, title });
            setActiveTab("applicants");
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (appId, status) => {
        try {
            await axios.patch(`http://localhost:5000/api/applications/${appId}`, { status });
            setApplicants(applicants.map(a => a._id === appId ? { ...a, status } : a));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-wrapper">
            <nav className="dashboard-nav glass-card">
                <div className="nav-brand">CareerLink Recruiter</div>
                <div className="nav-links">
                    <button className={activeTab === "my-postings" ? "active" : ""} onClick={() => setActiveTab("my-postings")}>My Postings</button>
                    <button className={activeTab === "post-new" ? "active" : ""} onClick={() => setActiveTab("post-new")}>Post New</button>
                    <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>Logout</button>
                </div>
            </nav>

            <main className="dashboard-main">
                {activeTab === "my-postings" && (
                    <div className="recruiter-postings">
                        <div className="section-header"><h2>Managed Postings</h2></div>
                        <div className="list-grid">
                            {[...jobs, ...internships].map(opp => (
                                <div key={opp._id} className="glass-card opp-card">
                                    <div className="card-top">
                                        <span className="type-badge">{jobs.includes(opp) ? "Job" : "Internship"}</span>
                                        <h3>{opp.position}</h3>
                                        <p className="company">{opp.companyName}</p>
                                    </div>
                                    <div className="card-mid">
                                        <p>📍 {opp.location || "Remote"}</p>
                                        <p>💰 {opp.salary || opp.stipend || "TBD"}</p>
                                        <p>🎓 Min CGPA: {opp.minCgpa || "0.0"}</p>
                                        <p className="deadline-text">⏳ Deadline: {new Date(opp.deadline).toLocaleDateString()}</p>
                                    </div>
                                    <button className="applicants-btn" onClick={() => viewApplicants(opp._id, opp.position)}>View Applicants</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "post-new" && (
                    <div className="post-form-container">
                        <div className="glass-card post-form-card">
                            <h2>Create New Opportunity</h2>
                            <form onSubmit={handlePost} className="post-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Opportunity Type</label>
                                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                            <option value="job">Job</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Posting Organization</label>
                                        <input value={recruiterProfile?.companyName || "Loading..."} disabled className="disabled-input" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Position Title</label>
                                        <input placeholder="e.g. Frontend Developer" value={form.position} onChange={e => setForm({...form, position: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Application Deadline</label>
                                        <input 
                                            type="date" 
                                            value={form.deadline} 
                                            onChange={e => setForm({...form, deadline: e.target.value})} 
                                            required 
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Work Location</label>
                                        <input placeholder="e.g. Remote, Mumbai" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Minimum CGPA Criteria</label>
                                        <input type="number" step="0.1" placeholder="e.g. 7.5" value={form.minCgpa} onChange={e => setForm({...form, minCgpa: e.target.value})} />
                                    </div>
                                </div>
                                {form.type === "job" ? (
                                    <div className="form-group">
                                        <label>Annual Salary Package</label>
                                        <input placeholder="e.g. 12 LPA" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} />
                                    </div>
                                ) : (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Monthly Stipend</label>
                                            <input placeholder="e.g. 25k / Month" value={form.stipend} onChange={e => setForm({...form, stipend: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Internship Duration</label>
                                            <input placeholder="e.g. 6 Months" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Detailed Description</label>
                                    <textarea placeholder="Describe the role and responsibilities..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Selection Criteria & Requirements</label>
                                    <textarea placeholder="Skills, qualifications, etc." value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} required />
                                </div>
                                <button type="submit" className="submit-post-btn">Publish Opening</button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "applicants" && (
                    <div className="applicants-view">
                        <div className="section-header">
                            <h2>Applicants for {selectedPosting?.title}</h2>
                            <button className="back-btn" onClick={() => setActiveTab("my-postings")}>← Back to Postings</button>
                        </div>
                        <div className="applicants-list">
                            {applicants.length === 0 ? <p className="empty-msg">No applications received yet.</p> : (
                                <table className="applicants-table glass-card">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Applied Position</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicants.map(app => (
                                            <tr key={app._id}>
                                                <td>
                                                    <button className="student-profile-link" onClick={() => setSelectedStudent(app.studentId)}>
                                                        {app.studentId.name}
                                                    </button>
                                                </td>
                                                <td>
                                                    {app.jobId ? `${app.jobId.position} (Job)` : `${app.internshipId?.position} (Internship)`}
                                                </td>
                                                <td><span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span></td>
                                                <td className="action-cells">
                                                    {app.status !== "Selected" && (
                                                        <>
                                                            <button className="shortlist-btn" onClick={() => updateStatus(app._id, "Shortlisted")}>Shortlist</button>
                                                            <button className="select-btn" onClick={() => updateStatus(app._id, "Selected")}>Select</button>
                                                            <button className="reject-btn" onClick={() => updateStatus(app._id, "Rejected")}>Reject</button>
                                                        </>
                                                    )}
                                                    {app.status === "Selected" && <span className="final-status">Hired ✅</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {selectedStudent && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-student">
                            <div className="student-photo-lg">
                                {selectedStudent.profilePhoto ? <img src={selectedStudent.profilePhoto}/> : <DefaultUserIcon/>}
                            </div>
                            <div className="student-hero">
                                <h2>{selectedStudent.name}</h2>
                                <p>{selectedStudent.degree} • {selectedStudent.branch} ({selectedStudent.year} Year)</p>
                                <p className="cgpa-highlight">CGPA: {selectedStudent.cgpa}</p>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="modal-section">
                                <h4>Bio</h4>
                                <p>{selectedStudent.bio || "No professional bio provided."}</p>
                            </div>
                            <div className="modal-section">
                                <h4>Skills</h4>
                                <div className="skills-row">
                                    {selectedStudent.skills?.map((s,i) => <span key={i} className="skill-chip">{s}</span>)}
                                </div>
                            </div>
                            {selectedStudent.resumeUrl && (
                                <div className="modal-section">
                                    <a href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer" className="resume-btn-lg">Review Resume</a>
                                </div>
                            )}
                        </div>
                        <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>Close Profile</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterPage;
