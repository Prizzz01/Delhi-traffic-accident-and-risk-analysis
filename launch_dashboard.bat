@echo off
title Delhi Traffic Accident & Risk Analysis Dashboard
color 0B
cls
echo =====================================================================
echo    DELHI TRAFFIC ACCIDENT & RISK ANALYSIS INTELLIGENCE PLATFORM
echo    Research & Dashboard by Paarth Thakur
echo =====================================================================
echo.
echo Opening interactive dashboard in your default browser...
echo.

start "" "%~dp0index.html"

echo Dashboard launched successfully!
echo You can view the GIS Hotspot Map, Analytics, and AI Risk Predictor.
echo.
echo Press any key to exit this launcher window...
pause >nul
