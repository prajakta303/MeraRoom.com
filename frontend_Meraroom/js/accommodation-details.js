// js/accommodation-details.js
document.addEventListener('DOMContentLoaded', () => {
    const bookNowBtn = document.getElementById('bookNowBtn');
    const bookingStatusMsg = document.getElementById('bookingStatusMsg');
    const bookingMessageModal = document.getElementById('bookingMessageModal');
    const closeBookingModalBtn = document.getElementById('closeBookingModal');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const bookingMessageTextarea = document.getElementById('bookingMessageTextarea');

    const BASE_API_URL = 'https://meraroom-backend.vercel.app'; // Ensure this matches your backend

    // This function would be called after you fetch and display accommodation details
    async function initializeBookingButton(accommodationId, ownerId, accommodationData) {
        if (!bookNowBtn) return;

        const token = localStorage.getItem('meraroom_token');
        const userDataString = localStorage.getItem('meraroom_user');
        let currentUser = null;
        if (userDataString) {
            try { currentUser = JSON.parse(userDataString); }
            catch (e) { console.error("Error parsing current user data from localStorage", e); }
        }

        // Conditions to show the button:
        // 1. User is logged in.
        // 2. User is a 'seeker'.
        // 3. User is not the owner of this accommodation.
        if (token && currentUser && currentUser.role === 'seeker' && currentUser._id !== ownerId) {
            bookNowBtn.style.display = 'inline-block'; // Show the button
            bookNowBtn.dataset.accommodationId = accommodationId; // Set data attributes
            bookNowBtn.dataset.ownerId = ownerId;

            // Check if user already has an active request for THIS accommodation
            try {
                const response = await fetch(`${BASE_API_URL}/api/v1/bookings/my-request/${accommodationId}`, {
                     method: 'GET',
                     headers: { 'Authorization': `Bearer ${token}` }
                });
                if(response.ok){
                    const result = await response.json();
                    if(result.success && result.data) {
                        updateButtonStateBasedOnExistingRequest(result.data);
                        return; // State updated, no further action on button setup needed
                    }
                }
                // If no existing request or error fetching it, button remains "Book Now"
            } catch (error) {
                console.error("Error checking existing booking request:", error);
                // Proceed to allow new booking attempt if check fails
            }


            bookNowBtn.addEventListener('click', () => {
                if (bookingMessageModal) bookingMessageModal.style.display = 'flex'; // Show message modal
            });

            if (closeBookingModalBtn) {
                closeBookingModalBtn.onclick = () => bookingMessageModal.style.display = 'none';
            }

            // When clicking "Confirm & Send Request" in the modal
            if (confirmBookingBtn) {
                confirmBookingBtn.addEventListener('click', handleBookingRequest);
            }
            // Close modal if clicked outside of it
            window.onclick = function(event) {
                if (event.target == bookingMessageModal) {
                    bookingMessageModal.style.display = "none";
                }
            }

        } else if (currentUser && currentUser._id === ownerId) {
            if (bookingStatusMsg) bookingStatusMsg.textContent = "This is your property.";
            bookNowBtn.style.display = 'none';
        } else {
            // Not logged in as seeker, or other issue
            bookNowBtn.style.display = 'none';
             // If not logged in, you could show a "Login to Book" button linking to login.html
        }
    }
    function updateButtonStateBasedOnExistingRequest(bookingData){
        if (!bookNowBtn || !bookingStatusMsg) return;
        switch(bookingData.status) {
            case 'pending':
                bookNowBtn.textContent = 'Request Sent';
                bookNowBtn.className = 'btn btn-secondary btn-book-now request-sent'; // Using secondary for pending
                bookNowBtn.disabled = true;
                bookingStatusMsg.textContent = `Your booking request was sent on ${new Date(bookingData.requestedAt).toLocaleDateString()}.`;
                bookingStatusMsg.className = 'booking-status-message info';
                break;
            case 'accepted':
            case 'booked': // Group accepted and booked for now for button display
                bookNowBtn.textContent = 'Booked!';
                bookNowBtn.className = 'btn btn-success btn-book-now already-booked'; // Green color
                bookNowBtn.disabled = true;
                bookingStatusMsg.textContent = `Your booking is confirmed! Accepted on ${new Date(bookingData.acceptedAt || bookingData.bookedAt).toLocaleDateString()}.`;
                bookingStatusMsg.className = 'booking-status-message success';
                break;
            case 'living':
                 bookNowBtn.textContent = 'Currently Living Here';
                 bookNowBtn.className = 'btn btn-success btn-book-now already-booked';
                 bookNowBtn.disabled = true;
                 bookingStatusMsg.textContent = `You started living here from ${new Date(bookingData.livingFromDate).toLocaleDateString()}.`;
                 bookingStatusMsg.className = 'booking-status-message success';
                 break;
            case 'rejected':
            case 'cancelled_by_seeker':
            case 'cancelled_by_owner':
                 bookNowBtn.textContent = 'Booking Not Active';
                 bookNowBtn.className = 'btn btn-danger btn-book-now';
                 bookNowBtn.disabled = true; // Or re-enable booking if allowed after rejection/cancellation
                 bookingStatusMsg.textContent = `Your previous booking request was ${bookingData.status.replace('_', ' ')}.`;
                 bookingStatusMsg.className = 'booking-status-message error';
                 break;
            default:
                bookNowBtn.textContent = 'Book Now';
                bookNowBtn.className = 'btn btn-primary btn-book-now';
                bookNowBtn.disabled = false;
        }
    }


    async function handleBookingRequest() {
        if (!bookNowBtn || !bookingStatusMsg) return;

        const accommodationId = bookNowBtn.dataset.accommodationId;
        // ownerId is implicitly handled by backend using accommodationId
        const messageFromSeeker = bookingMessageTextarea ? bookingMessageTextarea.value.trim() : "";
        const token = localStorage.getItem('meraroom_token');

        if (!accommodationId || !token) {
            bookingStatusMsg.textContent = 'Error: Missing required information.';
            bookingStatusMsg.className = 'booking-status-message error';
            if (bookingMessageModal) bookingMessageModal.style.display = 'none';
            return;
        }

        bookNowBtn.textContent = 'Booking in progress...';
        bookNowBtn.classList.add('in-progress');
        bookNowBtn.disabled = true;
        if (bookingMessageModal) bookingMessageModal.style.display = 'none'; // Hide modal after confirm
        confirmBookingBtn.disabled = true; // Disable confirm while processing

        try {
            const response = await fetch(`${BASE_API_URL}/api/v1/bookings/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ accommodationId, messageFromSeeker }) // Backend gets ownerId from accommodationId
            });

            const result = await response.json();

            if (response.ok && result.success) {
                bookNowBtn.textContent = 'Request Sent!';
                bookNowBtn.classList.remove('in-progress');
                bookNowBtn.classList.add('request-sent'); // Or a more specific "pending" class
                bookNowBtn.disabled = true;
                bookingStatusMsg.textContent = result.message || 'Booking request submitted successfully!';
                bookingStatusMsg.className = 'booking-status-message success';
            } else {
                bookNowBtn.textContent = 'Book Now'; // Reset button
                bookNowBtn.classList.remove('in-progress');
                bookNowBtn.disabled = false;
                bookingStatusMsg.textContent = `Error: ${result.error || 'Failed to submit booking request.'}`;
                bookingStatusMsg.className = 'booking-status-message error';
            }
        } catch (error) {
            console.error("Error submitting booking request:", error);
            bookNowBtn.textContent = 'Book Now'; // Reset button
            bookNowBtn.classList.remove('in-progress');
            bookNowBtn.disabled = false;
            bookingStatusMsg.textContent = 'Network error. Please try again.';
            bookingStatusMsg.className = 'booking-status-message error';
        } finally {
             if(confirmBookingBtn) confirmBookingBtn.disabled = false;
        }
    }

    // --- SIMULATED: Call this when accommodation details are loaded ---
    // In a real scenario, you would get accommodationId and ownerId from your API response for the listing
    async function fetchAccommodationDetailsAndSetupButton() {
        const urlParams = new URLSearchParams(window.location.search);
        const accommodationIdFromUrl = urlParams.get('id'); // Assuming ID is in URL like ?id=xyz

        if (!accommodationIdFromUrl) {
            console.error("Accommodation ID not found in URL for details page.");
            if(bookingStatusMsg) bookingStatusMsg.textContent = "Could not load accommodation details.";
            if(bookNowBtn) bookNowBtn.style.display = 'none';
            return;
        }

        try {
            // Fetch accommodation details (including owner ID)
            const response = await fetch(`${BASE_API_URL}/api/v1/accommodations/${accommodationIdFromUrl}`);
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                const accommodationData = result.data;
                // ---- Populate your accommodation details on the page here ----
                // Example: document.getElementById('propertyName').textContent = accommodationData.propertyName;
                console.log("Loaded accommodation details:", accommodationData);

                // Now setup the booking button with fetched data
                initializeBookingButton(accommodationData._id, accommodationData.owner._id, accommodationData);
                // accommodationData.owner might be just an ID or a populated object.
                // If it's an object, use accommodationData.owner._id
                // If your backend route for fetching accommodation populates the owner,
                // then accommodationData.owner would be an object.
            } else {
                console.error("Failed to fetch accommodation details:", result.error);
                 if(bookingStatusMsg) bookingStatusMsg.textContent = `Error: ${result.error || "Could not load accommodation details."}`;
                 if(bookNowBtn) bookNowBtn.style.display = 'none';
            }
        } catch (error) {
            console.error("Error fetching accommodation details:", error);
             if(bookingStatusMsg) bookingStatusMsg.textContent = "Network error loading accommodation details.";
             if(bookNowBtn) bookNowBtn.style.display = 'none';
        }
    }

    fetchAccommodationDetailsAndSetupButton(); // Call this to start the process on page load
});

// You will need to add this route to your bookingRoutes.js and a controller in bookingController.js
// To check if a user already has a request for THIS specific accommodation, to set initial button state
// Backend - routes/bookingRoutes.js
// router.route('/my-request/:accommodationId').get(protect, authorize('seeker'), getMyBookingRequestForAccommodation);
// Backend - controllers/bookingController.js
/*
exports.getMyBookingRequestForAccommodation = asyncHandler(async (req, res, next) => {
    const existingRequest = await BookingRequest.findOne({
        seeker: req.user.id,
        accommodation: req.params.accommodationId,
        status: { $in: ['pending', 'accepted', 'booked', 'living'] }
    });
    if (!existingRequest) {
        // It's important to send success: true even if no request is found,
        // so frontend knows the check was successful but there's no active request.
        return res.status(200).json({ success: true, data: null, message: 'No active request found.' });
    }
    res.status(200).json({ success: true, data: existingRequest });
});
*/