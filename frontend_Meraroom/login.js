// js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message'); // From your HTML

    // Exit if login form elements aren't found on this page
    if (!loginForm || !emailInput || !passwordInput || !errorMessageDiv) {
        // You can add a console log here if you want to debug if elements are missing
        // console.warn("Login form or its required input/error elements not found. Login.js script will not attach submit listener.");
        return;
    }

    const BASE_API_URL = 'http://localhost:5000/api/v1'; // Ensure this matches your backend

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission reload
        errorMessageDiv.textContent = ''; // Clear previous errors
        errorMessageDiv.style.display = 'none'; // Hide error div initially

        const email = emailInput.value.trim();
        const password = passwordInput.value; // Don't trim password

        // Basic frontend check
        if (!email || !password) {
            errorMessageDiv.textContent = 'Please enter both email and password.';
            errorMessageDiv.style.display = 'block'; // Show error div
            return;
        }

        const loginData = {
            email: email,
            password: password
        };

        console.log('Attempting login with:', email);
        // Optional: Show loading indicator here

        try {
            const response = await fetch(`${BASE_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            // Check if response is OK (status 200-299) AND if backend indicates success (e.g., result.success is true)
            if (response.ok && result.success && result.token) {
                console.log('Login successful:', result);

                // Store token and user data in Local Storage
                // IMPORTANT: The key 'meraroom_token' must be used by other scripts (like main.js)
                // when checking login status.
                localStorage.setItem('meraroom_token', result.token);
                if (result.user) { // Store user object if backend sends it
                    localStorage.setItem('meraroom_user', JSON.stringify(result.user));
                }

                // --- MODIFIED REDIRECTION LOGIC ---
                const urlParams = new URLSearchParams(window.location.search);
                const redirectTarget = urlParams.get('redirect'); // Get the 'redirect' parameter from URL

                if (redirectTarget) {
                    console.log('Login successful. Redirecting to specified target:', redirectTarget);
                    // Ensure the redirect target is properly decoded if it was encoded
                    window.location.href = decodeURIComponent(redirectTarget);
                } else {
                    // Fallback to your existing role-based redirection if no 'redirect' param is present
                    const userRole = result.user?.role; // Safely access the role from the response

                    if (userRole === 'seeker') {
                        console.log('Redirecting seeker to seeker-profile.html (no redirect param).');
                        window.location.href = 'seeker-profile.html'; // Or user dashboard/listings
                    } else if (userRole === 'owner') {
                        console.log('Redirecting owner to owner-dashboard.html (no redirect param).');
                        window.location.href = 'owner-dashboard.html';
                    } else {
                        // Fallback redirect if role is missing, unknown, or no specific role page
                        console.warn('User role not identified, or no redirect param. Redirecting to index.html.');
                        window.location.href = 'index.html'; // A sensible default logged-in page
                    }
                }
                // --- END MODIFIED REDIRECTION LOGIC ---

            } else {
                // Handle login errors (e.g., 401 Invalid Credentials, 400 Bad Request from backend)
                console.error('Login failed (backend response):', result);
                errorMessageDiv.textContent = result.error || 'Login failed. Please check your credentials.';
                errorMessageDiv.style.display = 'block'; // Show error div
            }

        } catch (error) {
            // Handle network errors or other fetch failures
            console.error('Login Fetch Error:', error);
            errorMessageDiv.textContent = 'Login failed. Could not connect to server. Please try again later.';
            errorMessageDiv.style.display = 'block'; // Show error div
        } finally {
            // Optional: Hide loading indicator here
        }
    });
});