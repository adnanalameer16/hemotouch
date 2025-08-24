let apiUrl = '';
let predictApiUrl = '';

async function fetchConfig() {
    try {
        const response = await fetch('/config');
        const config = await response.json();
        apiUrl = config.API_URL;
        predictApiUrl = config.PREDICT_API_URL;
    } catch (error) {
        console.error('Error fetching config:', error);
    }
}

function showsection(section){
    document.querySelector('.request').classList.remove('active');
    document.querySelector('.donate').classList.remove('active');
    document.querySelector('.view-donors').classList.remove('active');
    
    document.querySelector('.'+section).classList.add('active');
}

function show_button_bold(selectedbutton){
    // Remove bold class from all sidebar buttons
    const buttons = document.querySelectorAll('.header-button');
    buttons.forEach(button => {
        button.classList.remove('bold');
    });

    // Add bold class to the selected button
    selectedbutton.classList.add('bold');
}

function setupFingerprintUpload(frameId, inputId, imageId, textId, resultId, callback) {
    const uploadFrame = document.getElementById(frameId);
    const imageInput = document.getElementById(inputId);
    const uploadedImage = document.getElementById(imageId);
    const uploadText = document.getElementById(textId);

    if (!uploadFrame) return; // Exit if the element doesn't exist on the page

    // Open file picker when clicking on the frame
    uploadFrame.addEventListener("click", function () {
        imageInput.click();
    });

    // Handle file selection
    imageInput.addEventListener("change", function () {
        const file = imageInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                uploadedImage.src = e.target.result;
                uploadedImage.style.display = "block";
                if (uploadText) uploadText.style.display = "none"; // Hide text when image is uploaded
            };
            reader.readAsDataURL(file);

            // Send the image to Flask for prediction
            uploadImageToFlask(file);
        }
    });

    // Function to send image to Flask
    function uploadImageToFlask(file) {
        let formData = new FormData();
        formData.append("file", file);

        fetch(`${predictApiUrl}/predict`, {  // Flask endpoint
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Display the predicted blood group
            const resultElement = document.querySelector(resultId);
            if (resultElement) {
                resultElement.textContent = data.prediction;
            }
            
            // If a callback function is provided, call it with the prediction
            if (callback) {
                callback(data.prediction);
            }
        })
        .catch(error => console.error("Error:", error));
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchConfig().then(() => {
        // Setup for the 'Request' section fingerprint scanner
        setupFingerprintUpload("uploadFrame", "imageInput", "uploadedImage", "uploadText", "#disphere", fetchCompatibleBloodGroups);

        // Setup for the 'Donate' section fingerprint scanner
        setupFingerprintUpload("uploadFrame2", "imageInput2", "uploadedImage2", "uploadText2", "#disphere2");
        
        // Load initial data
        loadBloodInventory();
    });
});

async function validateAndSubmitDonor() {
const name = document.getElementById("name").value.trim();
const age = document.getElementById("age").value.trim();
const bloodgp = document.getElementById("bloodgp-dropdown-don").value;
const diseases = document.getElementById("diseases").value.trim();
const phno = document.getElementById("phno").value.trim();
const address = document.getElementById("address").value.trim();

// 1. Check for empty fields
if (!name || !age || !bloodgp || !diseases || !phno || !address) {
alert("All fields are required.");
return;
}

// 2. Format validation
const nameRegex = /^[A-Za-z\s]+$/;
if (!nameRegex.test(name)) {
alert("Please enter a valid name (letters and spaces only).");
return;
}

const ageNum = parseInt(age, 10);
if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
alert("Please enter a valid age between 18 and 65.");
return;
}

const phnoRegex = /^\d{10}$/;
if (!phnoRegex.test(phno)) {
alert("Please enter a valid 10-digit phone number.");
return;
}

// If all validation passes, proceed with submission
const donorData = { name, age, bloodgp, diseases, phno, address };
const bloodData = { bloodgp };

try {
const responses = await Promise.all([
    fetch(`${apiUrl}/all/donorslist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donorData),
    }),
]);

// Check if any of the responses were not successful
const allSuccessful = responses.every(res => res.ok);

if (allSuccessful) {
    // Clear input fields
    alert("Successfully Registered");
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("bloodgp-dropdown-don").value = "";
    document.getElementById("diseases").value = "";
    document.getElementById("phno").value = "";
    document.getElementById("address").value = "";
    
    // Show success message
    document.querySelector('.donor-details').classList.remove('activate');
    document.querySelector('.register-success').classList.add('activate');

} else {
    // Find the first failed response to show an error
    const failedResponse = await responses.find(res => !res.ok).json();
    alert(`Error: ${failedResponse.error || 'An unknown error occurred.'}`);
}

} catch (error) {
console.error("Error during submission:", error);
alert("A network error occurred. Please try again.");
}
}

//fetch view-donors table
function view_donors_table(){
    const donor_table=document.getElementById('donor-table');
    donor_table.innerHTML = "";
fetch(`${apiUrl}/donorslist`)
.then(response => response.json())
.then(data => {
    data.forEach(donor => {
        const row = `<tr>
            <td>${donor.name}</td>
            <td>${donor.age}</td>
            <td>${donor.bloodgp}</td>
            <td>${donor.diseases}</td>
            <td>${donor.phno}</td>
            <td>${donor.address}</td>
        </tr>`;
        donor_table.innerHTML += row;
    });
})
.catch(error => console.error("Error fetching data:", error));
}

//fetch compatible bloodgp-request
async function fetchCompatibleBloodGroups(bloodGroup) {
    const selectedBloodGroup = bloodGroup;
    if (!selectedBloodGroup) return;

    try {
        const response = await fetch(`${apiUrl}/compatible_bgp/${selectedBloodGroup}`);
        const data = await response.json();

        const tableBody = document.getElementById("compatible-blood-table");
        tableBody.innerHTML = "";

        if (data.length > 0) {
            data.forEach(bloodGroup => {
                const row = `<tr onclick="fetchDonorsByBloodGroup('${bloodGroup}')" style="cursor:pointer;"><td>${bloodGroup}</td></tr>`;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = "<tr><td>No data found</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function fetchDonorsByBloodGroup(bloodGroup) {
    // Fetch donors from the server
    fetch(`${apiUrl}/donors/all?bloodgp=${encodeURIComponent(bloodGroup)}`)
        .then(response => response.json())
        .then(data => {
            const donorList = document.getElementById('donor-filtered-table');
            donorList.innerHTML = ""; // Clear previous results

            data.forEach(donor => {
                const row = `<tr>
                    <td>${donor.name}</td>
                    <td>${donor.age}</td>
                    <td>${donor.bloodgp}</td>
                    <td>${donor.diseases}</td>
                    <td>${donor.phno}</td>
                    <td>${donor.address}</td>
                    <td>${donor.date_of_donation}</td>
                    </tr>`;
                    donorList.innerHTML += row;
            });
            showsection("donor-filtered");
        })
        .catch(error => console.error("Error fetching donors:", error));
}


//blood quantity in hospital inventory-request
async function loadBloodInventory() {
    try {
        const response = await fetch(`${apiUrl}/api/blood_quantity`);
        const data = await response.json();

        const tableBody = document.getElementById("bloodgp-quantity-table");
        tableBody.innerHTML = ""; // Clear existing rows

        data.forEach((item) => {
            const row = `<tr>
                    <td>${item.bloodgp}</td>
                    <td>${item.quantity} Unit</td>
                </tr>`;
                tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching blood inventory:", error);
    }
}
