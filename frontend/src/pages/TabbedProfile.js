import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { calculateProfileCompletion, getMissingFields } from '../utils/profileCompletion';
import './TabbedProfile.css';

// Format currency in Indian Rupees
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const TabbedProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const location = useLocation();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState([]);

  const isAdmin = currentUser?.role === 'Admin';
  const isHR = currentUser?.role === 'HR';
  const isAdminOrHR = isAdmin || isHR;
  const isOwnProfile = !id || id === currentUser?._id;
  const canEdit = isAdminOrHR || isOwnProfile;

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  // Auto-focus on Personal Info tab if profile incomplete
  useEffect(() => {
    if (isOwnProfile && completionPercentage < 80 && activeTab !== 'personal') {
      setActiveTab('personal');
      setEditing(true);
    }
  }, [completionPercentage, isOwnProfile]);

  useEffect(() => {
    if (currentUser?._id) {
      fetchProfile();
    }
  }, [id, currentUser?._id]);

  useEffect(() => {
    if (activeTab === 'attendance' && profile) {
      fetchAttendance();
    }
    if (activeTab === 'timeoff' && profile) {
      fetchLeaves();
    }
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    try {
      const employeeId = id || currentUser._id;
      console.log('🔍 Fetching profile for employee ID:', employeeId, 'URL param id:', id);
      const response = await api.get(`/employees/${employeeId}`);
      console.log('✅ Profile data received:', {
        email: response.data.email,
        department: response.data.profile?.department,
        position: response.data.profile?.position,
        joiningDate: response.data.profile?.joiningDate,
        baseSalary: response.data.salary?.baseSalary,
        netSalary: response.data.salary?.netSalary
      });
      setProfile(response.data);
      
      // Calculate profile completion
      const percentage = calculateProfileCompletion(response.data);
      const missing = getMissingFields(response.data);
      setCompletionPercentage(percentage);
      setMissingFields(missing);
      
      setFormData({
        firstName: response.data.profile?.firstName || '',
        lastName: response.data.profile?.lastName || '',
        email: response.data.email || '',
        phone: response.data.profile?.phone || '',
        address: response.data.profile?.address || '',
        dateOfBirth: response.data.profile?.dateOfBirth ? new Date(response.data.profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: response.data.profile?.gender || '',
        maritalStatus: response.data.profile?.maritalStatus || '',
        nationality: response.data.profile?.nationality || '',
        department: response.data.profile?.department || '',
        designation: response.data.profile?.position || '',
        joiningDate: response.data.profile?.joiningDate ? new Date(response.data.profile.joiningDate).toISOString().split('T')[0] : '',
        employeeId: response.data.employeeId || '',
        role: response.data.role || '',
        profilePicture: response.data.profile?.profilePicture || '',
        about: response.data.profile?.about || '',
        whatILoveAboutMyJob: response.data.profile?.whatILoveAboutMyJob || '',
        interestsAndHobbies: response.data.profile?.interestsAndHobbies || '',
        skills: response.data.profile?.skills || [],
        certifications: response.data.profile?.certifications || [],
        baseSalary: response.data.salary?.baseSalary || 0,
        hra: response.data.salary?.hra || 0,
        conveyance: response.data.salary?.conveyance || 0,
        medical: response.data.salary?.medical || 0,
        specialAllowance: response.data.salary?.specialAllowance || 0,
        pf: response.data.salary?.pf || 0,
        esi: response.data.salary?.esi || 0,
        professionalTax: response.data.salary?.professionalTax || 0,
        incomeTax: response.data.salary?.incomeTax || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const employeeId = id || currentUser._id;
      const response = await api.get(`/attendance?employeeId=${employeeId}`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const employeeId = id || currentUser._id;
      const response = await api.get(`/leaves?employeeId=${employeeId}`);
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Image size should be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
        setMessage('Profile picture selected. Click "Save" in Personal Info tab to update.');
      };
      reader.onerror = () => {
        setMessage('Error reading image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditPictureClick = () => {
    document.getElementById('profile-picture-input').click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const employeeId = id || currentUser._id;
      
      // Build update data based on user role
      const updateData = {
        profile: {}
      };

      // Employees, HR, and Admin can update personal info
      if (isOwnProfile || isAdminOrHR) {
        // Include all fields - send empty strings to clear fields if needed
        updateData.profile = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          phone: formData.phone || '',
          address: formData.address || '',
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender || '',
          maritalStatus: formData.maritalStatus || '',
          nationality: formData.nationality || ''
        };

        // Include profile picture
        if (formData.profilePicture) {
          updateData.profile.profilePicture = formData.profilePicture;
        }

        // HR and Admin can update department, position, joiningDate
        if (isAdminOrHR) {
          updateData.profile.department = formData.department || '';
          updateData.profile.position = formData.designation || '';
          updateData.profile.joiningDate = formData.joiningDate || null;
        }

        // HR and Admin can update email for any employee
        if (isAdminOrHR) {
          if (formData.email) {
            updateData.email = formData.email;
          }
        }

        // HR and Admin can update role
        if (isAdminOrHR && formData.role) {
          updateData.role = formData.role;
        }

        // Add new profile sections
        updateData.profile.about = formData.about || '';
        updateData.profile.whatILoveAboutMyJob = formData.whatILoveAboutMyJob || '';
        updateData.profile.interestsAndHobbies = formData.interestsAndHobbies || '';
        updateData.profile.skills = formData.skills || [];
        updateData.profile.certifications = formData.certifications || [];
        
        // Add bank details
        updateData.profile.bankDetails = {
          accountNumber: formData.accountNumber || '',
          bankName: formData.bankName || '',
          ifscCode: formData.ifscCode || '',
          panNumber: formData.panNumber || '',
          uanNumber: formData.uanNumber || '',
          empCode: formData.empCode || ''
        };
      }
      
      // Handle Security tab (bank details) separately
      if (activeTab === 'security') {
        updateData.profile = updateData.profile || {};
        updateData.profile.bankDetails = {
          accountNumber: formData.accountNumber || '',
          bankName: formData.bankName || '',
          ifscCode: formData.ifscCode || '',
          panNumber: formData.panNumber || '',
          uanNumber: formData.uanNumber || '',
          empCode: formData.empCode || ''
        };
      }

      if (isAdmin && activeTab === 'salary') {
        // Only Admin can update salary
        updateData.salary = {
          baseSalary: parseFloat(formData.baseSalary),
          hra: parseFloat(formData.hra),
          conveyance: parseFloat(formData.conveyance),
          medical: parseFloat(formData.medical),
          specialAllowance: parseFloat(formData.specialAllowance),
          allowances: parseFloat(formData.hra) + parseFloat(formData.conveyance) + parseFloat(formData.medical) + parseFloat(formData.specialAllowance),
          pf: parseFloat(formData.pf),
          esi: parseFloat(formData.esi),
          professionalTax: parseFloat(formData.professionalTax),
          incomeTax: parseFloat(formData.incomeTax),
          deductions: parseFloat(formData.pf) + parseFloat(formData.esi) + parseFloat(formData.professionalTax) + parseFloat(formData.incomeTax)
        };
        updateData.salary.netSalary = updateData.salary.baseSalary + updateData.salary.allowances - updateData.salary.deductions;
      }

      console.log('📝 Updating profile with data:', updateData);
      const response = await api.put(`/employees/${employeeId}`, updateData);
      console.log('✅ Profile update response:', response.data);
      
      setMessage('Profile updated successfully');
      setEditing(false);
      
      // Refetch profile to get updated data
      const updatedProfileResponse = await api.get(`/employees/${employeeId}`);
      setProfile(updatedProfileResponse.data);
      
      // Recalculate completion
      const percentage = calculateProfileCompletion(updatedProfileResponse.data);
      const missing = getMissingFields(updatedProfileResponse.data);
      setCompletionPercentage(percentage);
      setMissingFields(missing);
      
      // Update form data with new values
      setFormData({
        firstName: updatedProfileResponse.data.profile?.firstName || '',
        lastName: updatedProfileResponse.data.profile?.lastName || '',
        email: updatedProfileResponse.data.email || '',
        phone: updatedProfileResponse.data.profile?.phone || '',
        address: updatedProfileResponse.data.profile?.address || '',
        dateOfBirth: updatedProfileResponse.data.profile?.dateOfBirth ? new Date(updatedProfileResponse.data.profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: updatedProfileResponse.data.profile?.gender || '',
        maritalStatus: updatedProfileResponse.data.profile?.maritalStatus || '',
        nationality: updatedProfileResponse.data.profile?.nationality || '',
        department: updatedProfileResponse.data.profile?.department || '',
        designation: updatedProfileResponse.data.profile?.position || '',
        joiningDate: updatedProfileResponse.data.profile?.joiningDate ? new Date(updatedProfileResponse.data.profile.joiningDate).toISOString().split('T')[0] : '',
        employeeId: updatedProfileResponse.data.employeeId || '',
        role: updatedProfileResponse.data.role || '',
        profilePicture: updatedProfileResponse.data.profile?.profilePicture || '',
        about: updatedProfileResponse.data.profile?.about || '',
        whatILoveAboutMyJob: updatedProfileResponse.data.profile?.whatILoveAboutMyJob || '',
        interestsAndHobbies: updatedProfileResponse.data.profile?.interestsAndHobbies || '',
        skills: updatedProfileResponse.data.profile?.skills || [],
        certifications: updatedProfileResponse.data.profile?.certifications || [],
        accountNumber: updatedProfileResponse.data.profile?.bankDetails?.accountNumber || '',
        bankName: updatedProfileResponse.data.profile?.bankDetails?.bankName || '',
        ifscCode: updatedProfileResponse.data.profile?.bankDetails?.ifscCode || '',
        panNumber: updatedProfileResponse.data.profile?.bankDetails?.panNumber || '',
        uanNumber: updatedProfileResponse.data.profile?.bankDetails?.uanNumber || '',
        empCode: updatedProfileResponse.data.profile?.bankDetails?.empCode || '',
        baseSalary: updatedProfileResponse.data.salary?.baseSalary || 0,
        hra: updatedProfileResponse.data.salary?.hra || 0,
        conveyance: updatedProfileResponse.data.salary?.conveyance || 0,
        medical: updatedProfileResponse.data.salary?.medical || 0,
        specialAllowance: updatedProfileResponse.data.salary?.specialAllowance || 0,
        pf: updatedProfileResponse.data.salary?.pf || 0,
        esi: updatedProfileResponse.data.salary?.esi || 0,
        professionalTax: updatedProfileResponse.data.salary?.professionalTax || 0,
        incomeTax: updatedProfileResponse.data.salary?.incomeTax || 0
      });
      
      console.log('✅ Profile updated. New completion:', percentage + '%');
      
      // Update user context if it's own profile
      if (isOwnProfile) {
        try {
          // Update AuthContext with latest user data
          const updatedResponse = await api.get('/auth/me');
          const updatedUser = updatedResponse.data;
          const newPercentage = calculateProfileCompletion(updatedUser);
          
          console.log('📊 Updated profile completion:', newPercentage + '%');
          
          if (newPercentage >= 80) {
            setMessage('Profile completed successfully! Redirecting to dashboard...');
            // Profile is now complete, allow navigation
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            setMessage(`Profile updated! Completion: ${newPercentage}%. Please complete remaining fields.`);
          }
        } catch (error) {
          console.error('Error updating user context:', error);
        }
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      console.error('Error details:', error.response?.data);
      setMessage(error.response?.data?.error || 'Error updating profile. Please try again.');
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
      <div className="tabbed-profile">
        <div className="profile-header-section">
          <div className="profile-avatar-large-wrapper">
            <div className="profile-avatar-large">
              {(formData.profilePicture || profile?.profile?.profilePicture) ? (
                <img src={formData.profilePicture || profile.profile.profilePicture} alt="Profile" />
              ) : (
                <div className="avatar-large">
                  {profile?.profile?.firstName?.[0] || profile?.email?.[0] || 'U'}
                </div>
              )}
            </div>
            {canEdit && (
              <>
                <input
                  type="file"
                  id="header-profile-picture-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="profile-picture-edit-btn"
                  onClick={() => document.getElementById('header-profile-picture-input').click()}
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="profile-header-info">
            <h1>{profile?.profile?.firstName || ''} {profile?.profile?.lastName || ''}</h1>
            <p className="employee-id-display">Employee ID: {profile?.employeeId}</p>
            {isAdmin && <p className="admin-badge">Admin View</p>}
            {isHR && !isAdmin && <p className="hr-badge">HR View</p>}
            {isOwnProfile && (
              <div className="profile-completion">
                <div className="completion-header">
                  <span>Profile Completion: {completionPercentage}%</span>
                </div>
                <div className="completion-bar">
                  <div 
                    className="completion-fill" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                {completionPercentage < 80 && missingFields.length > 0 && (
                  <div className="missing-fields">
                    <p className="missing-title">Complete these fields:</p>
                    <ul>
                      {missingFields.slice(0, 5).map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={activeTab === 'personal' ? 'active' : ''}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            {isAdminOrHR && (
              <button
                className={activeTab === 'salary' ? 'active' : ''}
                onClick={() => setActiveTab('salary')}
              >
                Salary Info
              </button>
            )}
            <button
              className={activeTab === 'attendance' ? 'active' : ''}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance
            </button>
            <button
              className={activeTab === 'timeoff' ? 'active' : ''}
              onClick={() => setActiveTab('timeoff')}
            >
              Time Off
            </button>
            <button
              className={activeTab === 'documents' ? 'active' : ''}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={activeTab === 'security' ? 'active' : ''}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="tab-content">
          {activeTab === 'personal' && (
            <div className="tab-panel">
              {editing && canEdit ? (
                <form id="profile-form" onSubmit={handleSubmit}>
                  <div className="profile-picture-edit-section">
                    <div className="current-picture-wrapper">
                      <div className="current-picture">
                        {formData.profilePicture ? (
                          <img src={formData.profilePicture} alt="Profile" />
                        ) : (
                          <div className="avatar-preview">
                            {formData.firstName?.[0] || formData.lastName?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="edit-picture-btn"
                        onClick={handleEditPictureClick}
                        title="Edit Profile Picture"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <input
                        id="profile-picture-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <div className="picture-upload-info">
                      <p className="picture-hint">Click the edit icon to upload a new profile picture</p>
                      <small className="form-hint">Supported formats: JPG, PNG, GIF (Max 5MB)</small>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        disabled={!isAdminOrHR} 
                      />
                      {!isAdminOrHR && <small className="form-hint">Contact HR/Admin to update email</small>}
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input 
                        type="text" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange}
                        disabled={!isAdminOrHR}
                        placeholder={isAdminOrHR ? "Enter department" : "Contact HR/Admin to update"}
                      />
                      {!isAdminOrHR && <small className="form-hint">Contact HR/Admin to update department</small>}
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input 
                        type="text" 
                        name="designation" 
                        value={formData.designation} 
                        onChange={handleChange}
                        disabled={!isAdminOrHR}
                        placeholder={isAdminOrHR ? "Enter designation" : "Contact HR/Admin to update"}
                      />
                      {!isAdminOrHR && <small className="form-hint">Contact HR/Admin to update designation</small>}
                    </div>
                    <div className="form-group">
                      <label>Date of Joining</label>
                      <input 
                        type="date" 
                        name="joiningDate" 
                        value={formData.joiningDate} 
                        onChange={handleChange}
                        disabled={!isAdminOrHR}
                      />
                      {!isAdminOrHR && <small className="form-hint">Contact HR/Admin to update joining date</small>}
                    </div>
                    {isAdminOrHR && (
                      <div className="form-group">
                        <label>Role</label>
                        <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleChange}
                        >
                          <option value="Employee">Employee</option>
                          <option value="HR">HR</option>
                          {isAdmin && <option value="Admin">Admin</option>}
                        </select>
                        <small className="form-hint">Change employee role</small>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="form-group">
                        <label>Employee ID</label>
                        <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} />
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <span>💾</span>
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>First Name</label>
                      <p>{profile?.profile?.firstName || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Last Name</label>
                      <p>{profile?.profile?.lastName || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{profile?.email || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Phone Number</label>
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
                    <div className="info-item">
                      <label>Gender</label>
                      <p>{profile?.profile?.gender || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Marital Status</label>
                      <p>{profile?.profile?.maritalStatus || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Nationality</label>
                      <p>{profile?.profile?.nationality || 'Not provided'}</p>
                    </div>
                    <div className="info-item">
                      <label>Department</label>
                      <p>{profile?.profile?.department || 'Not assigned'}</p>
                    </div>
                    <div className="info-item">
                      <label>Designation</label>
                      <p>{profile?.profile?.position || 'Not assigned'}</p>
                    </div>
                    <div className="info-item">
                      <label>Date of Joining</label>
                      <p>{profile?.profile?.joiningDate ? new Date(profile.profile.joiningDate).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    {isAdminOrHR && (
                      <div className="info-item">
                        <label>Role</label>
                        <p>
                          <span className={`role-badge role-${profile?.role?.toLowerCase() || 'employee'}`}>
                            {profile?.role || 'Employee'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  <div className="profile-section">
                    <div className="section-header">
                      <h3>About</h3>
                      {canEdit && !editing && (
                        <button 
                          onClick={() => setEditing(true)} 
                          className="edit-icon-btn"
                          title="Edit About"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                    {editing && canEdit ? (
                      <textarea 
                        name="about" 
                        value={formData.about || ''} 
                        onChange={handleChange} 
                        placeholder="Tell us about yourself..."
                        rows="4"
                        className="profile-textarea"
                      />
                    ) : (
                      <p className="profile-text-content">
                        {profile?.profile?.about || 'No information provided'}
                      </p>
                    )}
                  </div>

                  {/* What I Love About My Job Section */}
                  <div className="profile-section">
                    <div className="section-header">
                      <h3>What I Love About My Job</h3>
                      {canEdit && !editing && (
                        <button 
                          onClick={() => setEditing(true)} 
                          className="edit-icon-btn"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                    {editing && canEdit ? (
                      <textarea 
                        name="whatILoveAboutMyJob" 
                        value={formData.whatILoveAboutMyJob || ''} 
                        onChange={handleChange} 
                        placeholder="What do you love about your job?"
                        rows="4"
                        className="profile-textarea"
                      />
                    ) : (
                      <p className="profile-text-content">
                        {profile?.profile?.whatILoveAboutMyJob || 'No information provided'}
                      </p>
                    )}
                  </div>

                  {/* Interests and Hobbies Section */}
                  <div className="profile-section">
                    <div className="section-header">
                      <h3>My Interests and Hobbies</h3>
                      {canEdit && !editing && (
                        <button 
                          onClick={() => setEditing(true)} 
                          className="edit-icon-btn"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                    {editing && canEdit ? (
                      <textarea 
                        name="interestsAndHobbies" 
                        value={formData.interestsAndHobbies || ''} 
                        onChange={handleChange} 
                        placeholder="Share your interests and hobbies..."
                        rows="4"
                        className="profile-textarea"
                      />
                    ) : (
                      <p className="profile-text-content">
                        {profile?.profile?.interestsAndHobbies || 'No information provided'}
                      </p>
                    )}
                  </div>

                  {/* Skills Section */}
                  <div className="profile-section">
                    <div className="section-header">
                      <h3>Skills</h3>
                      {canEdit && editing && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newSkills = [...(formData.skills || []), { name: '', level: 'Intermediate' }];
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className="add-item-btn"
                        >
                          + Add Skill
                        </button>
                      )}
                    </div>
                    {editing && canEdit ? (
                      <div className="skills-list">
                        {(formData.skills || []).map((skill, index) => (
                          <div key={index} className="skill-item-edit">
                            <input
                              type="text"
                              placeholder="Skill name"
                              value={skill.name || ''}
                              onChange={(e) => {
                                const newSkills = [...(formData.skills || [])];
                                newSkills[index].name = e.target.value;
                                setFormData({ ...formData, skills: newSkills });
                              }}
                              className="skill-input"
                            />
                            <select
                              value={skill.level || 'Intermediate'}
                              onChange={(e) => {
                                const newSkills = [...(formData.skills || [])];
                                newSkills[index].level = e.target.value;
                                setFormData({ ...formData, skills: newSkills });
                              }}
                              className="skill-level-select"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Expert">Expert</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const newSkills = (formData.skills || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, skills: newSkills });
                              }}
                              className="remove-item-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {(formData.skills || []).length === 0 && (
                          <p className="empty-state">No skills added. Click "+ Add Skill" to add one.</p>
                        )}
                      </div>
                    ) : (
                      <div className="skills-list">
                        {(profile?.profile?.skills || []).length > 0 ? (
                          profile.profile.skills.map((skill, index) => (
                            <div key={index} className="skill-badge">
                              <span className="skill-name">{skill.name}</span>
                              <span className="skill-level">{skill.level}</span>
                            </div>
                          ))
                        ) : (
                          <p className="empty-state">No skills added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Certifications Section */}
                  <div className="profile-section">
                    <div className="section-header">
                      <h3>Certifications</h3>
                      {canEdit && editing && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newCerts = [...(formData.certifications || []), { 
                              name: '', 
                              issuer: '', 
                              issueDate: '', 
                              expiryDate: '',
                              credentialId: '',
                              credentialUrl: ''
                            }];
                            setFormData({ ...formData, certifications: newCerts });
                          }}
                          className="add-item-btn"
                        >
                          + Add Certification
                        </button>
                      )}
                    </div>
                    {editing && canEdit ? (
                      <div className="certifications-list">
                        {(formData.certifications || []).map((cert, index) => (
                          <div key={index} className="cert-item-edit">
                            <input
                              type="text"
                              placeholder="Certification name"
                              value={cert.name || ''}
                              onChange={(e) => {
                                const newCerts = [...(formData.certifications || [])];
                                newCerts[index].name = e.target.value;
                                setFormData({ ...formData, certifications: newCerts });
                              }}
                              className="cert-input"
                            />
                            <input
                              type="text"
                              placeholder="Issuing organization"
                              value={cert.issuer || ''}
                              onChange={(e) => {
                                const newCerts = [...(formData.certifications || [])];
                                newCerts[index].issuer = e.target.value;
                                setFormData({ ...formData, certifications: newCerts });
                              }}
                              className="cert-input"
                            />
                            <input
                              type="date"
                              placeholder="Issue date"
                              value={cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const newCerts = [...(formData.certifications || [])];
                                newCerts[index].issueDate = e.target.value;
                                setFormData({ ...formData, certifications: newCerts });
                              }}
                              className="cert-input"
                            />
                            <input
                              type="date"
                              placeholder="Expiry date (optional)"
                              value={cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const newCerts = [...(formData.certifications || [])];
                                newCerts[index].expiryDate = e.target.value;
                                setFormData({ ...formData, certifications: newCerts });
                              }}
                              className="cert-input"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newCerts = (formData.certifications || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, certifications: newCerts });
                              }}
                              className="remove-item-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {(formData.certifications || []).length === 0 && (
                          <p className="empty-state">No certifications added. Click "+ Add Certification" to add one.</p>
                        )}
                      </div>
                    ) : (
                      <div className="certifications-list">
                        {(profile?.profile?.certifications || []).length > 0 ? (
                          profile.profile.certifications.map((cert, index) => (
                            <div key={index} className="cert-item">
                              <div className="cert-header">
                                <h4>{cert.name}</h4>
                                {cert.credentialId && <span className="credential-id">ID: {cert.credentialId}</span>}
                              </div>
                              <p className="cert-issuer">{cert.issuer}</p>
                              <div className="cert-dates">
                                {cert.issueDate && (
                                  <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                                )}
                                {cert.expiryDate && (
                                  <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                                )}
                              </div>
                              {cert.credentialUrl && (
                                <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="cert-link">
                                  View Credential
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="empty-state">No certifications added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {canEdit && !editing && (
                    <div className="action-buttons">
                      <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
                      {isAdminOrHR && (
                        <button className="btn-secondary">Print</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'salary' && isAdminOrHR && (
            <div className="tab-panel">
              {/* Salary Status Indicator */}
              <div className="salary-status-section">
                <div className="salary-status-header">
                  <h3>Salary Status</h3>
                  <span className={`salary-status-badge ${
                    !profile?.salary?.baseSalary || profile?.salary?.baseSalary === 0 
                      ? 'status-not-configured' 
                      : profile?.salary?.netSalary > 0 
                        ? 'status-active' 
                        : 'status-pending'
                  }`}>
                    {!profile?.salary?.baseSalary || profile?.salary?.baseSalary === 0 
                      ? 'Not Configured' 
                      : profile?.salary?.netSalary > 0 
                        ? 'Active' 
                        : 'Pending'}
                  </span>
                </div>
                <div className="salary-status-details">
                  <div className="status-detail-item">
                    <span className="status-label">Base Salary:</span>
                    <span className="status-value">{formatCurrency(profile?.salary?.baseSalary || 0)}</span>
                  </div>
                  <div className="status-detail-item">
                    <span className="status-label">Net Salary:</span>
                    <span className="status-value">{formatCurrency(profile?.salary?.netSalary || 0)}</span>
                  </div>
                  <div className="status-detail-item">
                    <span className="status-label">Last Updated:</span>
                    <span className="status-value">
                      {profile?.updatedAt 
                        ? new Date(profile.updatedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
              {editing && isAdmin ? (
                <form onSubmit={handleSubmit}>
                  <h3>Salary Components</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>HRA</label>
                      <input type="number" name="hra" value={formData.hra} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Conveyance Allowance</label>
                      <input type="number" name="conveyance" value={formData.conveyance} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Medical Allowance</label>
                      <input type="number" name="medical" value={formData.medical} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Special Allowance</label>
                      <input type="number" name="specialAllowance" value={formData.specialAllowance} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF</label>
                      <input type="number" name="pf" value={formData.pf} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>ESI</label>
                      <input type="number" name="esi" value={formData.esi} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Professional Tax</label>
                      <input type="number" name="professionalTax" value={formData.professionalTax} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Income Tax</label>
                      <input type="number" name="incomeTax" value={formData.incomeTax} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <div className="salary-breakdown">
                    <div className="salary-section">
                      <h3>Earnings</h3>
                      <div className="salary-item">
                        <span>Basic Salary</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.baseSalary || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>HRA</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.hra || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>Conveyance Allowance</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.conveyance || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>Medical Allowance</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.medical || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>Special Allowance</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.specialAllowance || 0)}</span>
                      </div>
                      <div className="salary-total">
                        <span>Gross Salary</span>
                        <span className="salary-amount">{formatCurrency((profile?.salary?.baseSalary || 0) + (profile?.salary?.allowances || 0))}</span>
                      </div>
                    </div>
                    <div className="salary-section">
                      <h3>Deductions</h3>
                      <div className="salary-item">
                        <span>PF</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.pf || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>ESI</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.esi || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>Professional Tax</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.professionalTax || 0)}</span>
                      </div>
                      <div className="salary-item">
                        <span>Income Tax</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.incomeTax || 0)}</span>
                      </div>
                      <div className="salary-total deductions">
                        <span>Total Deductions</span>
                        <span className="salary-amount">{formatCurrency(profile?.salary?.deductions || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="net-salary-display">
                    <span>Net Salary</span>
                    <span className="net-salary-amount">{formatCurrency(profile?.salary?.netSalary || 0)}</span>
                  </div>
                  <div className="action-buttons">
                    {isAdmin && (
                      <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
                    )}
                    <button className="btn-secondary">Print</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="tab-panel">
              <div className="attendance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No attendance records found</td>
                      </tr>
                    ) : (
                      attendance.map((record) => (
                        <tr key={record._id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                          <td>{record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : '-'}</td>
                          <td>{record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : '-'}</td>
                          <td>{record.workingHours || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timeoff' && (
            <div className="tab-panel">
              <div className="leaves-table">
                <table>
                  <thead>
                    <tr>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Type of Leave</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="no-data">No leave requests found</td>
                      </tr>
                    ) : (
                      leaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                          <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                          <td>{leave.leaveType}</td>
                          <td>
                            <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="tab-panel">
              <div className="documents-section">
                <p>Documents feature coming soon...</p>
                {isAdminOrHR && (
                  <button className="btn-primary">Upload Document</button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-panel">
              {editing && canEdit ? (
                <form id="security-form" onSubmit={handleSubmit}>
                  <div className="bank-details-section">
                    <h2>Bank Details</h2>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Account Number</label>
                        <input 
                          type="text" 
                          name="accountNumber" 
                          value={formData.accountNumber || ''} 
                          onChange={handleChange}
                          placeholder="Enter account number"
                        />
                      </div>
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input 
                          type="text" 
                          name="bankName" 
                          value={formData.bankName || ''} 
                          onChange={handleChange}
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input 
                          type="text" 
                          name="ifscCode" 
                          value={formData.ifscCode || ''} 
                          onChange={handleChange}
                          placeholder="Enter IFSC code"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>PAN Number</label>
                        <input 
                          type="text" 
                          name="panNumber" 
                          value={formData.panNumber || ''} 
                          onChange={handleChange}
                          placeholder="Enter PAN number"
                          style={{ textTransform: 'uppercase' }}
                          maxLength="10"
                        />
                        <small className="form-hint">Format: ABCDE1234F</small>
                      </div>
                      <div className="form-group">
                        <label>UAN Number</label>
                        <input 
                          type="text" 
                          name="uanNumber" 
                          value={formData.uanNumber || ''} 
                          onChange={handleChange}
                          placeholder="Enter UAN number"
                          maxLength="12"
                        />
                        <small className="form-hint">Universal Account Number (12 digits)</small>
                      </div>
                      <div className="form-group">
                        <label>Employee Code</label>
                        <input 
                          type="text" 
                          name="empCode" 
                          value={formData.empCode || ''} 
                          onChange={handleChange}
                          placeholder="Enter employee code"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Save Bank Details</button>
                      <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="info-display">
                  <div className="bank-details-section">
                    <div className="section-header">
                      <h2>Bank Details</h2>
                      {canEdit && (
                        <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
                      )}
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Account Number</label>
                        <p>{profile?.profile?.bankDetails?.accountNumber || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>Bank Name</label>
                        <p>{profile?.profile?.bankDetails?.bankName || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>IFSC Code</label>
                        <p>{profile?.profile?.bankDetails?.ifscCode || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>PAN Number</label>
                        <p>{profile?.profile?.bankDetails?.panNumber || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>UAN Number</label>
                        <p>{profile?.profile?.bankDetails?.uanNumber || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <label>Employee Code</label>
                        <p>{profile?.profile?.bankDetails?.empCode || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TabbedProfile;

