//backend
const API_BASE_URL = "http://localhost:3000";

const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");//to store data
const bcrypt = require("bcryptjs");//to hash the password

const app = express();

app.use(cors());
app.use(express.json());

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

// signup, adding an account
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
        await User.create({
            email: email,
            passwordHash: hashedPassword
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

        res.json({
            success: true,
            message: "Login successful!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
});

// start server
async function startServer() {
    try {
        // test database connection
        await sequelize.authenticate();

        console.log("Database connected successfully!");

        // create database tables if they don't exist
        await sequelize.sync();

        console.log("Database tables synchronized!");

        // start Express server
        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });

    } catch (error) {
        console.error("Unable to start server:", error);
    }
}

// make sure we have the tables ready before user tries to make modifications to them
startServer();