//listings.js
document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Elements ---
    // Use querySelector for robustness - will return null if not found, preventing errors later if used carefully
    const listingsContainer = document.getElementById('listingsContainer');
    const searchForm = document.getElementById('searchForm');
    const sortBy = document.getElementById('sortBy');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // Exit script early if essential elements for this page aren't found
    if (!listingsContainer || !searchForm || !prevPageBtn || !nextPageBtn || !pageInfo) {
        console.warn("Essential listing elements not found. listings.js operations stopped. Is this the correct page?");
        return;
    }

    // --- State Variables ---
    let currentPage = 1;
    const listingsPerPage = 6; // Adjust as needed
    let currentPaginationData = null; // To store pagination info from API

   const BASE_API_URL = 'https://meraroom-backend.vercel.app/api/v1';
   const BASE_URL_FOR_IMAGES = 'https://meraroom-backend.vercel.app';
    // --- Function to Fetch Listings from API ---
    async function fetchListings() {
        console.log(`Fetching listings for page ${currentPage}`);
        listingsContainer.innerHTML = '<p>Loading listings...</p>'; // Loading indicator

        // Build Query String
        let queryParams = new URLSearchParams();

        // Get values safely, using empty string if element doesn't exist (though we check above)
        const location = document.getElementById('location')?.value || '';
        const type = document.getElementById('accommodationType')?.value || '';
        const budget = document.getElementById('budget')?.value || '';
        const currentSort = sortBy?.value || ''; // Use the variable 'sortBy' defined above
        const roommatePref = document.getElementById('roommatePreferences')?.value || ''; // Send if backend supports it

        if (location) queryParams.append('location', location);
        if (type) queryParams.append('type', type);
        if (budget) queryParams.append('budget', budget);
        if (roommatePref) queryParams.append('roommatePref', roommatePref); // Use 'roommatePref' or backend param name
        if (currentSort) queryParams.append('sort', currentSort);

        queryParams.append('page', currentPage);
        queryParams.append('limit', listingsPerPage);

        const apiUrl = `${BASE_API_URL}/accommodations?${queryParams.toString()}`;
        console.log("API URL:", apiUrl); // Log the URL for debugging

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! Status: ${response.status}`, errorText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log("API Result:", result);

            if (result.success) {
                currentPaginationData = result.pagination;
                displayListings(result.data); // Only pass data, pagination is handled separately
                updatePaginationUI(result.pagination);
            } else {
                console.error("API Error:", result.error || 'Unknown API error');
                listingsContainer.innerHTML = '<div class="no-results"><p>Error loading accommodations. Please try again.</p></div>';
                 updatePaginationUI(null);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            listingsContainer.innerHTML = '<div class="no-results"><p>Could not connect to the server or fetch data. Please check your connection.</p></div>';
             updatePaginationUI(null);
        }
    }

    // --- Function to Display Listings ---
    function displayListings(listings) {
        listingsContainer.innerHTML = ''; // Clear previous listings or loading message

        if (!listings || listings.length === 0) {
            listingsContainer.innerHTML = '<div class="no-results"><p>No accommodations found matching your criteria.</p></div>';
            // updatePaginationUI(null); // Pagination update happens after fetch now
            return;
        }

        listings.forEach(listing => {
            const listingCard = document.createElement('div');
            listingCard.className = 'listing-card';

            const imageUrl = listing.photos && listing.photos.length > 0
                            ? `${BASE_URL_FOR_IMAGES}${listing.photos[0]}`
                            : 'images/default-placeholder.png';

           const amenitiesStr = listing.amenities && listing.amenities.length > 0
               ? listing.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')
               : '<span class="amenity">N/A</span>';

            let roommateInfoStr = `<p class="roommate-count">Login to view roommate info</p>`; // Placeholder

            listingCard.innerHTML = `
                <div class="listing-image">
                    <img src="${imageUrl}" alt="${listing.title || 'Accommodation Image'}" onerror="this.onerror=null;this.src='images/default-placeholder.png';">
                    ${listing.propertyType ? `<div class="listing-type">${listing.propertyType.toUpperCase()}</div>` : ''}
                    ${listing.averageRating ? `
                        <div class="listing-rating">
                            <i class="fas fa-star"></i> ${listing.averageRating.toFixed(1)}
                        </div>
                    ` : ''}
                </div>
                <div class="listing-content">
                    <h3>${listing.title || listing.propertyName || 'Untitled Listing'}</h3>
                    <p class="listing-location"><i class="fas fa-map-marker-alt"></i> ${listing.address || 'Location not specified'}${listing.city ? `, ${listing.city}` : ''}</p>
                    <p class="listing-price">₹${listing.rentAmount ? listing.rentAmount.toLocaleString('en-IN') : 'N/A'} <span>/month</span></p>
                    <div class="listing-amenities">
                        ${amenitiesStr}
                    </div>
                    <p class="listing-description">${listing.description || 'No description available.'}</p>
                    ${roommateInfoStr}
                    <div class="listing-buttons">
                        <button class="btn btn-primary view-details" data-id="${listing._id}">View Details</button>
                        <button class="btn btn-secondary contact-owner" data-id="${listing._id}">Contact Owner</button>
                    </div>
                </div>
            `;
            listingsContainer.appendChild(listingCard);
        });
        // updatePaginationUI() happens after fetch completes
    }

    // --- Function to Update Pagination UI ---
    function updatePaginationUI(pagination) {
        if (pagination && pagination.totalDocs > 0) {
             pageInfo.textContent = `Page ${pagination.currentPage || 1} of ${pagination.totalPages || 1}`;
             prevPageBtn.disabled = !pagination.prev;
             nextPageBtn.disabled = !pagination.next;
        } else {
             pageInfo.textContent = (pagination && pagination.totalDocs === 0) ? 'Page 0 of 0' : 'Page 1 of 1';
             prevPageBtn.disabled = true;
             nextPageBtn.disabled = true;
        }
    }

     // --- Function to Fetch Single Listing Details for Modal ---
     async function handleViewDetails(listingId) {
         console.log("Fetching details for ID:", listingId);
         try {
               const response = await fetch(`${BASE_API_URL}/accommodations/${listingId}`);
                if (!response.ok) {
                     console.error(`Error fetching details: ${response.status}`);
                     throw new Error('Listing details not found or error occurred.');
                 }
                const result = await response.json();
                console.log("Single Listing Result:", result);
                if (result.success) {
                   showListingDetailsModal(result.data);
                } else {
                    alert(`Could not fetch listing details: ${result.error || 'Unknown error'}`);
                }
            } catch(error) {
                console.error("Fetch details error:", error);
                alert(error.message);
            }
        }

    // --- Function to Show Detailed Listing View Modal ---
    // --- Function to Show DETAILED CREATIVE Listing View Modal ---
    function showListingDetailsModal(listing) {
        const existingModal = document.querySelector('.modal-creative'); // Target new class
        if (existingModal) document.body.removeChild(existingModal);

        const modal = document.createElement('div');
        modal.className = 'modal-creative'; // Use new class

        // --- Prepare Content ---

        // Main Image & Thumbnails
        const mainImageUrl = listing.photos && listing.photos.length > 0
                          ? `${BASE_URL_FOR_IMAGES}${listing.photos[0]}`
                           : 'images/default-placeholder.png';
        let thumbnailsHTML = '';
        if (listing.photos && listing.photos.length > 0) { // Display even single photo as active thumb
            thumbnailsHTML = listing.photos.map((photoPath, index) =>
                 `<img src="${BASE_URL_FOR_IMAGES}${photoPath}" alt="Thumbnail ${index+1}" class="${index === 0 ? 'active-thumb' : ''}" onerror="this.style.display='none'">`
             ).join('');
        }

       // Amenities
        let amenitiesHTML = '<p>No amenities listed.</p>';
       if (listing.amenities && listing.amenities.length > 0) {
            amenitiesHTML = '<div class="amenities-grid">';
            // Example: Add icons based on amenity name (requires Font Awesome)
            const iconMap = { wifi: 'fas fa-wifi', food: 'fas fa-utensils', ac: 'fas fa-snowflake', laundry: 'fas fa-jug-detergent', cleaning: 'fas fa-broom', parking: 'fas fa-parking', powerbackup: 'fas fa-bolt', security: 'fas fa-shield-alt', gym: 'fas fa-dumbbell', tv: 'fas fa-tv' };
            listing.amenities.forEach(amenity => {
                 const iconClass = iconMap[amenity.toLowerCase().replace(/\s+/g, '')] || 'fas fa-check-circle'; // Default icon
                 amenitiesHTML += `<div class="amenity-item"><i class="${iconClass}"></i><span>${amenity}</span></div>`;
            });
            amenitiesHTML += '</div>';
        }

       // Key Property Details
       const detailsList = [
           { label: 'Property Type', value: listing.propertyType, icon: 'fas fa-home' },
           { label: 'Available From', value: listing.availableFrom ? new Date(listing.availableFrom).toLocaleDateString() : 'N/A', icon: 'fas fa-calendar-alt' },
           { label: 'Rent Amount', value: `₹${listing.rentAmount ? listing.rentAmount.toLocaleString('en-IN') : 'N/A'} / month`, icon: 'fas fa-rupee-sign' },
           { label: 'Security Deposit', value: `₹${listing.securityDeposit ? listing.securityDeposit.toLocaleString('en-IN') : 'N/A'}`, icon: 'fas fa-lock' },
           { label: 'Total Rooms', value: listing.totalRooms || 'N/A', icon: 'fas fa-door-open' },
            { label: 'Agreement Terms', value: listing.agreementTerms || 'N/A', icon: 'fas fa-file-signature' },
            { label: 'Mess Facility', value: listing.messFacility || 'N/A', icon: 'fas fa-utensils' },
           // Add other important fields similarly
       ];
        let keyDetailsHTML = '<div class="key-details-list">';
       detailsList.forEach(item => {
           if(item.value && item.value !== 'N/A') { // Only show item if it has a value
               keyDetailsHTML += `
                    <div class="info-item">
                         <span class="info-label"><i class="${item.icon}"></i> ${item.label}:</span>
                        <span class="info-value">${item.value}</span>
                     </div>
               `;
            }
       });
        keyDetailsHTML += '</div>';

        // Owner Info
       let ownerInfoHTML = '<p>Owner information unavailable.</p>';
       if (listing.owner) {
            ownerInfoHTML = `
                 <div class="info-item">
                    <span class="info-label"><i class="fas fa-user-tie"></i> Name:</span>
                     <span class="info-value">
                        ${listing.owner.name}
                        ${listing.owner.isVerified ? '<span class="verified-owner-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label"><i class="fas fa-phone-alt"></i> Contact:</span>
                    <span class="info-value"><button class="contact-owner-modal" data-id="${listing._id}">Login to View/Request</button></span>
                 </div>
            `;
        }


        // --- Construct Modal HTML ---
        modal.innerHTML = `
            <div class="modal-content-creative">
                <button class="modal-close-creative" title="Close">×</button>
               <div class="modal-body-creative">

                    <div class="modal-main-content">
                         <!-- Gallery Column -->
                        <div class="modal-gallery-column">
                           <div class="main-photo-container">
                                <img id="main-modal-photo" src="${mainImageUrl}" alt="Main accommodation photo" onerror="this.onerror=null;this.src='images/default-placeholder.png';">
                           </div>
                            ${thumbnailsHTML ? `<div class="thumbnail-container">${thumbnailsHTML}</div>` : '<p>No additional photos.</p>'}
                        </div>

                       <!-- Details Column -->
                        <div class="modal-details-column">
                            <div class="detail-header">
                                 <h2>${listing.title || listing.propertyName || 'Accommodation Details'}</h2>
                                <p class="location"><i class="fas fa-map-marker-alt"></i> ${listing.address || 'N/A'}${listing.city ? `, ${listing.city}` : ''}</p>
                                <p class="price">₹${listing.rentAmount ? listing.rentAmount.toLocaleString('en-IN') : 'N/A'} <span>/month</span></p>
                                 ${listing.averageRating ? `
                                    <div class="detail-rating">
                                        <i class="fas fa-star"></i>
                                        <span>${listing.averageRating.toFixed(1)} / 5.0</span>
                                     </div>
                                 ` : ''}
                            </div>

                            <div class="detail-section description-section">
                                 <h3><i class="fas fa-info-circle"></i> Description</h3>
                                <p>${listing.description || 'No description provided.'}</p>
                            </div>

                             <div class="detail-section amenities-section">
                                 <h3><i class="fas fa-star"></i> Amenities</h3>
                                 ${amenitiesHTML}
                            </div>

                           <div class="detail-section key-details-section">
                                 <h3><i class="fas fa-list-ul"></i> Key Details</h3>
                                ${keyDetailsHTML}
                            </div>

                             <div class="detail-section rules-section">
                                  <h3><i class="fas fa-gavel"></i> House Rules</h3>
                                 <p>${listing.houseRules || 'None specified.'}</p>
                            </div>

                             <div class="detail-section owner-info-section">
                                  <h3><i class="fas fa-user-shield"></i> Owner Information</h3>
                                  ${ownerInfoHTML}
                             </div>
                        </div><!-- /modal-details-column -->
                   </div><!-- /modal-main-content -->

                    <div class="modal-footer-actions">
                         <button class="btn btn-primary book-now" data-id="${listing._id}"><i class="fas fa-calendar-check"></i> Book Now</button>
                        <button class="btn btn-secondary request-contact" data-id="${listing._id}"><i class="fas fa-envelope"></i> Request Contact</button>
                    </div>

               </div> <!-- /modal-body-creative -->
            </div><!-- /modal-content-creative -->
       `;

        document.body.appendChild(modal);
       document.body.style.overflow = 'hidden';

        // Activate modal (triggers fade-in animation)
        requestAnimationFrame(() => { // Ensure element is in DOM before adding class
             modal.classList.add('active');
        });

        // --- Add Event Listeners for New Modal ---
       setupCreativeModalListeners(modal, listing);

    } // End showListingDetailsModal

   // Function to setup listeners for the creative modal
    function setupCreativeModalListeners(modalElement, listing) {
        // Close button
       modalElement.querySelector('.modal-close-creative').addEventListener('click', closeCreativeModal);

       // Click outside to close
       modalElement.addEventListener('click', (event) => { if (event.target === modalElement) closeCreativeModal(); });

       // Thumbnail clicks
        const mainPhoto = modalElement.querySelector('#main-modal-photo');
       modalElement.querySelectorAll('.thumbnail-container img').forEach(thumb => {
            thumb.addEventListener('click', () => {
               if(mainPhoto) mainPhoto.src = thumb.src;
                // Update active thumbnail state
                modalElement.querySelectorAll('.thumbnail-container img').forEach(t => t.classList.remove('active-thumb'));
                 thumb.classList.add('active-thumb');
            });
       });

        // Action Buttons
        const token = localStorage.getItem('meraroom_token');
       modalElement.querySelector('.book-now').addEventListener('click', () => handleAction(token, 'book', listing));
        modalElement.querySelector('.request-contact').addEventListener('click', () => handleAction(token, 'request-contact', listing));
       modalElement.querySelector('.contact-owner-modal')?.addEventListener('click', () => handleAction(token, 'view-contact', listing));
    }

    // Separate function to close creative modal
    function closeCreativeModal() {
        const modal = document.querySelector('.modal-creative');
        if(modal) {
            modal.classList.remove('active'); // Start fade-out
            // Wait for animation to finish before removing
            modal.addEventListener('transitionend', () => {
                 if(!modal.classList.contains('active')) { // Check if still meant to be closed
                    document.body.removeChild(modal);
                    document.body.style.overflow = 'auto';
                 }
            }, { once: true }); // Listener runs only once
       }
    }

   // handleAction function (keep the one you have - it's used by both modal and card buttons)
    function handleAction(token, actionType, listing) {
        // ... (Your existing handleAction logic) ...
       if (!token) { alert('Please login or register.'); return; }
       switch(actionType) {
           case 'book': alert(`Booking TBD: ${listing?.title || listing?._id}`); break;
            case 'request-contact':
            case 'view-contact':
                const ownerDetails = listing?.owner ? `Name: ${listing.owner.name}, Info: Request/view details TBD.` : 'Owner details unavailable.';
                 alert(`Logged In Action!\n${ownerDetails}`);
                 break;
            default: console.warn("Unknown action type:", actionType);
       }
    }

    function closeModal() {
         const modal = document.querySelector('.modal');
         if(modal) {
             document.body.removeChild(modal);
             document.body.style.overflow = 'auto';
         }
    }

    function handleAction(token, actionType, listing) {
         if (!token) {
              alert('Please login or register to perform this action.');
              // Optional: redirect to login
              return;
          }
          // User is logged in
          switch(actionType) {
              case 'book':
                   // Implement booking logic/redirect
                  alert(`Booking feature to be implemented for: ${listing.title}`);
                  break;
              case 'request-contact':
              case 'view-contact': // Treat viewing/requesting similarly for now
                    // Implement contact logic (fetch contact info securely if needed)
                   const ownerDetails = listing.owner ? `Name: ${listing.owner.name}, Email: ${listing.owner.email || 'Protected'}, Phone: ${listing.owner.phone || 'Protected'}` : 'Owner details unavailable';
                   alert(`Logged In! Owner Info (Display Carefully):\n${ownerDetails}\n\nNote: Real contact info might require further verification or direct messaging system.`);
                   break;
              default:
                   console.warn("Unknown action type:", actionType);
          }
    }


    // --- Event Listeners Setup ---

    // Search Form Submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        currentPage = 1;
        fetchListings();
    });

    // Sort Dropdown Change (only if sortBy element exists)
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            currentPage = 1;
            fetchListings();
        });
    }

    // Pagination Buttons
    prevPageBtn.addEventListener('click', function() {
        if (currentPaginationData && currentPaginationData.prev) {
            currentPage--;
            fetchListings();
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPaginationData && currentPaginationData.next) {
            currentPage++;
            fetchListings();
        }
    });

    // Event Delegation for Listing Card Buttons
    listingsContainer.addEventListener('click', function(e) {
        const targetButton = e.target.closest('button');
        if (!targetButton) return;

        const listingId = targetButton.getAttribute('data-id');
        if (!listingId) return;

        if (targetButton.classList.contains('view-details')) {
            handleViewDetails(listingId);
        } else if (targetButton.classList.contains('contact-owner')) {
            const token = localStorage.getItem('meraroom_token');
            handleAction(token, 'request-contact', { _id: listingId, title: 'this listing' }); // Pass minimal info for alert
        }
    });


    // --- Initial Data Load ---
    fetchListings();

});
