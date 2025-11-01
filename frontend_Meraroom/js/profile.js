// js/profile.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('profile.js: DOMContentLoaded - Script Fired.');

    // --- Define Backend Base URL ---
    const BASE_API_URL = 'http://localhost:5000';

    // --- 1. Check Login Status ---
    const token = localStorage.getItem('meraroom_token');
    if (!token) {
        console.warn('profile.js: Auth token missing. Redirecting to login.');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    // --- Function to fetch FRESH and full user data ---
    async function loadAndDisplayUserProfile() {
        const profilePageContainer = document.querySelector('.profile-page-container');
        const ownerDashboardContainer = document.querySelector('.dashboard-page-container');

        if (!profilePageContainer && !ownerDashboardContainer) {
             console.log("profile.js: Not on a seeker profile or owner dashboard page. Skipping user data population.");
             return;
        }

        try {
            console.log("profile.js: Fetching user data from /api/v1/auth/me with token.");
            const response = await fetch(`${BASE_API_URL}/api/v1/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            console.log("profile.js: Raw response from /api/v1/auth/me:", JSON.stringify(result, null, 2));

            if (!response.ok || !result.success || !result.data) {
                console.error('profile.js: Failed to fetch user profile. Backend response issue.', result.error || `Status: ${response.status}`);
                localStorage.removeItem('meraroom_token');
                localStorage.removeItem('meraroom_user');
                alert('Could not load your profile information. Your session might have expired or is invalid. Please log in again.');
                window.location.href = 'login.html';
                return;
            }

            const user = result.data;
            console.log('profile.js: Parsed user object from /auth/me:', user);

            localStorage.setItem('meraroom_user', JSON.stringify(user));

            const userNameWelcome = document.getElementById('user-name');
            if (userNameWelcome) {
                userNameWelcome.textContent = user.name || 'User';
            }

            // Target divs for content population
            const basicInfoContent = document.getElementById('basic-info-content');
            const registrationPreferencesContent = document.getElementById('preferences-content');
            const livingStandardsDisplayContent = document.getElementById('living-standards-display');
            const additionalInfoDisplayContent = document.getElementById('additional-info-display');
            const contactDetailsContent = document.getElementById('contact-details-content');
            const ownerInfoContent = document.getElementById('owner-info-content');

            // --- Populate Seeker Profile Specifics ---
            if (user.role === 'seeker' && profilePageContainer) {
                console.log("profile.js: Populating Seeker sections.");

                // Basic Info Card
                if (basicInfoContent) {
                    basicInfoContent.innerHTML = `
                        <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${user.name || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${user.email || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${user.phone || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Hometown:</span><span class="info-value">${user.hometown || 'N/A'}</span></div>
                    `;
                }

                // Display Text-Based Registration Preferences
                if (registrationPreferencesContent) {
                    const regPrefs = user.registrationPreferences;
                    console.log("profile.js - user.registrationPreferences for display:", regPrefs);
                    if (regPrefs && typeof regPrefs === 'object' && Object.values(regPrefs).some(val => val && String(val).trim() !== '')) {
                        let regPrefsHtml = '';
                        if(regPrefs.accommodationType) regPrefsHtml += `<div class="info-item"><span class="info-label">Accommodation Type:</span><span class="info-value">${regPrefs.accommodationType}</span></div>`;
                        if(regPrefs.budget) regPrefsHtml += `<div class="info-item"><span class="info-label">Budget:</span><span class="info-value">${regPrefs.budget}</span></div>`;
                        if(regPrefs.preferredGender) regPrefsHtml += `<div class="info-item"><span class="info-label">Preferred Gender:</span><span class="info-value">${regPrefs.preferredGender}</span></div>`;
                        if(regPrefs.hobbies) regPrefsHtml += `<div class="info-item"><span class="info-label">Hobbies:</span><span class="info-value">${regPrefs.hobbies}</span></div>`;
                        if(regPrefs.habits) regPrefsHtml += `<div class="info-item"><span class="info-label">Habits:</span><span class="info-value">${regPrefs.habits}</span></div>`;
                        if(regPrefs.restrictions) regPrefsHtml += `<div class="info-item"><span class="info-label">Restrictions:</span><span class="info-value">${regPrefs.restrictions}</span></div>`;
                        if(regPrefs.specialReq) regPrefsHtml += `<div class="info-item"><span class="info-label">Special Requirements:</span><span class="info-value">${regPrefs.specialReq}</span></div>`;
                        registrationPreferencesContent.innerHTML = regPrefsHtml || '<p>Registration preferences partially set.</p>';
                    } else {
                        registrationPreferencesContent.innerHTML = '<p>Registration preferences not set.</p>';
                    }
                }

                // Display Icon-Based Living Standards
                if (livingStandardsDisplayContent) {
                    const standards = user.livingStandards;
                    console.log("profile.js - user.livingStandards for display:", standards);
                    if (standards && standards.length > 0) {
                        livingStandardsDisplayContent.innerHTML = '<ul>' + standards.map(prefKey => `<li>${getFriendlyPreferenceName(prefKey)}</li>`).join('') + '</ul>';
                    } else {
                        livingStandardsDisplayContent.innerHTML = '<p>No specific living standards defined.</p>';
                    }
                }

                // Display Additional Info
                if (additionalInfoDisplayContent) {
                    const addInfo = user.additional_info;
                    console.log("profile.js - user.additional_info for display:", addInfo);
                    if (addInfo && addInfo.trim() !== "") {
                        additionalInfoDisplayContent.innerHTML = `<p>${addInfo.replace(/\n/g, '<br>')}</p>`;
                    } else {
                        additionalInfoDisplayContent.innerHTML = '<p>No additional information provided.</p>';
                    }
                }

                // Contact/Other Details Card (Your original logic)
                if (contactDetailsContent) {
                     contactDetailsContent.innerHTML = `
                         <div class="info-item"><span class="info-label">Profile Type:</span><span class="info-value">${user.userType || 'N/A'}</span></div>
                          ${user.userType === 'student' ? `
                             <div class="info-item"><span class="info-label">College:</span><span class="info-value">${user.college || 'N/A'}</span></div>
                             <div class="info-item"><span class="info-label">Course:</span><span class="info-value">${user.course || 'N/A'}</span></div>
                             ${user.scholarshipCertificate ? `<div class="info-item"><span class="info-label">Scholarship:</span><span class="info-value"><a href="${BASE_API_URL}${user.scholarshipCertificate}" target="_blank" rel="noopener noreferrer">View Certificate</a></span></div>` : ''}
                         ` : ''}
                         ${user.userType === 'working' ? `
                             <div class="info-item"><span class="info-label">Company:</span><span class="info-value">${user.company || 'N/A'}</span></div>
                             <div class="info-item"><span class="info-label">Designation:</span><span class="info-value">${user.designation || 'N/A'}</span></div>
                         ` : ''}
                         <hr style="margin: 10px 0;">
                          <div class="info-item"><span class="info-label">Father's Name:</span><span class="info-value">${user.fatherName || 'N/A'}</span></div>
                         <div class="info-item"><span class="info-label">Father's Contact:</span><span class="info-value">${user.fatherContact || 'N/A'}</span></div>
                          <div class="info-item"><span class="info-label">Mother's Name:</span><span class="info-value">${user.motherName || 'N/A'}</span></div>
                          <div class="info-item"><span class="info-label">Mother's Contact:</span><span class="info-value">${user.motherContact || 'N/A'}</span></div>
                          <div class="info-item"><span class="info-label">Emergency Contact:</span><span class="info-value">${user.emergencyContact || 'N/A'}</span></div>
                    `;
                }
            }
            // --- Populate Owner Dashboard Specifics ---
            else if (user.role === 'owner' && ownerDashboardContainer) {
                console.log("profile.js: Populating Owner sections.");
                 if (ownerInfoContent) {
                     ownerInfoContent.innerHTML = `
                         <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${user.name || 'N/A'}</span></div>
                         <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${user.email || 'N/A'}</span></div>
                         <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${user.phone || 'N/A'}</span></div>
                          <div class="info-item"><span class="info-label">Address:</span><span class="info-value">${user.permanentAddress || 'N/A'}</span></div>
                          <div class="info-item"><span class="info-label">ID Proof:</span><span class="info-value">${user.idProof ? `<a href="${BASE_API_URL}${user.idProof}" target="_blank" rel="noopener noreferrer">View ID</a>` : 'N/A'}</span></div>
                     `;
                 }
                if (token) {
                    fetchAndDisplayOwnerProperties_ProfilePage(user._id, token); // Ensure this function is defined correctly
                 }
            }

        } catch (error) {
            console.error("profile.js: Error in loadAndDisplayUserProfile catch block:", error);
            alert("Could not load your profile due to an error. Please try logging in again.");
            localStorage.removeItem('meraroom_token');
            localStorage.removeItem('meraroom_user');
            window.location.href = 'login.html';
        }
    }

    // --- Call function to load profile data if token exists ---
    if (token) {
        loadAndDisplayUserProfile();
    }

    // --- Setup Edit Profile Button ---
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
         editProfileBtn.addEventListener('click', (e) => {
             e.preventDefault();
             const userDataStringOnEdit = localStorage.getItem('meraroom_user');
             let roleForEdit = 'seeker';
             if(userDataStringOnEdit){
                try {
                    const userForEdit = JSON.parse(userDataStringOnEdit);
                    if(userForEdit && userForEdit.role) roleForEdit = userForEdit.role;
                } catch(err){ console.error("profile.js: Error parsing user for edit button:", err); }
             }
             if(roleForEdit === 'seeker') {
                // window.location.href = 'edit-seeker-profile.html';
                alert("Seeker Edit Profile page/modal to be implemented!");
             } else if (roleForEdit === 'owner') {
                // window.location.href = 'edit-owner-profile.html';
                alert("Owner Edit Profile page/modal to be implemented!");
             } else {
                alert("Edit profile functionality to be implemented!");
             }
         });
    }

    // If you have a specific logout button on this page (other than header)
    // function setupLogoutOnProfilePage() {
    //     const logoutLinkOnProfile = document.getElementById('logout-link');
    //     if (logoutLinkOnProfile) {
    //        logoutLinkOnProfile.addEventListener('click', function(e) { /* ... logout logic ... */ });
    //     }
    // }
    // setupLogoutOnProfilePage(); // Call if needed for a page-specific logout

}); // End DOMContentLoaded


// Helper function to get friendly names for icon-based preferences
// Ensure this function is accessible, either here or globally
function getFriendlyPreferenceName(prefKey) {
    const names = {
        'night-owl': 'Night Owl', 'early-bird': 'Early Bird', 'studious': 'Studious',
        'fitness-freak': 'Fitness Freak', 'sporty': 'Sporty', 'wanderer': 'Wanderer',
        'party-lover': 'Party Lover', 'pet-lover': 'Pet Lover', 'vegan': 'Vegan',
        'non-alcoholic': 'Non Alcoholic', 'music-lover': 'Music Lover', 'non-smoker': 'Non Smoker'
    };
    return names[prefKey] || prefKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Functions for Owner Property (Your existing functions - ensure they are accessible)
async function fetchAndDisplayOwnerProperties_ProfilePage(userId, token) {
    const propertiesListDiv = document.getElementById('owner-properties-list');
    if (!propertiesListDiv) {
        console.log("profile.js: owner-properties-list div not found, skipping property display.");
        return;
    }
    propertiesListDiv.innerHTML = '<p>Loading your properties...</p>';
    const BASE_API_URL_PROFILE = 'http://localhost:5000'; // Local constant for these functions

    try {
        const response = await fetch(`${BASE_API_URL_PROFILE}/api/v1/accommodations/my`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown server error when fetching properties."}));
            console.error(`profile.js: Error fetching owner properties: ${response.status}`, errorData);
            throw new Error(`Failed to fetch properties (Status: ${response.status}) - ${errorData.error || "Server error"}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
            if (result.count === 0) {
                propertiesListDiv.innerHTML = '<p>You haven\'t listed any properties yet. <a href="owner-property-form.html" class="btn btn-sm btn-primary">Add Property</a></p>';
            } else {
                let propertiesHTML = '<ul class="owner-property-item-list">';
                result.data.forEach(prop => {
                    propertiesHTML += `
                        <li>
                            <div class="property-info"><strong>${prop.propertyName || prop.address || 'Property Listing'}</strong><small>${prop.city || ''} - ${prop.propertyType || ''}</small></div>
                            <div class="property-actions">
                                <button class="btn btn-sm btn-secondary view-property-details" data-id="${prop._id}" title="View Details">View</button>
                                <button class="btn btn-sm btn-primary edit-property" data-id="${prop._id}" title="Edit Property">Edit</button>
                                <button class="btn btn-sm btn-danger delete-property" data-id="${prop._id}" title="Delete Property">Delete</button>
                            </div>
                        </li>`;
                });
                propertiesHTML += '</ul>';
                propertiesListDiv.innerHTML = propertiesHTML;
                addPropertyActionListeners_ProfilePage(userId, token);
            }
        } else { propertiesListDiv.innerHTML = `<p>Could not load properties: ${result.error || 'Unknown API error'}</p>`;}
    } catch (error) {
        console.error("profile.js: Error in fetchAndDisplayOwnerProperties_ProfilePage catch block:", error);
        propertiesListDiv.innerHTML = `<p style="color: red;">Error loading your properties: ${error.message}</p>`;
    }
}

function addPropertyActionListeners_ProfilePage(userId, token) {
    const propertiesListDiv = document.getElementById('owner-properties-list');
    if (!propertiesListDiv) return;

    propertiesListDiv.addEventListener('click', async (e) => {
         const targetButton = e.target.closest('button');
         if (!targetButton) return;
        const propertyId = targetButton.getAttribute('data-id');
         if (!propertyId) return;

        const BASE_API_URL_PROFILE_ACTION = 'http://localhost:5000';

        if (targetButton.classList.contains('view-property-details')) {
             window.location.href = `accommodation-details.html?id=${propertyId}`;
        } else if (targetButton.classList.contains('edit-property')) {
             // window.location.href = `edit-property.html?id=${propertyId}`;
             alert(`Edit functionality for property ${propertyId} to be implemented.`);
         } else if (targetButton.classList.contains('delete-property')) {
              if (confirm(`Are you sure you want to DELETE this property?\nThis action cannot be undone.`)) {
                 try {
                       const deleteResponse = await fetch(`${BASE_API_URL_PROFILE_ACTION}/api/v1/accommodations/${propertyId}`, {
                           method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                      });
                     const deleteResult = await deleteResponse.json();
                     if(deleteResponse.ok && deleteResult.success) {
                         alert(`Property deleted successfully.`);
                          fetchAndDisplayOwnerProperties_ProfilePage(userId, token); // Re-fetch
                     } else {
                          alert(`Failed to delete property: ${deleteResult.error || deleteResponse.statusText || 'Server error'}`);
                      }
                 } catch (deleteError) {
                      alert(`An error occurred while deleting the property. Please check the console.`);
                 }
             }
        }
     });
}