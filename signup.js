async function signup(event) {
    // stop the default browser form submission immediately
    event.preventDefault();

    console.log("Signup function is running!");

    const email = document.getElementById("email-signup").value;
    const password = document.getElementById("password-signup").value;
    const messageElement = document.getElementById("message");

    try {
        const response = await fetch("http://127.0.0.1:3000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
            });

        const data = await response.json();
        console.log("HTTP status:", response.status);
        console.log("Signup response:", data);

        if (response.ok && data.success) {
            messageElement.innerText = "Account created successfully!";    
            // redirect to the login page
            window.location.href = "./login.html";
        } else {
            messageElement.innerText = "Signup failed.";
        }
    } catch (error) {
        console.error("Signup error:", error);
        messageElement.innerText = "Unable to connect to the server.";
    }

};

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    if (!signupForm) return;
    signupForm.addEventListener("submit", signup);
})
//for test
if (typeof module !== "undefined") {
    module.exports = { signup };
}