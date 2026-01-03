import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/employees/${user._id}`);
      setProfile(response.data);
      setFormData({
        phone: response.data.profile?.phone || '',
        address: response.data.profile?.address || '',
        profilePicture: response.data.profile?.profilePicture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${user._id}`, {
        profile: formData
      });
      setMessage('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          )}
        </div>

        {message && <div className="message">{message}</div>}

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h2>Personal Information</h2>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-picture">
                {profile?.profile?.profilePicture ? (
                  <img src={profile.profile.profilePicture} alt="Profile" />
                ) : (
                  <div className="avatar">{profile?.profile?.firstName?.[0] || profile?.email?.[0]}</div>
                )}
              </div>
              <h2>{profile?.profile?.firstName} {profile?.profile?.lastName}</h2>
              <p className="employee-id">ID: {profile?.employeeId}</p>
            </div>

            <div className="info-section">
              <h3>Personal Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Email</label>
                  <p>{profile?.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{profile?.profile?.phone || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label>Address</label>
                  <p>{profile?.profile?.address || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label>Date of Birth</label>
                  <p>{profile?.profile?.dateOfBirth ? new Date(profile.profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Job Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Department</label>
                  <p>{profile?.profile?.department || 'Not assigned'}</p>
                </div>
                <div className="info-item">
                  <label>Position</label>
                  <p>{profile?.profile?.position || 'Not assigned'}</p>
                </div>
                <div className="info-item">
                  <label>Joining Date</label>
                  <p>{profile?.profile?.joiningDate ? new Date(profile.profile.joiningDate).toLocaleDateString() : 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label>Role</label>
                  <p>{profile?.role}</p>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Salary Structure</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Base Salary</label>
                  <p>${profile?.salary?.baseSalary?.toLocaleString() || '0'}</p>
                </div>
                <div className="info-item">
                  <label>Allowances</label>
                  <p>${profile?.salary?.allowances?.toLocaleString() || '0'}</p>
                </div>
                <div className="info-item">
                  <label>Deductions</label>
                  <p>${profile?.salary?.deductions?.toLocaleString() || '0'}</p>
                </div>
                <div className="info-item">
                  <label>Net Salary</label>
                  <p className="net-salary">${profile?.salary?.netSalary?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;

