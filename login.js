async function login(event) {
    // prevent the form from refreshing the page
    event.preventDefault();

    // get user input
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        // send login request to backend
        const response = await fetch("http://127.0.0.1:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        // check the login status
        console.log("Login HTTP status:", response.status);
        console.log("Login response:", data);

        if (response.ok && data.success) {
            console.log("Login successful!");
            window.location.href = "index.html";
            document.getElementById("message").innerText ="login success";
        } else {
            document.getElementById("message").innerText =
                data.message || "Invalid email or password";
        }

    } catch (error) {
        document.getElementById("message").innerText ="Unable to connect to the server"; //catch the surver error and displaying it
    }
}

//for test
if (typeof module !== "undefined") {
    module.exports = { login };
}