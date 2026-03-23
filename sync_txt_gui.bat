@echo off
cd /d "%~dp0"
python scripts\sync_txt_gui.py
if errorlevel 1 pause
