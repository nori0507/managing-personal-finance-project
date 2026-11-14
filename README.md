# managing-personal-finance-project
This application will help user managing their personal finance.
The application solves the problem that many students and young adults face regarding their financial management. By building a complete system from user authentication to financial tracking to solve a real-world problem, I can demonstrate both my technical and business skills.
Through this project, I will be using skills such as HTML, CSS, and JavaScript for the frontend, Node.js and Express for the backend, and Sequelize for database management. 

to start the server, put 
node api-server.js
on the command screen

Architectural Decision: 
MVC:
The application uses Express.js on the backend to serve data dynamically via API endpoints, eliminating the need to hardcode content. JavaScript manages our core application logic—allowing us to write and test modular functions—while dynamically updating the UI for a seamless user experience. This separation of data, logic, and presentation reduces complexity and improves developer productivity.
Observer: 
when the account is created, the personal info for that account will be created
when the personal info within the table is modified, the userinterface will be modified according to it
when the transaction record is updated, the account balance display will be modified


architecture:
frontend
mainpage.html Main page once the user login
index.html	deployed as the first page on render, so navigate to the login page right after
login.html	Login page 
signup.html	Account registration page 
personalinfo.html Personal Information page
styles.css	Styling the UI
login.js	Login functionality and API requests
signup.js	Account registration functionality and API requests
personal-info.js  Personal information functionalities and API requests
script.js	Main page interactions and functionality
financial-management-function.js	Reusable financions
backend and database
api-service.js	Node.js and Express.js, handle api with data in the database
database.sqlite	SQLite database that store user's data
package.json	Project dependencies and scripts
package-lock.json	Records exact dependency versions
_test_  test for the functions 
jest.config.js  Required to execute the npm test


test:
login success 
login failure 
sign up success 
sign up failure 
update personal info success
update personal info fail
get personal info success
get personal info fail
dislpay personal info success
category update success
categpry update fail
save transaction success
save transaction fail
get balances success
get balances fail
display balances success

Note for improvement:
The sprint did not mention about it at all, but i believe I should add logout function since we have login. I have not implemented it yet, but I will be adding it eventually.
I have to adjust the layout for the smaller windows.

Feature improvement required based on sprint2:
