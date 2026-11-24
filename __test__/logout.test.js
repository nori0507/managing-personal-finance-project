const { logoutUser } = require("../logout.js");

// test for logout function
describe("logoutUser", () => {

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    // success case
    test("should successfully log out the user", async () => {
        const responseData = {
            success: true,
            message: "Logged out successfully!"
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => responseData
        });

        const result = await logoutUser();

        expect(result).toEqual(responseData);

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3000/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );
    });

    // failed case
    test("should throw an error when logout fails", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({
                success: false,
                message: "Failed to log out."
            })
        });

        await expect(logoutUser()).rejects.toThrow("Failed to log out.");
    });
});