' Runs server\chay-ngam.cmd without a window. Started by the "Lai Long View" shortcut in the Windows Startup folder.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """ & dir & "\chay-ngam.cmd""", 0, False
