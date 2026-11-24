const LOGOUT_API_BASE_URL = ["localhost", "127.0.0.1"]
    .includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "https://managing-personal-finance-project-web.onrender.com";

// send a logout request to the backend
async function logoutUser() {
    try {
        const response = await fetch(`${LOGOUT_API_BASE_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to log out.");
        }

        return data;
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}

// log out when the logout button is clicked
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");
    const logoutMessage = document.getElementById("logout-message");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await logoutUser();

                // redirect the user to the login page
                window.location.href = "./login.html";

            } catch (error) {
                logoutMessage.textContent = error.message;
                logoutMessage.style.color = "red";
            }
        });
    }
});

// export functions for unit test
if (typeof module !== "undefined") {
    module.exports = {
        logoutUser
    };
}