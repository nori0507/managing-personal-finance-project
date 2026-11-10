async function login(event) {

    // prevent the form from refreshing the page
    event.preventDefault();

    // get user input
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {

        // send login request to backend
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email:email,
                password:password
            })
        });

        const data = await response.json();

        // check the login status
        if (response.ok && data.success) {
            console.log("Success");
            window.location.href = "index.html"; //navigate to the main page when the log in was successful
        } else {
            document.getElementById("message").innerText ="Invalid email or password"; //show an error message when the login failed
        }

    } catch (error) {
        document.getElementById("message").innerText ="Unable to connect to the server"; //catch the surver error and displaying it
    }
}

//for test
module.exports = { login };