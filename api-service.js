//backend
//dealing things related to the database
require("dotenv").config(); //to use the env variable
const session = require("express-session"); //to identify login session id

const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes, Op } = require("sequelize");//to store data
const bcrypt = require("bcryptjs");//to hash the password

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

// render runs behind a proxy, so Express needs to trust it when using secure cookies.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// make sure SESSION_SECRET exists
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is missing.");
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax"
    }
}));
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Secure cookies enabled:", process.env.NODE_ENV === "production");

// connection with the database
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

// user model (used for login and signup)
const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }// check if the value looks like email or not 
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, 
{
    tableName: "users",
    timestamps: true
});

// personal information model
const PersonalInfo = sequelize.define("PersonalInfo", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    fName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {isEmail: true}
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: "personal_information",
    timestamps: true
});

// building a one-to-one relationship by userid. one user has one personal information
User.hasOne(PersonalInfo, {
    foreignKey: "id",
    sourceKey: "id",
    onDelete: "CASCADE" //when the user is deleted, autonatically delete the personal info that belongs to the user record
});

// personal information belongs to one user, making sure the relationship has both direction
PersonalInfo.belongsTo(User, {
    foreignKey: "id",
    targetKey: "id"
});

// transaction model
const Transaction = sequelize.define("Transaction", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM("income", "expense"),
        allowNull: false
    },
    account: {
        type: DataTypes.ENUM("bank", "cash"),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    category: {
        type: DataTypes.ENUM("salary", "side gig", "investment", "housing", "utilities", "groceries", 
            "dining out", "transportation", "shopping", "health", "hobby", "others"),
        allowNull:false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: "transactions",
    timestamps: true
});

// one user can have many transactions
User.hasMany(Transaction, {
    foreignKey: "userId",
    onDelete: "CASCADE"
});

// each transaction belongs to one user
Transaction.belongsTo(User, {
    foreignKey: "userId"
});

// saving goal model
const SavingGoal = sequelize.define("SavingGoal", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    goalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    targetDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

// One user can have multiple saving goals
User.hasMany(SavingGoal, {
    foreignKey: "userId",
    onDelete: "CASCADE"
});

// Each saving goal belongs to one user
SavingGoal.belongsTo(User, {
    foreignKey: "userId"
});

// signup, adding an account. it also creates an associated personal information record because they relate each other by userid
app.post("/signup", async (req, res) => {
    try {
        //getting email and password
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) { //case both or either of them are missing
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // check whether the email already exists
        const existingUser = await User.findOne({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered. Try again."
            });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // save the new user
        const newUser = await User.create({
            email: email,
            passwordHash: hashedPassword
        });

        // create an associated personal information record
        await PersonalInfo.create({
            id: newUser.id,
            email: newUser.email
        });

        res.status(201).json({
            success: true,
            message: "Account has been created successfully!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to create account. Try again"
        });
    }
});

//log in 
app.post("/login", async (req, res) => {
    try {
        // get input
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = req.body.password;

        // find user in database
        const user = await User.findOne({
            where: { email: email }
        });

        if (!user) { //user not found
            return res.status(401).json({
                success: false,
                message: "Invalid email"
            });
        }

        // compare entered password with stored hash
        const passwordMatches = await bcrypt.compare(password,user.passwordHash);

        if (!passwordMatches) { // wrong password
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }

        // create a new session after successful login
        req.session.regenerate((error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Unable to create login session."
                });
            }

            // store the logged-in user's id in the session
            req.session.userId = user.id;

            // save the session
            req.session.save((error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({
                        success: false,
                        message: "Unable to save login session."
                    });
                }
                // login and session creation succeeded
                res.json({
                    success: true,
                    message: "Login and session creation successful!"
                });
            });
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
});

// function to start server
async function startServer() {
    try {
        // test database connection
        await sequelize.authenticate();

        console.log("Database connected successfully!");

        // create database tables if they don't exist
        await sequelize.sync();

        console.log("Database tables synchronized!");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
        const users = await User.findAll({
            attributes: ["id", "email"]
        });

console.log("Registered users:", users.map(user => user.toJSON()));

    } catch (error) {
        console.error("Unable to start server:", error);
    }
}

// check if the the user is actually logged in
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "You have to log in first."
        });
    }

    next();
}

// get PersonalInfo record
app.get("/personal-info", requireLogin, async (req, res) => {
    try {
        // recognizing the user who is loggin in
        const userId = req.session.userId;

        // find the user's personal information
        const personalInfo = await PersonalInfo.findByPk(userId);

        // case where personal info not found
        if (!personalInfo) {
            return res.status(404).json({
                success: false,
                message: "Personal information for this user not found."
            });
        }

        // return personal info
        res.status(200).json({
            success: true,
            personalInfo: {
                fName: personalInfo.fName,
                lName: personalInfo.lName,
                email: personalInfo.email,
                phone: personalInfo.phone,
                address: personalInfo.address,
                country: personalInfo.country
            }
        });

    } catch (error) {
        console.error("Error retrieving personal information:", error);

        res.status(500).json({
            success: false,
            message: "Unable to return personal information."
        });
    }
});

// modify the PersonalInfo record
app.put("/personal-info", requireLogin, async (req, res) => {
    try {
        // recognizing the user who is loggin in
        const userId = req.session.userId;

        // Find the existing personal information
        const personalInfo = await PersonalInfo.findByPk(userId);

        //case where the PersonalInfo record was not found
        if (!personalInfo) {
            return res.status(404).json({
                success: false,
                message: "Personal information for this user was not found."
            });
        }

        // Update personal information
        await personalInfo.update({
            fName: req.body.fName,
            lName: req.body.lName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            country: req.body.country
        });

        res.status(200).json({
            success: true,
            message: "Personal information update succeeded!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update personal information."
        });
    }
});


// create a new transaction recprd
app.post("/transactions", requireLogin, async (req, res) => {
    try {
        // identify the currently logged-in user
        const userId = req.session.userId;

        // get transaction data that was inputted by user from the frontend
        const { type, account, amount, category, date, description} = req.body;

        // define valid categories for each transaction type
        const validCategories = {
            income: ["salary", "side gig", "investment", "others"],
            expense: ["housing", "utilities", "groceries", "dining out", "transportation", "shopping", "health", "hobby", "others"]
        };

        // validate transaction type and category
        if (!validCategories[type]?.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type or category."
            });
        }

        // validate account
        if (!["bank", "cash"].includes(account)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account."
            });
        }

        // validate amount (positive, with at most two decimal places)
        const amountText = String(amount ?? ""); //undefined amount willbe tuned into empty string
        const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/; //number format
        const amountNumber = Number(amountText);

        if (!amountPattern.test(amountText) || !Number.isFinite(amountNumber) || amountNumber <= 0 || amountNumber > 9999999999.99) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid positive amount."
            });
        }

        // validate date in YYYY-MM-DD format
        // last comparsion is to reject impossible value
        if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)
        {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction date."
            });
        }

        // Save transaction to the database
        const newTransaction = await Transaction.create({
            userId: userId,
            type: type,
            account: account,
            amount: amountText,
            category: category,
            date: date,
            description: description?.trim() || null //? is for .trim() not to cause an error with null value
        });

        // return success response
        return res.status(201).json({
            success: true,
            message: "Transaction saved successfully.",
            transaction: newTransaction
        });

    } catch (error) {
        console.error("Error saving transaction:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save transaction."
        });
    }
});

// get current account balances
app.get("/balances", async (req, res) => {
    try {
        // check whether user is logged in
        const userId = req.session.userId;

        // user has not logged in
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "You have to log in first."
            });
        }

        // retrieve all the transactions for the logged-in user
        const transactions = await Transaction.findAll({where: { userId }});

        let bankBalance = 0;
        let cashBalance = 0;

        transactions.forEach(transaction => {
            let amount = Number(transaction.amount);

            // changing amount to the negative value when the type is expense
            if (transaction.type === "expense") {
                amount = -amount;
            }

            if (transaction.account === "bank") {
                bankBalance += amount; //total in the bank account
            } else if (transaction.account === "cash") {
                cashBalance += amount; // total in cash
            }
        });

        res.json({
            success: true,
            bankBalance,
            cashBalance,
            totalBalance: bankBalance + cashBalance // total of bank and cash
        });

    } catch (error) {
        console.error("Error getting balances:", error);
        res.status(500).json({
            success: false,
            message: "Unable to retrieve balances."
        });
    }
});

// search transaction records for the logged-in user
app.get("/transactions/search", requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;

        // get filters from the URL query parameters
        const {type,category,startDate,endDate,minAmount,maxAmount} = req.query;

        // validate transaction type according to the transaction type
        const validCategories = {
            income: ["salary", "side gig", "investment", "others"],
            expense: ["housing", "utilities", "groceries", "dining out", "transportation", "shopping", "health", "hobby", "others"]
        };

        // throw error if the invalid(non-existing) transaction type sent
        if (!validCategories[type]) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid transaction type."
            });
        }

        // throw error id the category is not under the selected type
        if (category && !validCategories[type].includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category for the selected type."
            });
        }

        // validate date inputs
        function isValidDate(value) {
            return (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                !Number.isNaN(Date.parse(value)) && // check if JavaScript can parse the date
                new Date(value).toISOString().slice(0, 10) === value //check if the date exist
            );
        }

        // validate amount inputs
        const validAmount = (value) =>
            typeof value === "string" &&
            value.trim() !== "" && // check if it is not empty
            Number.isFinite(Number(value)) &&
            Number(value) >= 0 &&
            Number(value) <= 9999999999.99;

        if ((minAmount !== undefined && !validAmount(minAmount)) ||
            (maxAmount !== undefined && !validAmount(maxAmount)) ||
            (minAmount !== undefined && maxAmount !== undefined && Number(minAmount) > Number(maxAmount))) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount range."
            });
        }

        // build Sequelize search conditions
        const where = {userId: userId, type: type};

        // optional category filter
        if (category) {
            where.category = category;
        }

        // Optional date filters
        if (startDate || endDate) {
            where.date = {};

            if (startDate) {
                where.date[Op.gte] = startDate;
            }
            if (endDate) {
                where.date[Op.lte] = endDate;
            }
        }

        // optional amount filters
        if (minAmount !== undefined || maxAmount !== undefined) {
            where.amount = {};

            if (minAmount !== undefined) {
                where.amount[Op.gte] = Number(minAmount);
            }
            if (maxAmount !== undefined) {
                where.amount[Op.lte] = Number(maxAmount);
            }
        }

        // Retrieve matching transactions
        const transactions = await Transaction.findAll({
            where: where, // where has all the conditiond that the user entered
            order: [["date", "DESC"], ["id", "DESC"]]
        });

        // success
        return res.status(200).json({
            success: true,
            transactions: transactions
        });

    } catch (error) {
        console.error("Error searching transactions:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to search transactions."
        });
    }
});


// create a new savings goal for the logged-in user.
app.post("/saving-goals", requireLogin, async (req, res) => {
    try {
        // identify the logged-in user
        const userId = req.session.userId;

        // retrieve data from the frontend
        const { name, goalAmount, targetDate } = req.body;

        // validate the goal name
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid goal name."
            });
        }

        // validate the goal amount
        if (
            goalAmount === null ||
            goalAmount === undefined ||
            goalAmount === "" ||
            !Number.isFinite(Number(goalAmount)) ||
            Number(goalAmount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Goal amount must be greater than zero."
            });
        }

        // validate the target date
        if (
            typeof targetDate !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
            !Number.isFinite(Date.parse(targetDate)) ||
            new Date(targetDate).toISOString().slice(0, 10) !== targetDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid target date."
            });
        }

        // create the savings goal in SQLite
        const newGoal = await SavingGoal.create({
            userId,
            name: name.trim(),
            goalAmount: Number(goalAmount),
            targetDate
        });

        // return the newly created goal
        return res.status(201).json({
            success: true,
            message: "Savings goal created successfully!",
            goal: newGoal
        });

    } catch (error) {
        console.error("Error creating savings goal:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create savings goal."
        });
    }
});

// allocating savings to the goals based on the target date
function allocateSavingsToGoals(goals, totalSavings) {

    // savings available for allocation
    let availableSavings = Math.max(0, Number(totalSavings));

    // sort goals by their deadlines (earliest first)
    const sortedGoals = [...goals].sort(
        function(a, b) {
            return a.targetDate.localeCompare(b.targetDate) || a.id - b.id;
        }
    )

    // calculate progress for each goal
    return sortedGoals.map(goal => {
        const goalAmount = Number(goal.goalAmount);

        // allocate savings without exceeding the goal
        const allocatedSavings = Math.min(availableSavings, goalAmount);

        // update remaining available savings
        availableSavings -= allocatedSavings;

        // calculate remaining amount
        const remaining = goalAmount - allocatedSavings;

        // calculate progress percentage
        const progress = (allocatedSavings / goalAmount) * 100;

        return {
            ...goal,
            allocatedSavings,
            remaining,
            progress
        };
    });
}

 // retrieve savings goals and calculate their allocations.
app.get("/saving-goals", requireLogin, async (req, res) => {
    try {
        // identify the logged-in user
        const userId = req.session.userId;

        // get the user's savings goals
        const goals = await SavingGoal.findAll({where: { userId }, raw: true});

        // get the user's transactions
        const transactions = await Transaction.findAll({where: { userId }});

        // calculate available savings from transactions
        let totalSavings = 0;
        transactions.forEach(transaction => {
            const amount = Number(transaction.amount);

            if (transaction.type === "income") {
                totalSavings += amount;
            } else if (transaction.type === "expense") {
                totalSavings -= amount;
            }
        });
        // nonnegative available savings
        totalSavings = Math.max(0, totalSavings);

        // execute the allocate function
        const allocatedGoals = allocateSavingsToGoals(goals, totalSavings);

        return res.status(200).json({
            success: true,
            totalSavings,
            goals: allocatedGoals
        });

    } catch (error) {
        console.error("Error retrieving savings goals:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve savings goals."
        });
    }
});

// make sure we have the tables ready before user tries to make modifications to them
startServer();