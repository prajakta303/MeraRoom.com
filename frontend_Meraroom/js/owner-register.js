document.addEventListener('DOMContentLoaded', function() {
  const ownerForm = document.getElementById('ownerRegistrationForm');

  // Exit if not on the owner registration page
  if (!ownerForm) {
      console.warn("Owner registration form not found. owner-register.js stopping.");
      return;
  }

  const nextStepButtons = ownerForm.querySelectorAll('.next-step');
  const prevStepButtons = ownerForm.querySelectorAll('.prev-step');
  const formSteps = ownerForm.querySelectorAll('.form-step'); // Query within the form

  const BASE_API_URL = 'https://meraroom-backend.vercel.app/api/v1'; // Adjust if necessary

  // --- Multi-step Navigation ---
  nextStepButtons.forEach(button => {
      button.addEventListener('click', function () {
          const currentStep = this.closest('.form-step');
          if (!currentStep) return; // Should not happen

          const nextStepId = this.getAttribute('data-next');
          const nextStep = document.getElementById(nextStepId);

          // Validate CURRENT step before proceeding
          if (validateOwnerStep(currentStep)) {
              currentStep.classList.remove('active');
              if(nextStep) {
                  nextStep.classList.add('active');
                  // Scroll form into view if needed
                  ownerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                  console.error(`Next step element with ID '${nextStepId}' not found.`);
              }
          } else {
               alert('Please fill in all required fields correctly in this step before proceeding.');
          }
      });
  });

  prevStepButtons.forEach(button => {
      button.addEventListener('click', function () {
          const currentStep = this.closest('.form-step');
          if (!currentStep) return; // Should not happen

          const prevStepId = this.getAttribute('data-prev');
          const prevStep = document.getElementById(prevStepId);

          currentStep.classList.remove('active');
           if(prevStep) {
              prevStep.classList.add('active');
              // Scroll form into view if needed
               ownerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
           } else {
               console.error(`Previous step element with ID '${prevStepId}' not found.`);
           }
      });
  });

  // --- Form Submission ---
  ownerForm.addEventListener('submit', async function (e) {
      e.preventDefault(); // VERY IMPORTANT! Prevent default HTML submission
      console.log("Owner form submitted. Preventing default.");

       const currentActiveStep = ownerForm.querySelector('.form-step.active');
       if (!currentActiveStep) {
           console.error("Cannot find active step on submit.");
           alert("An internal error occurred. Cannot submit form.");
           return;
       }

      // Final validation on the CURRENTLY ACTIVE (assumed last) step
       if (!validateOwnerStep(currentActiveStep)) {
            alert('Please ensure all fields in the final step are filled correctly.');
           return;
       }

        // Check terms agreement specifically (assuming it's in the last step)
        const termsCheckbox = document.getElementById('termsAgreement');
        if (!termsCheckbox || !termsCheckbox.checked) {
            alert('You must agree to the Terms of Service and Privacy Policy.');
            termsCheckbox?.focus(); // Focus if element exists
            return;
        }

      console.log("Validation passed. Preparing FormData...");
      const formData = new FormData();

      // --- Collect Data From ALL Steps (Query ALL inputs within the form) ---

      // Helper function to get value or default
      const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

      // Step 1 Fields
      formData.append('ownerName', getVal('ownerName'));
      formData.append('ownerEmail', getVal('ownerEmail'));
      formData.append('ownerPhone', getVal('ownerPhone'));
      formData.append('ownerPassword', document.getElementById('ownerPassword')?.value || ''); // Don't trim password
      formData.append('ownerConfirmPassword', document.getElementById('ownerConfirmPassword')?.value || '');
      formData.append('ownerAddress', getVal('ownerAddress')); // Permanent address
      const idProofFile = document.getElementById('ownerIDProof')?.files[0];
      if (idProofFile) formData.append('ownerIDProof', idProofFile);
      else { alert("Owner ID Proof file is missing."); return; } // Required

      // Step 2 Fields
      formData.append('propertyType', getVal('propertyType'));
      formData.append('propertyName', getVal('propertyName'));
      formData.append('propertyAddress', getVal('propertyAddress')); // Property address
      formData.append('propertyCity', getVal('propertyCity'));
      formData.append('propertyLandmark', getVal('propertyLandmark'));
      formData.append('totalRooms', getVal('totalRooms'));
      formData.append('currentOccupancy', getVal('currentOccupancy') || '0');
      const propertyPhotoFiles = document.getElementById('propertyPhotos')?.files;
      if (propertyPhotoFiles && propertyPhotoFiles.length > 0) {
          for (let i = 0; i < propertyPhotoFiles.length; i++) {
              formData.append('propertyPhotos', propertyPhotoFiles[i]);
          }
      } else { alert("At least one Property Photo is required."); return; } // Required

      // Step 3 Fields
      formData.append('propertyDescription', getVal('propertyDescription'));
      document.querySelectorAll('input[name="amenities"]:checked').forEach(cb => formData.append('amenities', cb.value));
      formData.append('nearbyFacilities', getVal('nearbyFacilities'));
      formData.append('transportation', getVal('transportation'));
      formData.append('messFacility', getVal('messFacility'));
      formData.append('availableFrom', getVal('startingDate')); // ID is startingDate in HTML

      // Step 4 Fields
      formData.append('rentAmount', getVal('rentAmount'));
      formData.append('securityDeposit', getVal('securityDeposit'));
      formData.append('otherCharges', getVal('otherCharges'));
      formData.append('studentDiscount', getVal('studentDiscount'));
      document.querySelectorAll('input[name="tenantType"]:checked').forEach(cb => formData.append('preferredTenantType', cb.value));
      formData.append('houseRules', getVal('houseRules'));
      formData.append('agreementTerms', getVal('agreementTerms'));
      formData.append('termsAgreement', 'on'); // Indicate agreement

       // Log keys for debugging
       console.log('--- Sending Owner FormData Keys ---');
       for (let key of formData.keys()) { console.log(key); }
       console.log('--- End Owner FormData Keys ---');

       console.log("Attempting fetch to backend...");
      // ---- SUBMIT TO BACKEND ----
      // Optional: Add a loading indicator here
      try {
          const response = await fetch(`${BASE_API_URL}/auth/owner/register`, {
              method: 'POST',
              body: formData
          });

          const result = await response.json();

          if (response.ok) {
              console.log("Owner Registration successful:", result);
              localStorage.setItem('meraroom_token', result.token);
              localStorage.setItem('meraroom_user', JSON.stringify(result.user));
              alert('🎉 Owner registration successful! Your property is listed.');
              window.location.href = 'listings.html'; // Redirect or to owner dashboard
          } else {
              console.error("Owner Registration failed:", result);
               let errorMessage = 'Registration failed.';
               if (result.error) { errorMessage += `\nDetails: ${result.error}`; }
               else if (result.errors && Array.isArray(result.errors)) {
                   errorMessage += '\nPlease correct:\n' + result.errors.map(err => `- ${err.msg} (${err.param || 'field'})`).join('\n');
               }
               alert(`❌ ${errorMessage}`);
          }
      } catch (error) {
          console.error('Error during owner registration fetch:', error);
          alert('❌ Error connecting to the server. Please check network and try again.');
      } finally {
          // Optional: Hide loading indicator here
      }
  });


  // --- Step Validation ---
   function validateOwnerStep(step) {
        let isValid = true;
        const inputs = step.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
        // Reset borders first
        step.querySelectorAll('.form-group input, .form-group select, .form-group textarea, .checkbox-group label').forEach(el => {
            el.style.borderColor = ''; // Reset input border
            if (el.tagName === 'LABEL') el.style.color = ''; // Reset label color
        });


        inputs.forEach(input => {
            const isRequired = input.hasAttribute('required');
            if (isRequired) {
                let inputValid = true;
                 if (input.type === 'file') {
                     if (input.files.length === 0) { inputValid = false; }
                 } else if (!input.value.trim()) {
                     inputValid = false;
                 }
                 // Specific format checks (add more as needed)
                 if (inputValid && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { inputValid = false;}
                 if (inputValid && input.type === 'tel' && !/^[6-9]\d{9}$/.test(input.value)) { inputValid = false; }
                 if (inputValid && (input.id === 'ownerPassword' || input.id === 'ownerConfirmPassword') && input.value.length < 6) { inputValid = false; }
                 if (inputValid && input.id === 'ownerConfirmPassword' && input.value !== document.getElementById('ownerPassword')?.value) { inputValid = false;}
                 if (inputValid && (input.id === 'totalRooms' || input.id === 'rentAmount' || input.id === 'securityDeposit') && parseFloat(input.value) < (input.id === 'totalRooms' ? 1 : 0) ) { inputValid = false; }
                 if (inputValid && input.id === 'startingDate' && !input.value) { inputValid = false;} // Basic date check

                 if (!inputValid) {
                     input.style.borderColor = 'var(--danger-color)';
                     isValid = false;
                 }
             }
        });

          // Check required checkboxes
         const requiredCheckboxes = step.querySelectorAll('input[type="checkbox"][required]');
         requiredCheckboxes.forEach(cb => {
             if (!cb.checked) {
                 isValid = false;
                 const label = cb.closest('label') || cb;
                 label.style.color = 'var(--danger-color)'; // Highlight label
             }
         });
        return isValid;
   }

}); // End DOMContentLoaded