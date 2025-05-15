@echo off
start "Backend" cmd /k "cd /d %~dp0greenhouse-backend && npm install && npm start"
start "Frontend" cmd /k "cd /d %~dp0greenhouse-frontend && npm install && npm start" 