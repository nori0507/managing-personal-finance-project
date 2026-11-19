// functions that will allow the applications to proceed some features (within main page)
const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "https://managing-personal-finance-project-web.onrender.com";
// Categories for income and expense
const categories = {
    income: ["salary", "side gig", "investment", "others"],
    expense: ["housing","utilities","groceries","dining out","transportation","shopping","health","hobby","others"]
};

window.addEventListener("beforeunload", () => {
    console.log("Page is about to reload or navigate away!");
});

// function to filter displayed categories based on transaction type
function updateCategories(selectedType, categorySelect) {
    // clear existing category options
    categorySelect.innerHTML = "";

    // create the default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Category";
    categorySelect.appendChild(defaultOption);

    // if no valid transaction type is selected, stop, and do not show the categoryoptions
    if (!categories[selectedType]) {
        return;
    }

    // add corresponding categories
    categories[selectedType].forEach(category => {
        const option = document.createElement("option");
        // assign the value and text
        option.value = category;
        option.textContent = category;
        // add to the option
        categorySelect.appendChild(option);
    });
}

// save a new transaction
async function saveTransaction(transactionData) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(transactionData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to save transaction.");
        }

        return data;

    } catch (error) {
        console.error("Error saving transaction:", error);
        throw error;
    }
}

// get account balances
async function getBalances() {
    try {
        const response = await fetch(`${API_BASE_URL}/balances`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to get balances.");
        }

        return data;
    } catch (error) {
        console.error("Error getting balances:", error);
        throw error;
    }
}

// display account balances, with 2 decimal points
function displayBalances(balanceData) {
    document.getElementById("bank").textContent =`Bank Savings: $${balanceData.bankBalance.toFixed(2)}`;
    document.getElementById("cash").textContent =`Cash Savings: $${balanceData.cashBalance.toFixed(2)}`;
    document.getElementById("account-total").textContent =`Total: $${balanceData.totalBalance.toFixed(2)}`;
}

// get value for transactipn record search filters
function getTransactionSearchFilters() {
    const type = document.getElementById("search-transaction-type").value;
    const category = document.getElementById("search-category").value;
    const startDate = document.getElementById("search-start-date").value;
    const endDate = document.getElementById("search-end-date").value;
    const minAmount = document.getElementById("search-min-amount").value;
    const maxAmount = document.getElementById("search-max-amount").value;

    // transaction type is required
    if (!type) {
        throw new Error("Please select a transaction type.");
    }

    // validate date range
    // throw error when we have value for both end and start date, and start date is later than the end date
    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start date cannot be later than end date.");
    }

    // validate amount range
    // throw an error when we have both max and min amount, and min amount is bigger than the max amount
    if (minAmount !== "" && maxAmount !== "" &&
        Number(minAmount) > Number(maxAmount)) {
        throw new Error("Minimum amount cannot exceed maximum amount.");
    }

    return {type,category,startDate,endDate,minAmount,maxAmount};
}

// finction for searching the transaction
async function searchTransactions() {
    const message = document.getElementById("search-message");
    try {
        const filters = getTransactionSearchFilters();
        // values go after "search?"
        const params = new URLSearchParams();

        // when the value for the fileter is not empty, fill the array
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "") {params.append(key, value);}
        });

        const response = await fetch(
            `${API_BASE_URL}/transactions/search?${params.toString()}`, 
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to search transactions.");
        }

        displayTransactionSearchResults(data.transactions);

        // showing how many transactions were found
        message.textContent = `${data.transactions.length} transaction found.`;

    } catch (error) {
        message.textContent = error.message;
        // remove anything from the search result box
        document.getElementById("transaction-search-results-body").replaceChildren();
    }
}

// function display the filtered search result
function displayTransactionSearchResults(transactions) {
    const tableBody = document.getElementById(
        "transaction-search-results-body"
    );

    // remove previous results
    tableBody.replaceChildren();

    // creating each rows within the tabele
    transactions.forEach(transaction => {
        const row = document.createElement("tr");
        const values = [
            transaction.date,
            transaction.type,
            transaction.category,
            transaction.account,
            Number(transaction.amount).toFixed(2),
            transaction.description || ""
        ];
    
        // create a cell for each value and append each of them to create a complete row
        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        // add the row to the table
        tableBody.appendChild(row);
    });
}

// retrive the account balances once you open the page
// apply the category filter and save the new transaction record. then reflect the cahnge to the webpage
document.addEventListener("DOMContentLoaded", async () => {
    const transactionType = document.getElementById("transaction-type");
    const categorySelect = document.getElementById("category");
    const transactionForm = document.getElementById("transaction-form");

    // update categories when transaction type changes
    transactionType.addEventListener("change", () => {
        updateCategories(transactionType.value, categorySelect);
    });

    // handle transaction form submission
    transactionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // get transaction data from HTML
        const transactionData = {
            type: document.getElementById("transaction-type").value,
            category: document.getElementById("category").value,
            account: document.getElementById("account").value,
            amount: document.getElementById("amount").value,
            date: document.getElementById("date").value,
            description: document.getElementById("description").value
        };

        const message = document.getElementById("message");

        try {
            // save transaction 
            const result = await saveTransaction(transactionData);

            // display success message
            message.textContent = result.message;
            message.style.color = "green";

            /// clear form
            transactionForm.reset();
            updateCategories("", categorySelect);

            // refresh account balances
            try {
                const balances = await getBalances();
                displayBalances(balances);
            } catch (error) {
                console.error("Unable to refresh account balances:", error);
            }

            // show success message in a popup
            alert(result.message);
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
    
    // load account balances when the page first opens
    try {
        const balances = await getBalances();
        displayBalances(balances);
    } catch (error) {
        console.error("Unable to display account balances:", error);
    }
});

// event listeners related to searching functions
document.addEventListener("DOMContentLoaded", async () => {
    const searchForm = document.getElementById("transaction-search-form");
    const searchType = document.getElementById("search-transaction-type");
    const searchCategory = document.getElementById("search-category");

    // change the category according to the transaction type
    searchType.addEventListener("change", () => {
        updateCategories(searchType.value, searchCategory);
    });

    // search the record once the submit buttom is pressed
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await searchTransactions();
    });

    // reset the search result 
    searchForm.addEventListener("reset", () => {
        // reset the category dropdown
        updateCategories("", searchCategory);

        // clear the search message
        document.getElementById("search-message").textContent = "";

        // clear the displayed search results
        document.getElementById("transaction-search-results-body").replaceChildren();
    });
});

// export functions for unit tests
if (typeof module !== "undefined") {
    module.exports = {updateCategories, saveTransaction, getBalances, displayBalances, 
        getTransactionSearchFilters, searchTransactions, displayTransactionSearchResults};
}