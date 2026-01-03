// Calculate profile completion percentage
export const calculateProfileCompletion = (user) => {
  if (!user) return 0;

  // Required fields for profile completion
  const fields = [
    user.profile?.firstName,
    user.profile?.lastName,
    user.email, // Always present
    user.profile?.phone,
    user.profile?.address,
    user.profile?.dateOfBirth,
    user.profile?.gender,
    user.profile?.maritalStatus,
    user.profile?.nationality,
    user.profile?.department,
    user.profile?.position,
    user.profile?.joiningDate,
    user.profile?.profilePicture
  ];

  // Count filled fields (not empty, null, or undefined)
  const filledFields = fields.filter(field => {
    if (field === null || field === undefined) return false;
    if (typeof field === 'string' && field.trim() === '') return false;
    if (field instanceof Date && isNaN(field.getTime())) return false;
    return true;
  }).length;
  
  const totalFields = fields.length;
  const percentage = Math.round((filledFields / totalFields) * 100);
  
  console.log('📊 Profile completion calculation:', {
    filledFields,
    totalFields,
    percentage,
    fields: fields.map((f, i) => ({ index: i, value: f, filled: !!f && f !== '' }))
  });
  
  return percentage;
};

// Check if profile is complete (minimum 80% completion)
export const isProfileComplete = (user) => {
  return calculateProfileCompletion(user) >= 80;
};

// Get missing fields list
export const getMissingFields = (user) => {
  if (!user) return [];

  const requiredFields = [
    { key: 'firstName', label: 'First Name', value: user.profile?.firstName },
    { key: 'lastName', label: 'Last Name', value: user.profile?.lastName },
    { key: 'phone', label: 'Phone Number', value: user.profile?.phone },
    { key: 'address', label: 'Address', value: user.profile?.address },
    { key: 'dateOfBirth', label: 'Date of Birth', value: user.profile?.dateOfBirth },
    { key: 'gender', label: 'Gender', value: user.profile?.gender },
    { key: 'maritalStatus', label: 'Marital Status', value: user.profile?.maritalStatus },
    { key: 'nationality', label: 'Nationality', value: user.profile?.nationality },
    { key: 'department', label: 'Department', value: user.profile?.department },
    { key: 'position', label: 'Designation', value: user.profile?.position },
    { key: 'joiningDate', label: 'Date of Joining', value: user.profile?.joiningDate },
    { key: 'profilePicture', label: 'Profile Picture', value: user.profile?.profilePicture }
  ];

  return requiredFields
    .filter(field => !field.value || field.value === '')
    .map(field => field.label);
};

