// store functions that are related to personal info
const API_BASE_URL =["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? "http://localhost:3000"
        : "https://managing-personal-finance-project-web.onrender.com";

// update personal information
async function updatePersonalInfo(personalInfoData) {
    try {
        const response = await fetch(`${API_BASE_URL}/personal-info`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(personalInfoData), //converting to json
        });

        const data = await response.json();

        // failed to update
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update personal information');
        }

        return data; //return data to the one that called the function
    } catch (error) {
        console.error('Error updating personal information:', error);
        throw error;
    }
}

// get the current user's personal information
async function getPersonalInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/personal-info`, {
            method: 'GET',
            credentials: 'include',
            cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to retrieve personal information');
        }

        return data.personalInfo;
    } catch (error) {
        console.error('Error retrieving personal information:', error);
        throw error;
    }
}

// display personal information in the form
function displayPersonalInfo(personalInfo) {
    document.getElementById("current-f-name").textContent = personalInfo.fName || "";
    document.getElementById("current-l-name").textContent = personalInfo.lName || "";
    document.getElementById("current-phone").textContent = personalInfo.phone || "";
    document.getElementById("current-email").textContent = personalInfo.email || "";
    document.getElementById("current-address").textContent = personalInfo.address || "";
    document.getElementById("current-country").textContent = personalInfo.country || "";
}

// display information when the page loads
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const personalInfo = await getPersonalInfo();
        displayPersonalInfo(personalInfo);
    } catch (error) {
        document.getElementById("message").innerText =
            "Unable to load personal information.";
    }
});

// update the record when the submission button is clicked
// then display it as the current personal info
const personalInfoForm = document.getElementById("personal-info-form");
if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        // collect the user's new information
        const personalInfoData = {
            fName: document.getElementById("f-name").value,
            lName: document.getElementById("l-name").value,
            phone: document.getElementById("phone").value,
            email:document.getElementById("email").value,
            address: document.getElementById("address").value,
            country: document.getElementById("country").value
        };

        try {
            //update the info
            const result = await updatePersonalInfo(personalInfoData);
            // get the current info
            const updatedInfo = await getPersonalInfo();
            // display the info
            displayPersonalInfo(updatedInfo);
            document.getElementById("message").innerText = result.message;
        } catch (error) {
            document.getElementById("message").innerText ="Failed to update personal information.";
        }
    })
};

if (typeof module !== "undefined") {
    module.exports = { updatePersonalInfo, getPersonalInfo, displayPersonalInfo};
}