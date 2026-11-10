// test file for the sign up function
const { signup } = require("../signup"); //import signup function

// fake message element
const messageElement = { innerText: "" };

// tests for signup function
describe("Signup function", () =>{
    // successful account creation
    test("sign up should succeed", async() => {
        //fake user input
        document.getElementById = jest.fn((id) => {
        if(id ==="email-signup") return {value:"test@example.com"};
        if(id ==="password-signup") return {value: "123456"};
        if(id === "message") return messageElement;
        });

        // fake fetch return successfl responce
        global.fetch = jest.fn().mockResolvedValue({
            ok: true, //HTTP request success
            json: async () => ({ success: true }) // json responce success
        });

        // fake preventDefault
        const event = { preventDefault: jest.fn() };

        // execute signup functon
        await signup(event);
        expect(messageElement.innerText).toBe("Account created successfully!");
    });

    // failing account creation (mostly bc of theexisting email)
    test("signup should display and error", async () => {
        //fake user input
        document.getElementById = jest.fn((id) => {
        if(id ==="email-signup") return {value:"test@example.com"};
        if(id ==="password-signup") return {value: "123456"};
        if(id === "message") return messageElement;
        });

        // fake fetch return successfl responce
        global.fetch = jest.fn().mockResolvedValue({
            ok: false, //HTTP request fail
            json: async () => ({ success: false }) // json responce fail
        });

        const event = { preventDefault: jest.fn()};

        // execute signup function
        await signup(event);
        expect(messageElement.innerText).toBe("Signup failed. The email already exists.");
    });
});

