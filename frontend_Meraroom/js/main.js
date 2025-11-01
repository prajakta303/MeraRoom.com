// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded - Script Fired on page:", window.location.pathname);

    // --- Define Backend Base URL Globally for this script ---
    const BASE_API_URL = 'https://meraroom-backend.vercel.app/api/v1'; // Ensure this matches your backend

    // --- DOM Elements (Get elements potentially on ANY page) ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navbar = document.querySelector('.navbar');
    const navLoginLinkLi = document.getElementById('nav-login-link');
    const navSeekerRegisterLi = document.getElementById('nav-seeker-register-link');
    const navOwnerRegisterLi = document.getElementById('nav-owner-register-link');
    const profileSectionPlaceholder = document.getElementById('profile-section-placeholder');
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    const testimonialSlider = document.querySelector('.testimonial-slider');
    const defineStandardsBtn = document.getElementById('defineStandardsBtn');

    // --- DOM Elements SPECIFIC to Preferences Page ---
    const preferenceGrid = document.getElementById('preferenceGrid');
    const updatePrefsBtn = document.getElementById('updatePrefsBtn');
    const prefCounterMsg = document.getElementById('prefCounterMsg');
    const additionalInfoTextarea = document.getElementById('additionalInfo');
    const MIN_SELECTIONS = 5;


    // --- Core Functions ---

    function updateHeaderUI() {
        const token = localStorage.getItem('meraroom_token');
        const userDataString = localStorage.getItem('meraroom_user');
        let user = null;

        if (token && userDataString) {
            try {
                user = JSON.parse(userDataString);
                if (!user || typeof user !== 'object' || !user._id) {
                    console.warn("main.js: Invalid user data structure in localStorage. Clearing login state.");
                    throw new Error("Invalid user data structure");
                }
            } catch (e) {
                console.error("main.js: Error parsing user data or invalid data, clearing potentially corrupt login state.", e);
                localStorage.removeItem('meraroom_token');
                localStorage.removeItem('meraroom_user');
                token = null; user = null;
            }
        } else if (token && !userDataString) {
            console.warn("main.js: Token found but no user data. Clearing token.");
            localStorage.removeItem('meraroom_token');
            token = null;
        }

        if (token && user) {
            if (navLoginLinkLi) navLoginLinkLi.style.display = 'none';
            if (navSeekerRegisterLi) navSeekerRegisterLi.style.display = 'none';
            if (navOwnerRegisterLi) navOwnerRegisterLi.style.display = 'none';

            if (profileSectionPlaceholder) {
                profileSectionPlaceholder.style.display = 'flex';
                profileSectionPlaceholder.innerHTML = `
                    <div class="profile-trigger" id="profile-trigger" tabindex="0" aria-haspopup="true" aria-expanded="false" title="My Account">
                         <div class="profile-icon"><i class="fas fa-user-circle"></i></div>
                     </div>
                     <ul class="profile-dropdown" id="profile-dropdown" role="menu">
                        <li class="dropdown-header" role="separator"><span>Hi, ${user.name || 'User'}!</span></li>
                        <li><a href="${user.role === 'owner' ? 'owner-dashboard.html' : 'seeker-profile.html'}" role="menuitem"><i class="fas fa-user-edit"></i> My Profile/Dashboard</a></li>
                        <li><a href="preferences.html" role="menuitem"><i class="fas fa-sliders-h"></i> My Living Standards</a></li>
                        <li><a href="#" role="menuitem"><i class="fas fa-cog"></i> Account Settings</a></li>
                        <li class="dropdown-divider" role="separator"></li>
                        <li class="logout-link" id="dropdown-logout" role="menuitem" tabindex="0"><span class="logout-text"><i class="fas fa-sign-out-alt"></i> Logout</span></li>
                    </ul>`;
                setupDropdownListeners();
            }
        } else {
            if (navLoginLinkLi) navLoginLinkLi.style.display = 'list-item';
            if (navSeekerRegisterLi) navSeekerRegisterLi.style.display = 'list-item';
            if (navOwnerRegisterLi) navOwnerRegisterLi.style.display = 'list-item';
            if (profileSectionPlaceholder) {
                profileSectionPlaceholder.innerHTML = '';
                profileSectionPlaceholder.style.display = 'none';
            }
        }
        setActiveNavLink();
    }

    function setupDropdownListeners() {
        const trigger = document.getElementById('profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        const logoutItem = document.getElementById('dropdown-logout');
        if (!trigger || !dropdown) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdown.classList.toggle('active');
            trigger.setAttribute('aria-expanded', isActive.toString());
        });
        document.addEventListener('click', (e) => {
            if (dropdown.classList.contains('active') && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
        function handleDropdownKeydown(e){
            if (e.key === 'Escape'){
                dropdown.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
                trigger.focus();
            }
        }
        dropdown.addEventListener('keydown', handleDropdownKeydown);
        trigger.addEventListener('keydown', (e) => {
             if((e.key === 'Enter' || e.key === ' ') && !dropdown.classList.contains('active')){
                e.preventDefault();
                dropdown.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
                dropdown.querySelector('a[href], .logout-link')?.focus();
             } else if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
             }
        });
        if (logoutItem) {
            logoutItem.addEventListener('click', handleLogout);
            logoutItem.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogout();} });
        }
    }

    function handleLogout() {
        localStorage.removeItem('meraroom_token');
        localStorage.removeItem('meraroom_user');
        updateHeaderUI();
        window.location.href = 'login.html';
    }

    function setActiveNavLink() {
        const currentPagePath = window.location.pathname.replace(/\/$/, "");
        const navLinks = navbar?.querySelectorAll('nav ul li a');
        if (!navLinks) return;
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            let linkPath = linkHref;
            try {
                if (linkHref.startsWith('/') || linkHref.startsWith('http')) {
                    linkPath = new URL(link.href).pathname.replace(/\/$/, "");
                } else if (!linkHref.startsWith('#') && linkHref !== '') {
                    const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                    linkPath = (base + linkHref).replace(/\/$/, "").replace(/\/.\//g, '/').replace(/^\/\//, '/');
                }
            } catch(e) { /* Use linkHref as is */ }
            link.classList.remove('active');
            if (linkPath === currentPagePath || (linkHref === 'index.html' && (currentPagePath === '' || currentPagePath.endsWith('/index.html') ) )) {
                link.classList.add('active');
            }
        });
    }

    if (defineStandardsBtn) {
        defineStandardsBtn.addEventListener('click', function() {
            const authToken = localStorage.getItem('meraroom_token');
            if (authToken) {
                window.location.href = 'preferences.html';
            } else {
                window.location.href = 'login.html?redirect=' + encodeURIComponent('preferences.html');
            }
        });
    }

    // --- START: Logic for Preferences Page (ONLY if elements exist) ---
    if (preferenceGrid && updatePrefsBtn && prefCounterMsg && additionalInfoTextarea) {
        console.log("main.js: Preferences page elements FOUND. Initializing select & update logic.");

        preferenceGrid.addEventListener('click', (event) => {
            const prefItem = event.target.closest('.pref-item');
            if (prefItem) {
                prefItem.classList.toggle('selected');
                updateButtonAndCounterState_PrefsPage();
            }
        });

        function updateButtonAndCounterState_PrefsPage() {
            const selectedItems = preferenceGrid.querySelectorAll('.pref-item.selected');
            const selectedCount = selectedItems.length;
            if (selectedCount >= MIN_SELECTIONS) {
                updatePrefsBtn.disabled = false;
                prefCounterMsg.classList.remove('visible'); prefCounterMsg.textContent = '';
            } else {
                updatePrefsBtn.disabled = true;
                prefCounterMsg.textContent = `Please select at least ${MIN_SELECTIONS} preferences. (${selectedCount} selected)`;
                prefCounterMsg.classList.add('visible');
            }
        }

        updatePrefsBtn.addEventListener('click', async () => {
            if (!updatePrefsBtn.disabled) {
                const selectedIconArray = Array.from(preferenceGrid.querySelectorAll('.pref-item.selected'))
                                              .map(item => item.dataset.preference); // This is an array of strings
                const additionalDetailsText = additionalInfoTextarea.value.trim();
                const authToken = localStorage.getItem('meraroom_token');

                if (!authToken) {
                    alert("Error: Not logged in. Please log in.");
                    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
                    return;
                }

                // VVVVVVVV KEY CHANGE VVVVVVVV
                const dataToSend = {
                    selectedLivingStandards: selectedIconArray, // Renamed key being sent to backend
                    additional_info: additionalDetailsText
                };
                // ^^^^^^^^^ KEY CHANGE ^^^^^^^^^

                console.log(`Sending to ${BASE_API_URL}/api/v1/users/preferences:`, JSON.stringify(dataToSend, null, 2));
                updatePrefsBtn.textContent = 'Updating...'; updatePrefsBtn.disabled = true;

                try {
                    const response = await fetch(`${BASE_API_URL}/api/v1/users/preferences`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(dataToSend)
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        alert('Living Standards updated successfully!');
                        const existingUserStr = localStorage.getItem('meraroom_user');
                        if(existingUserStr && result.data){
                            try {
                                const existingUser = JSON.parse(existingUserStr);
                                if (result.data.livingStandards) existingUser.livingStandards = result.data.livingStandards;
                                if (result.data.additional_info !== undefined) existingUser.additional_info = result.data.additional_info;
                                localStorage.setItem('meraroom_user', JSON.stringify(existingUser));
                            } catch(e) { console.error("main.js: Error updating meraroom_user in localStorage.", e); }
                        }
                    } else {
                        console.error("main.js: Backend error updating living standards -", result);
                        alert(`Error: ${result.error || 'Failed to update living standards.'}`);
                    }
                } catch (error) {
                    console.error("main.js: FETCH FAILED for living standards update:", error);
                    alert('A Network error occurred. Please check server and console.');
                } finally {
                    updatePrefsBtn.textContent = 'Update Preferences';
                    updateButtonAndCounterState_PrefsPage();
                }
            }
        });

        async function loadUserPreferences_PrefsPage() {
            const authToken = localStorage.getItem('meraroom_token');
            if (!authToken) { updateButtonAndCounterState_PrefsPage(); return; }
            try {
                const response = await fetch(`${BASE_API_URL}/api/v1/users/preferences`, {
                    method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const result = await response.json();
                if (response.ok && result.success && result.data) {
                    const userLivingStandards = result.data.livingStandards || [];
                    additionalInfoTextarea.value = result.data.additional_info || "";
                    preferenceGrid.querySelectorAll('.pref-item').forEach(item => {
                        item.classList.toggle('selected', userLivingStandards.includes(item.dataset.preference));
                    });
                } else { console.error("main.js: Failed to load living standards:", result.error); }
            } catch (error) {
                console.error("main.js: FETCH FAILED for loading living standards:", error);
                alert('Network error loading your preferences.');
            }
            updateButtonAndCounterState_PrefsPage();
        }
        loadUserPreferences_PrefsPage();
    }
    // --- END: Logic for Preferences Page ---

    // --- Other global scripts ---
    if (mobileMenuBtn && navbar) { mobileMenuBtn.addEventListener('click', function() { const isExpanded = navbar.classList.toggle('active'); const icon = mobileMenuBtn.querySelector('i'); if(icon){ icon.classList.toggle('fa-bars', !isExpanded); icon.classList.toggle('fa-times', isExpanded); } mobileMenuBtn.setAttribute('aria-expanded', isExpanded.toString()); }); }
    if (navbar) { navbar.querySelectorAll('nav ul li a').forEach(link => { link.addEventListener('click', () => { if (navbar.classList.contains('active') && mobileMenuBtn) { navbar.classList.remove('active'); const icon = mobileMenuBtn.querySelector('i'); if (icon) { icon.classList.add('fa-bars'); icon.classList.remove('fa-times'); } mobileMenuBtn.setAttribute('aria-expanded', 'false'); } }); }); }
    if (newsletterForms.length > 0) { newsletterForms.forEach(form => { form.addEventListener('submit', function(e) { e.preventDefault(); const emailInput = form.querySelector('input[type="email"]'); if (emailInput?.value && emailInput.value.includes('@')) { alert('Thank you! (Newsletter Placeholder)'); emailInput.value = ''; } else if (emailInput) { alert('Please enter a valid email.'); emailInput.focus(); } }); }); }
    if (testimonialSlider) { const testimonials = testimonialSlider.querySelectorAll('.testimonial'); if (testimonials.length > 0) { let currentTestimonial = 0; function showTestimonial(index) { testimonials.forEach(t => t.classList.remove('active')); if (testimonials[index]) { testimonials[index].classList.add('active'); } } showTestimonial(currentTestimonial); setInterval(() => { currentTestimonial = (currentTestimonial + 1) % testimonials.length; showTestimonial(currentTestimonial); }, 7000); } }
    const animateOnScrollElements = document.querySelectorAll('.feature-card, .section-title'); if (animateOnScrollElements.length > 0) { const animateOnScrollObserver = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('animate-on-scroll'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); animateOnScrollElements.forEach(el => { animateOnScrollObserver.observe(el); }); }

    updateHeaderUI();
});