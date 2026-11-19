// test file for the financial management function
const { updateCategories, saveTransaction, getBalances, displayBalances, getTransactionSearchFilters, 
    searchTransactions, displayTransactionSearchResults } = require("../financial-management-function.js"); 

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
        expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/transactions",
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
            "http://localhost:3000/balances",
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

//test for get transaction filter function
describe("getTransactionSearchFilters function", () => {

    // fake HTML
    beforeEach(() => {
        document.body.innerHTML = `
            <select id="search-transaction-type">
                <option value="">Select Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
            </select>

            <select id="search-category">
                <option value="">Select Category</option>
                <option value="groceries">Groceries</option>
            </select>

            <input id="search-start-date" type="date">
            <input id="search-end-date" type="date">
            <input id="search-min-amount" type="number">
            <input id="search-max-amount" type="number">
        `;
    });

    // success case - function return all the values correctly
    test("should return the selected search filters", () => {
        document.getElementById("search-transaction-type").value = "expense";
        document.getElementById("search-category").value = "groceries";
        document.getElementById("search-start-date").value = "2026-11-01";
        document.getElementById("search-end-date").value = "2026-11-17";
        document.getElementById("search-min-amount").value = "20";
        document.getElementById("search-max-amount").value = "100";

        const result = getTransactionSearchFilters();

        expect(result).toEqual({
            type: "expense",
            category: "groceries",
            startDate: "2026-11-01",
            endDate: "2026-11-17",
            minAmount: "20",
            maxAmount: "100"
        });
    });

    // fail case - transaction type is not selected
    test("should reject missing transaction type", () => {
        expect(function () {
            getTransactionSearchFilters();
        }).toThrow("Please select a transaction type.");
    });

    // fail case - date range is not valid(start date is later than the end date)
    test("should reject invalid date range", () => {
        document.getElementById("search-transaction-type").value = "expense";
        document.getElementById("search-start-date").value = "2026-11-16";
        document.getElementById("search-end-date").value = "2026-11-02";

        expect(function () {
            getTransactionSearchFilters();
        }).toThrow("Start date cannot be later than end date.");
    });

    // fail case - invalid amount range
    test("should reject invalid amount range", () => {
        document.getElementById("search-transaction-type").value = "expense";
        document.getElementById("search-min-amount").value = "500";
        document.getElementById("search-max-amount").value = "100";

        expect(function () {
            getTransactionSearchFilters();
        }).toThrow("Minimum amount cannot exceed maximum amount.");
    });
});

// search transaction function test
describe("searchTransactions function", () => {

    // fake HTML
    beforeEach(() => {
        document.body.innerHTML = `
            <select id="search-transaction-type">
                <option value="">Select Type</option>
                <option value="expense">Expense</option>
            </select>

            <select id="search-category">
                <option value="">Select Category</option>
                <option value="groceries">Groceries</option>
            </select>

            <input id="search-start-date" type="date">
            <input id="search-end-date" type="date">
            <input id="search-min-amount" type="number">
            <input id="search-max-amount" type="number">

            <p id="search-message"></p>

            <table>
                <tbody id="transaction-search-results-body"></tbody>
            </table>
        `;

        document.getElementById("search-transaction-type").value = "expense";
        document.getElementById("search-category").value = "groceries";

        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // success case
    test("should search transactions successfully", async () => {
        const transactions = [
            {
                date: "2026-11-10",
                type: "expense",
                category: "groceries",
                account: "cash",
                amount: "45.50",
                description: "Groceries"
            }
        ];

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                transactions: transactions
            })
        });

        // execute the function
        await searchTransactions();

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/transactions/search?type=expense&category=groceries"),
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );
        expect(document.getElementById("search-message").textContent).toBe("1 transaction found.");
        expect(document.querySelectorAll("#transaction-search-results-body tr")).toHaveLength(1);
    });

    // fail case - fetch responce failed
    test("should display an error when the API fails", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                success: false,
                message: "Unable to search transactions."
            })
        });

        // execute the function
        await searchTransactions();

        expect(document.getElementById("search-message").textContent).toBe("Unable to search transactions.");
        expect(document.querySelectorAll("#transaction-search-results-body tr")).toHaveLength(0);
    });

    // fail case - transaction type missing
    test("should not call the API when transaction type is missing", async () => {
        document.getElementById("search-transaction-type").value = "";

        // execute the function
        await searchTransactions();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(document.getElementById("search-message").textContent).toBe("Please select a transaction type.");
    });
});

// test for display the transaction search result function
describe("displayTransactionSearchResults function", () => {

    // success case
    test("should display transaction records in the table", () => {

        // fake HTML
        document.body.innerHTML = `
            <table>
                <tbody id="transaction-search-results-body"></tbody>
            </table>
        `;

        const transactions = [
            {
                date: "2026-11-10",
                type: "expense",
                category: "groceries",
                account: "cash",
                amount: "45.5",
                description: "Bought beef"
            }
        ];

        // execute the function
        displayTransactionSearchResults(transactions);

        // tr is row
        const rows = document.querySelectorAll(
            "#transaction-search-results-body tr"
        );

        expect(rows).toHaveLength(1);

        // td is cell
        const cells = rows[0].querySelectorAll("td");

        expect(cells).toHaveLength(6);
        expect(cells[0].textContent).toBe("2026-11-10");
        expect(cells[1].textContent).toBe("expense");
        expect(cells[2].textContent).toBe("groceries");
        expect(cells[3].textContent).toBe("cash");
        expect(cells[4].textContent).toBe("45.50");
        expect(cells[5].textContent).toBe("Bought beef");
    });
});