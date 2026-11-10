async function signup(event) {
    // stop the default browser form submission immediately
    event.preventDefault();

    console.log("Signup function is running!");

    const email = document.getElementById("email-signup").value;
    const password = document.getElementById("password-signup").value;
    const messageElement = document.getElementById("message");

    try {
        const response = await fetch("http://localhost:3000/signup", {
            method: "POST",
            eaders: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
            });

        const data = await response.json();

        if (response.ok && data.success) {
            messageElement.innerText = "Account created successfully!";

            // wait 1.5 seconds so the user can read the success message
            await new Promise(resolve => setTimeout(resolve, 1500));

            // redirect to the login page
            window.location.href = "login.html";

        } else {
            messageElement.innerText = "Signup failed. The email already exists.";
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
module.exports = { signup };