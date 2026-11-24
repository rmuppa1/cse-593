This is a smart city hub web application made with code generated using ChatGPT - 5.6 Sol medium.
The technologies used to generate the smart city hub application are React, Node, Express.js PostgreSQL, Prisma, and JSON web tokens.

Use these commands for Database setup
cd backend
npx prisma generate
npx prisma migrate dev --name init

Use these commands to run the application
In terminal 1
    cd backend
    npm run dev
In terminal 2
    cd frontend
    npm run dev

The default user login credentials to test the application are below
email: 'citizen@example.com'
password: 'Password123!'
email: 'admin@smartcity.gov'
password: 'Password123!'
email: 'manager@smartcity.gov'
password: 'Password123!'

A .env file needs to be added in the backend folder with the following content
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5***/smartcity_copilot"
JWT_SECRET="YOUR_RANDOM_JWT_SECRET"
JWT_EXPIRES_IN="7d"
PORT=5003
NODE_ENV=development
CORS_ORIGIN="http://localhost:5***"