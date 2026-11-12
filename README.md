# managing-personal-finance-project
This application will help user managing their personal finance.
The application solves the problem that many students and young adults face regarding their financial management. By building a complete system from user authentication to financial tracking to solve a real-world problem, I can demonstrate both my technical and business skills.
Through this project, I will be using skills such as HTML, CSS, and JavaScript for the frontend, Node.js and Express for the backend, and Sequelize for database management. 

to start the server, put 
node api-server.js
on the command screen

Architectural Decision: MVC
The application uses Express.js on the backend to serve data dynamically via API endpoints, eliminating the need to hardcode content. JavaScript manages our core application logic—allowing us to write and test modular functions—while dynamically updating the UI for a seamless user experience. This separation of data, logic, and presentation reduces complexity and improves developer productivity.

architecture:
frontend
index.html	Main page once the user login
login.html	Login page 
signup.html	Account registration page 
styles.css	Styling the UI
login.js	Login functionality and API requests
signup.js	Account registration functionality and API requests
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
login success - function shows success return when the http and json responce are successful
login failure - function shows the error message when the http and json responce are not successful
sign up success - returning successful message when the http and json responce are successful
sign up failure - returning error message when the http and json responce are not successful
