// functions that will allow the applications to proceed some features (within main page index.html)
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
        const response = await fetch("http://127.0.0.1:3000/transactions", {
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

// apply the category filter and save the new transaction record
document.addEventListener("DOMContentLoaded", () => {

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

            // show success message in a popup
            alert(result.message);
        } catch (error) {
            message.textContent = error.message;
            message.style.color = "red";
        }
    });
});


// export functions for unit tests
if (typeof module !== "undefined") {
    module.exports = {updateCategories};
}