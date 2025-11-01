document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message');

    // Exit if login form doesn't exist on this page
    if (!loginForm) {
        return;
    }

    const BASE_API_URL = 'http://localhost:5000/api/v1'; // Ensure this matches your backend

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission reload
        errorMessageDiv.textContent = ''; // Clear previous errors

        const email = emailInput.value.trim();
        const password = passwordInput.value; // Don't trim password

        // Basic frontend check (optional, backend validates too)
        if (!email || !password) {
            errorMessageDiv.textContent = 'Please enter both email and password.';
            return;
        }

        const loginData = {
            email: email,
            password: password
        };

        console.log('Attempting login with:', email); // Existing log
        // Optional: Show loading indicator

        try {
            const response = await fetch(`${BASE_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) { // Status 200-299
                // --- START DEBUG LOGS ---
                console.log('Login successful Response OK:', result); // LOG 1: Log the entire successful response object
                // --- END DEBUG LOGS ---

                // Store token and user data in Local Storage
                localStorage.setItem('meraroom_token', result.token);
                localStorage.setItem('meraroom_user', JSON.stringify(result.user));

                // ****** START MODIFICATION: Role-based Redirect ******
                const userRole = result.user?.role; // Safely access the role

                // --- START DEBUG LOGS ---
                console.log('Extracted userRole:', userRole); // LOG 2: Log the specific role found
                // --- END DEBUG LOGS ---

                if (userRole === 'seeker') {
                    // --- START DEBUG LOGS ---
                    console.log('Condition matched: seeker. Attempting redirect to seeker-profile.html...'); // LOG 3a
                    // --- END DEBUG LOGS ---
                    window.location.href = 'seeker-profile.html';
                } else if (userRole === 'owner') {
                     // --- START DEBUG LOGS ---
                    console.log('Condition matched: owner. Attempting redirect to owner-dashboard.html...'); // LOG 3b
                     // --- END DEBUG LOGS ---
                    window.location.href = 'owner-dashboard.html';
                } else {
                     // --- START DEBUG LOGS ---
                    console.log('Condition FALLBACK hit. Redirecting to listings.html...'); // LOG 3c
                    console.warn('User role causing fallback was:', userRole); // LOG 3d: Log the problematic role value
                    // --- END DEBUG LOGS ---
                    window.location.href = 'listings.html';
                }
                // ****** END MODIFICATION ******

            } else {
                // Handle login errors (e.g., 401 Invalid Credentials, 400 Bad Request)
                console.error('Login failed (Response not OK):', result); // Modified log for clarity
                errorMessageDiv.textContent = result.error || 'Login failed. Please check your credentials.';
            }

        } catch (error) {
            // Handle network errors or fetch failures
            console.error('Login Fetch Error:', error);
            errorMessageDiv.textContent = 'Login failed. Could not connect to server. Please try again later.';
        } finally {
            // Optional: Hide loading indicator
        }
    });
});