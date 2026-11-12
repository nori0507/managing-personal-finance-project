// test file for peronal info functions
// import related functions
const { updatePersonalInfo, getPersonalInfo, displayPersonalInfo } = require("../personal-info"); 

// fake personal information
const personalInfoData = {
    fName: "Adam",
    lName: "Kosowsky",
    email: "adam@example.com",
    phone: "123-456-7890",
    address: "12345 Main Street",
    country: "United States"
};

// tests for updating personal information
describe("updatePersonalInfo function", () => {
    // successful update
    test("personal information update should succeed", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                message: "Personal information update succeeded!"
            })
        });

        // execute update function
        const result = await updatePersonalInfo(personalInfoData);

        // check the result
        expect(result.success).toBe(true);
        expect(result.message).toBe("Personal information update succeeded!");

        // check whether the correct data was sent
        expect(global.fetch).toHaveBeenCalledWith(
            "http://127.0.0.1:3000/personal-info",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(personalInfoData)
            }
        );
    });

    // failed update
    test("personal information update should fail", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
                success: false,
                message: "Unable to update personal information."
            })
        });

        // check whether the function throws an error
        await expect(updatePersonalInfo(personalInfoData)).rejects.toThrow("Unable to update personal information.");
    });
});

// tests for getting personal information
describe("getPersonalInfo function", () => {
    // successful return
    test("getting personal information should succeed", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                personalInfo: personalInfoData //fake info value
            })
        });

        // execute get function
        const result = await getPersonalInfo();

        // check the result
        expect(result).toEqual(personalInfoData);

        // check whether fetch was called correctly
        expect(global.fetch).toHaveBeenCalledWith(
            "http://127.0.0.1:3000/personal-info",
            {
                method: "GET",
                credentials: "include"
            }
        );
    });

    // failed getting personal info
    test("getting personal information should fail", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
                success: false,
                message: "Unable to return any personal information."
            })
        });

        // check whether the function throws an error
        await expect(getPersonalInfo()).rejects.toThrow("Unable to return any personal information.");
    });
});

// tests for displaying personal information
describe("displayPersonalInfo function", () => {
    // info successfully displayed
    test("personal information should be displayed correctly", () => {
        // fake HTML elements
        const elements = {
            "current-f-name": { textContent: "" },
            "current-l-name": { textContent: "" },
            "current-email": { textContent: "" },
            "current-phone": { textContent: "" },
            "current-address": { textContent: "" },
            "current-country": { textContent: "" }
        };

        // fake document.getElementById, that will be usedn within a function
        document.getElementById = jest.fn((id) => elements[id]);

        // execute display function
        displayPersonalInfo(personalInfoData);

        // check whether the values were displayed correctly
        expect(elements["current-f-name"].textContent).toBe("Adam");
        expect(elements["current-l-name"].textContent).toBe("Kosowsky");
        expect(elements["current-email"].textContent).toBe("adam@example.com");
        expect(elements["current-phone"].textContent).toBe("123-456-7890");
        expect(elements["current-address"].textContent).toBe("12345 Main Street");
        expect(elements["current-country"].textContent).toBe("United States");
    });
});
