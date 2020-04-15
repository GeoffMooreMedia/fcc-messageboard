**FreeCodeCamp**- Information Security and Quality Assurance
------

Project Anon Message Board

1) SET NODE_ENV to `test` without quotes when ready to write tests and DB to your databases connection string (in .env)
2) Recomended to create controllers/handlers and handle routing in routes/api.js
3) You will add any security features to `server.js`
4) You will create all of the functional/unit tests in `tests/2_functional-tests.js` and `tests/1_unit-tests.js` but only functional will be tested


**Notes on Method**

While this API is developed to meet FreeCodeCamp's testing requirements, I don't think this is the best method for this. It is difficult to test the PUT and DELETE calls and data is duplicated in the database. The requirements seem to indicate replies be stored in a replies collection but the same data to be stored in the replies array of the thread. Changes I would make if they wouldn't break the FreeCodeCamp tests would be...

1) Separate collections for boards, threads, and replies. Threads have a board key with the  