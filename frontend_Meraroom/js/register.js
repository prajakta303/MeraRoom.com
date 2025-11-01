document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('seekerRegistrationForm');
    const nextStepButtons = document.querySelectorAll('.next-step');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    const formSteps = document.querySelectorAll('.form-step');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');
    const collegeGroup = document.getElementById('collegeGroup');
    const courseGroup = document.getElementById('courseGroup');
    const workGroup = document.getElementById('workGroup');
    const designationGroup = document.getElementById('designationGroup');
    const scholarshipGroup = document.getElementById('scholarshipGroup');
    const meterFill = document.getElementById('meter-fill');
    const strengthValue = document.getElementById('strength-value');

    const BASE_API_URL = 'http://localhost:5000/api/v1'; // Adjust if your backend URL is different

    // --- Multi-step form navigation logic ---
    nextStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const nextStepId = this.getAttribute('data-next');
            const nextStep = document.getElementById(nextStepId);

            if (validateStep(currentStep)) {
                currentStep.classList.remove('active');
                nextStep.classList.add('active');
                registrationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                updateProfileMeter(); // Update meter on step change
            } else {
                alert('Please fill in all required fields correctly in this step.');
            }
        });
    });

    prevStepButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const prevStepId = this.getAttribute('data-prev');
            const prevStep = document.getElementById(prevStepId);

            currentStep.classList.remove('active');
            prevStep.classList.add('active');
            registrationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
             updateProfileMeter(); // Update meter on step change
        });
    });

     // Show/hide fields based on user type
     userTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const isStudent = this.value === 'student';
            collegeGroup.style.display = isStudent ? 'block' : 'none';
            courseGroup.style.display = isStudent ? 'block' : 'none';
            scholarshipGroup.style.display = isStudent ? 'block' : 'none';
            workGroup.style.display = !isStudent ? 'block' : 'none';
            designationGroup.style.display = !isStudent ? 'block' : 'none';

            // Update required attribute dynamically (important for validation)
            document.getElementById('college').required = isStudent;
            document.getElementById('course').required = isStudent;
            document.getElementById('company').required = !isStudent;
            document.getElementById('designation').required = !isStudent;

             updateProfileMeter(); // Recalculate when requirements change
        });
     });
     // Initial state based on default checked
     if(document.querySelector('input[name="userType"]:checked')) {
        document.querySelector('input[name="userType"]:checked').dispatchEvent(new Event('change'));
     }


    // --- Form Submission Logic ---
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const currentStep = document.querySelector('.form-step.active');

        // Final validation check on the current (last) step
        if (!validateStep(currentStep)) {
            alert('Please ensure all fields in the final step are filled correctly.');
            return;
        }

        // Check Terms Agreement specifically if it's in the last step
        const termsCheckbox = currentStep.querySelector('#termsAgreement'); // Example ID if added
        if (termsCheckbox && !termsCheckbox.checked) {
            alert('You must agree to the Terms and Conditions.');
            return;
        }


        const formData = new FormData();

        // --- Collect data from ALL steps ---
        // Step 1: Basic Info
        formData.append('fullName', document.getElementById('fullName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('confirmPassword', document.getElementById('confirmPassword').value);
        formData.append('hometown', document.getElementById('hometown').value);

        // Step 2: Education/Work
        const userType = document.querySelector('input[name="userType"]:checked').value;
        formData.append('userType', userType);
        if (userType === 'student') {
            formData.append('college', document.getElementById('college').value);
            formData.append('course', document.getElementById('course').value);
            const scholarshipFile = document.getElementById('scholarship').files[0];
            if (scholarshipFile) {
                formData.append('scholarshipCertificate', scholarshipFile); // Backend expects this field name
            }
        } else {
            formData.append('company', document.getElementById('company').value);
            formData.append('designation', document.getElementById('designation').value);
        }

        // Step 3: Family Contact
        formData.append('fatherName', document.getElementById('fatherName').value);
        formData.append('fatherContact', document.getElementById('fatherContact').value);
        formData.append('motherName', document.getElementById('motherName').value || ''); // Send empty string if not filled
        formData.append('motherContact', document.getElementById('motherContact').value || '');
        formData.append('emergencyContact', document.getElementById('emergencyContact').value || '');

        // Step 4: Preferences
        formData.append('accommodationType', document.getElementById('accommodationType').value);
        formData.append('budget', document.getElementById('budget').value);
        formData.append('preferredGender', document.querySelector('input[name="preferredGender"]:checked').value);
        formData.append('hobbies', document.getElementById('hobbies').value || '');
        formData.append('habits', document.getElementById('habits').value || '');
        formData.append('restrictions', document.getElementById('restrictions').value || '');
        formData.append('specialReq', document.getElementById('specialReq').value || '');

        console.log("Submitting Seeker Data..."); // Debugging

        try {
            // Send data to backend API
            const response = await fetch(`${BASE_API_URL}/auth/seeker/register`, {
                method: 'POST',
                body: formData // Let browser set Content-Type for FormData
            });

            const result = await response.json();

            if (response.ok) { // Check for 2xx status codes
                console.log("Seeker Registration Successful:", result);
                // Store token and user data in localStorage
                localStorage.setItem('meraroom_token', result.token);
                localStorage.setItem('meraroom_user', JSON.stringify(result.user));

                alert('Registration successful! Welcome to MeraRoom.com.');
                window.location.href = 'listings.html'; // Redirect to listings page

            } else {
                // Display specific error messages from backend
                console.error("Seeker Registration Failed:", result);
                let errorMessage = 'Registration failed.';
                if (result.error) {
                    errorMessage += `\nDetails: ${result.error}`;
                } else if (result.errors && Array.isArray(result.errors)) {
                    errorMessage += '\nDetails:\n' + result.errors.map(err => `- ${err.msg} (Field: ${err.param})`).join('\n');
                }
                alert(`❌ ${errorMessage}`);
            }

        } catch (error) {
            console.error('Error during registration fetch:', error);
            alert('An error occurred during registration. Please check your network connection and try again.');
        }
    });


    // --- Validation and Utility Functions ---
    function validateStep(step) {
        let isValid = true;
        // Validate only visible and required inputs within the current step
        const inputs = step.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea');

        inputs.forEach(input => {
             // Check if input is effectively visible and required
            const isVisible = input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0;
             const isRequired = input.hasAttribute('required');

            if (isVisible && isRequired) {
                let inputValid = true;
                if (!input.value.trim()) {
                     inputValid = false;
                 }

                 // Specific validations
                 if (inputValid && input.type === 'email' && !validateEmail(input.value)) {
                     inputValid = false;
                 }
                 if (inputValid && input.type === 'tel' && !validatePhone(input.value)) {
                     inputValid = false;
                 }
                  if (inputValid && input.id === 'confirmPassword' && input.value !== document.getElementById('password').value) {
                      inputValid = false;
                      // Optionally show specific message near the field
                      console.warn("Password mismatch during validation");
                  }
                  if (inputValid && input.type === 'file' && input.required && input.files.length === 0) {
                       inputValid = false; // Required file validation
                  }


                if (!inputValid) {
                     input.style.borderColor = 'var(--danger-color)';
                     isValid = false;
                 } else {
                     input.style.borderColor = ''; // Reset border color if valid
                 }
            } else {
                 input.style.borderColor = ''; // Reset border if not visible/required
            }

        });

         // Add validation for required radio/checkbox groups if needed
          const requiredRadios = step.querySelectorAll('input[type="radio"][required]');
          const radioGroups = [...new Set([...requiredRadios].map(r => r.name))]; // Get unique group names
          radioGroups.forEach(groupName => {
             if(isVisibleRadioGroup(step, groupName)) { // Check if the group itself is visible
                 const radiosInGroup = step.querySelectorAll(`input[name="${groupName}"]`);
                 if (![...radiosInGroup].some(r => r.checked)) {
                     isValid = false;
                      // Optionally highlight the group label or container
                      console.warn(`Radio group "${groupName}" requires selection.`);
                 }
             }
         });

        return isValid;
    }
     // Helper to check visibility of radio groups (can be complex depending on layout)
     function isVisibleRadioGroup(step, groupName) {
         const firstRadio = step.querySelector(`input[name="${groupName}"]`);
          if (!firstRadio) return false;
          const container = firstRadio.closest('.radio-group') || firstRadio.closest('.form-group');
          return container && (container.offsetWidth > 0 || container.offsetHeight > 0 || container.getClientRects().length > 0);
     }


    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePhone(phone) {
        // Basic Indian phone number check (10 digits, starts with 6-9)
        const re = /^[6-9]\d{9}$/;
        return re.test(String(phone));
    }

     // --- Profile Strength Meter ---
     function updateProfileMeter() {
         let filledCount = 0;
         let totalRequiredVisible = 0;
         const allFields = registrationForm.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), select, textarea');

         allFields.forEach(input => {
             const step = input.closest('.form-step');
             const isVisible = (step && step.classList.contains('active')) && (input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0);
              const isRequired = input.hasAttribute('required');

              if (isVisible && isRequired) {
                   totalRequiredVisible++;
                 if (input.value.trim() !== '' || (input.type === 'file' && input.files.length > 0)) {
                     filledCount++;
                 }
             }
         });
          // Add logic for required radio groups
         const activeStep = registrationForm.querySelector('.form-step.active');
         if (activeStep) {
              const requiredRadios = activeStep.querySelectorAll('input[type="radio"][required]');
              const radioGroups = [...new Set([...requiredRadios].map(r => r.name))];
              radioGroups.forEach(groupName => {
                  if (isVisibleRadioGroup(activeStep, groupName)) {
                       totalRequiredVisible++; // Count the group as one required item
                       const radiosInGroup = activeStep.querySelectorAll(`input[name="${groupName}"]`);
                       if ([...radiosInGroup].some(r => r.checked)) {
                           filledCount++;
                       }
                   }
              });
         }


         const percent = totalRequiredVisible > 0 ? Math.round((filledCount / totalRequiredVisible) * 100) : 0;

         meterFill.style.width = `${percent}%`;
         strengthValue.textContent = `${percent}%`;
     }

      // Update meter on any input change
      registrationForm.addEventListener('input', updateProfileMeter);
      // Initial meter update
      updateProfileMeter();

});