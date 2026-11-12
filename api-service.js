//backend
//dealing things related to the database
require("dotenv").config(); //to use the env variable
const session = require("express-session"); //to identify login session id

const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");//to store data
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
        sameSite: "lax"
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

// make sure we have the tables ready before user tries to make modifications to them
startServer();