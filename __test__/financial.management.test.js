// test file for the financial management function
const { updateCategories, saveTransaction, getBalances, displayBalances } = require("../financial-management-function.js"); 

// test for updateCategories function
describe("updateCategories function", () => {
    // success retrun : income selected
    test("shoulw display income categories when income is selected for the type", () => {
        //create fake select element
        const categorySelect = document.createElement("select");

        // execute the function
        updateCategories("income", categorySelect);

        // get the value of all options
        const optionValues = Array.from(categorySelect.options).map(option => option.value);

        expect(optionValues).toEqual([
            "", //default value "Select Category"
            "salary",
            "side gig",
            "investment",
            "others"
        ]);
    })

    // success retun : expense selected (very similer to income success test)
    test("should display expense categories when expense is selected", () => {
        const categorySelect = document.createElement("select");

        updateCategories("expense", categorySelect);

        const optionValues = Array.from(categorySelect.options).map(option => option.value);

        expect(optionValues).toEqual([
            "",
            "housing",
            "utilities",
            "groceries",
            "dining out",
            "transportation",
            "shopping",
            "health",
            "hobby",
            "others"
        ]);
    });

    // failed return: invalid input case
    test("should only display default option for invalid transaction type", () => {
        const categorySelect = document.createElement("select");

        //execute the function
        updateCategories("invalid", categorySelect);

        // get the value for category options
        const optionValues = Array.from(categorySelect.options).map(option => option.value);

        expect(optionValues).toEqual([""]); //categpory has only empty value
    });
})

// fake transaction data for saveTransaction function unit test
const transactionData = {
    type: "expense",
    category: "groceries",
    account: "cash",
    amount: "45.50",
    date: "2026-11-11",
    description: "Bought daily groceries"
};

// tests for saving transactions
describe("saveTransaction function", () => {
    // successful return
    test("saving transaction should succeed", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                message: "Transaction saved successfully."
            })
        });

        // execute save function
        const result = await saveTransaction(transactionData);

        // check the result
        expect(result.success).toBe(true);
        expect(result.message).toBe("Transaction saved successfully.");
        // check whether the correct data was sent
        expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:3000/transactions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(transactionData)
            }
        );
    });

    // failed save
    test("saving transaction should fail", async () => {
        // fake fetch response
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
                success: false,
                message: "Unable to save transaction."
            })
        });

        // check whether the function throws an error
        // the function is async thatis why we use await and .reject
        await expect(saveTransaction(transactionData)).rejects.toThrow("Unable to save transaction.");
    }); 
});

// fake values
const balanceData = {
    success: true,
    bankBalance: 1000,
    cashBalance: 500,
    totalBalance:1500
};

// test for getBalances function
describe("getBalances function", () => {
    // successful return
    test("getting balances should succeed", async() => {
        // fake response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => balanceData
        });

        const result =await getBalances();

        expect(result).toEqual(balanceData);
        expect(global.fetch).toHaveBeenCalledWith(
            "http://127.0.0.1:3000/balances",
            {
                method: "GET",
                credentials: "include"
            }
        );
    });

    // failed return
    test("getBalances shoulw throw and error", async () => {
        // fake response
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({
                success:false,
                message: "Unable to get balances."
            })
        });

        await expect(getBalances()).rejects.toThrow("Unable to get balances.");
    });
});

// test for displayBalances function
describe("displayBalances function", () => {
    // success return
    test("all thebalances should be displayed", () => {
        // fake HTML elements
        document.body.innerHTML = `
            <ul>
                <li id="bank"></li>
                <li id="cash"></li>
                <li id="account-total"></li>
            </ul>
        `;

        // execute the function
        displayBalances(balanceData);

        expect(document.getElementById("bank").textContent).toBe("Bank Savings: $1000.00");
        expect(document.getElementById("cash").textContent).toBe("Cash Savings: $500.00");
        expect(document.getElementById("account-total").textContent).toBe("Total: $1500.00");
        
    });
});