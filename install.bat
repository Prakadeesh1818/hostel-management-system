@echo off
echo Installing Hostel Management System...
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    echo Please ensure Node.js is installed and try again.
    pause
    exit /b 1
)

echo.
echo Step 2: Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    echo Please ensure Node.js is installed and try again.
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Setting up database...
echo Please ensure MongoDB is running on localhost:27017
cd backend
node setup.js
if %errorlevel% neq 0 (
    echo Error setting up database!
    echo Please ensure MongoDB is running and try again.
    pause
    exit /b 1
)
cd ..

echo.
echo Installation completed successfully!
echo.
echo To start the application:
echo 1. Backend: cd backend ^&^& npm run dev
echo 2. Frontend: cd frontend ^&^& npm start
echo.
echo Login credentials:
echo Admin: admin@hostel.com / admin123
echo Student: student@hostel.com / student123
echo.
pause