Set WshShell = CreateObject("WScript.Shell")
' Run Start_BloodBank.bat completely hidden (0 = hidden window)
WshShell.Run "cmd /c d:\Dev_apps\DEV_D\Start_BloodBank.bat", 0, False
