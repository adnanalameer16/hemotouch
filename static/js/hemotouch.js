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

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const contentSections = document.querySelectorAll('.content-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(sectionId).classList.add('active');

            if (sectionId === 'view-donors') {
                view_donors_table(); // Load all donors when switching to this tab
            }
        });
    });
}

function setupFingerprintUpload(frameId, inputId, imageId, textId, resultId, callback) {
    const uploadFrame = document.getElementById(frameId);
    const imageInput = document.getElementById(inputId);
    const uploadedImage = document.getElementById(imageId);
    const uploadText = document.getElementById(textId);

    if (!uploadFrame) return;

    uploadFrame.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage.src = e.target.result;
                uploadedImage.style.display = "block";
                if (uploadText) uploadText.style.display = "none";
            };
            reader.readAsDataURL(file);
            uploadImageToFlask(file, resultId, callback);
        }
    });
}

function uploadImageToFlask(file, resultId, callback) {
    const formData = new FormData();
    formData.append("file", file);

    fetch(`${predictApiUrl}/predict`, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const resultElement = document.querySelector(resultId);
        if (resultElement) {
            resultElement.textContent = data.prediction || 'N/A';
        }
        if (callback) {
            callback(data.prediction);
        }
    })
    .catch(error => console.error("Error:", error));
}

async function validateAndSubmitDonor() {
    const name = document.getElementById("name").value.trim();
    const age = document.getElementById("age").value.trim();
    const bloodgp = document.getElementById("bloodgp-dropdown-don").value;
    const diseases = document.getElementById("diseases").value.trim();
    const phno = document.getElementById("phno").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!name || !age || !bloodgp || !diseases || !phno || !address) {
        alert("All fields are required.");
        return;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
        alert("Please enter a valid name (letters and spaces only).");
        return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
        alert("Please enter a valid age between 18 and 65.");
        return;
    }
    if (!/^\d{10}$/.test(phno)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    const donorData = { name, age, bloodgp, diseases, phno, address };

    try {
        const response = await fetch(`${apiUrl}/all/donorslist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(donorData),
        });

        if (response.ok) {
            alert("Successfully Registered");
            document.getElementById("donor-form").reset();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error || 'An unknown error occurred.'}`);
        }
    } catch (error) {
        console.error("Error during submission:", error);
        alert("A network error occurred. Please try again.");
    }
}

function view_donors_table(donors) {
    const donor_table_body = document.getElementById('donor-table');
    donor_table_body.innerHTML = "";

    const renderDonors = (donorList) => {
        if (donorList && donorList.length > 0) {
            donorList.forEach(donor => {
                const row = `<tr>
                    <td>${donor.name}</td>
                    <td>${donor.age}</td>
                    <td>${donor.bloodgp}</td>
                    <td>${donor.diseases}</td>
                    <td>${donor.phno}</td>
                    <td>${donor.address}</td>
                </tr>`;
                donor_table_body.innerHTML += row;
            });
        } else {
            donor_table_body.innerHTML = '<tr><td colspan="6">No donors found.</td></tr>';
        }
    };

    if (donors) {
        renderDonors(donors);
    } else {
        fetch(`${apiUrl}/donorslist`)
            .then(response => response.json())
            .then(data => renderDonors(data))
            .catch(error => {
                console.error("Error fetching data:", error);
                donor_table_body.innerHTML = '<tr><td colspan="6">Error loading donors.</td></tr>';
            });
    }
}

async function fetchCompatibleBloodGroups(bloodGroup) {
    if (!bloodGroup) return;

    try {
        const response = await fetch(`${apiUrl}/compatible_bgp/${bloodGroup}`);
        const data = await response.json();

        const tableBody = document.getElementById("compatible-blood-table");
        tableBody.innerHTML = "";

        if (data.length > 0) {
            data.forEach(group => {
                const row = `<tr onclick="fetchDonorsByBloodGroup('${group}')" style="cursor:pointer;"><td>${group}</td></tr>`;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = "<tr><td>No compatible groups found</td></tr>";
        }
    } catch (error) {
        console.error("Error fetching compatible blood groups:", error);
    }
}

function fetchDonorsByBloodGroup(bloodGroup) {
    fetch(`${apiUrl}/donors/all?bloodgp=${encodeURIComponent(bloodGroup)}`)
        .then(response => response.json())
        .then(data => {
            document.querySelector('.nav-button[data-section="view-donors"]').click();
            view_donors_table(data);
        })
        .catch(error => console.error("Error fetching donors:", error));
}

async function loadBloodInventory() {
    try {
        const response = await fetch(`${apiUrl}/api/blood_quantity`);
        const data = await response.json();

        const tableBody = document.getElementById("bloodgp-quantity-table");
        tableBody.innerHTML = "";

        if (data.length > 0) {
            data.forEach((item) => {
                const row = `<tr>
                    <td>${item.bloodgp}</td>
                    <td>${item.quantity} Unit</td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="2">Inventory data not available.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching blood inventory:", error);
        const tableBody = document.getElementById("bloodgp-quantity-table");
        tableBody.innerHTML = '<tr><td colspan="2">Error loading inventory.</td></tr>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchConfig().then(() => {
        setupNavigation();
        
        setupFingerprintUpload("uploadFrame", "imageInput", "uploadedImage", "uploadText", "#disphere", fetchCompatibleBloodGroups);
        setupFingerprintUpload("uploadFrame2", "imageInput2", "uploadedImage2", "uploadText2", "#disphere2");
        
        loadBloodInventory();
    });
});
