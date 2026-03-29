@echo off
cd /d "e:\NexjsAndDotnet\School\src.worktrees\copilot-worktree-2026-03-27T06-43-12\SchoolAPI"

REM Replace Program.cs with Program_fixed.cs
copy /Y "Program_fixed.cs" "Program.cs"

REM Delete the temporary files
del "Program_clean.cs"
del "Program_fixed.cs"

echo File replacement and cleanup completed successfully
