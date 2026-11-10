const { login } = require("../login"); //import login function
const messageElement = {innerText: ""};
//
describe("Login function", () => {

    // expect the return for successful case. 
    // see how function works with everything returning the right value and condition for the successful login
    test("login should be successful", async () => {
        // fake value return
        document.getElementById = jest.fn((id) => {
            if (id === "login-email") return { value: "test1@example.com" }; 
            if (id === "login-password") return { value: "123456" };
            if (id === "message") return messageElement;
        });

        window.location.href = ""; // clear exsiting location
   
        // fake fetch retunr success responce
        global.fetch = jest.fn().mockResolvedValue({
            ok: true, //HTTP request success
            json: async () => ({ success: true }) // json responce success
        });

        // fake preventDefault
        const event = {preventDefault: jest.fn()};

        // execute the function
        await login(event);
        expect(window.location.href).toBe("index.html"); // should be redirected to the index.html
        //however, this will never happen because of the server limitation
        // so i added console.log("Success"); to login.js when the ok and json responce is right (window.location.href = "index.html" happens under the same if statement) 
        // we can see this "Success" as a part of return on the command when we run the test, so we can tell that function is working in the way that should work when it has successful conditions
    });

    // expect the return forthe failed case
    // suppose something is wrong(assign failed conditions), and see if function shows the error as a result
    test("login should display an error for incorrect credentials", async () => {

        // fake value return
        document.getElementById = jest.fn((id) => {
            if (id === "login-email") return { value: "test1@example.com" };
            if (id === "login-password") return { value: "wrongpassword" };
            if (id === "message") return messageElement;
        });

        // fake fetch return failed responce
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ success: false })
        });

        // fake preventDefault
        const event = { preventDefault: jest.fn() };

        // execute the function
        await login(event);
        expect(document.getElementById("message").innerText).toBe("Invalid email or password"); // expect to show the error message
    });
});