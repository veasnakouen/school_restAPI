@echo off
cd /d "e:\NexjsAndDotnet\School\src.worktrees\copilot-worktree-2026-03-27T06-43-12\SchoolAPI"

if exist "Program_clean.cs" (
    del "Program_clean.cs"
    echo Deleted: Program_clean.cs
) else (
    echo Program_clean.cs not found
)

if exist "Program_fixed.cs" (
    del "Program_fixed.cs"
    echo Deleted: Program_fixed.cs
) else (
    echo Program_fixed.cs not found
)

echo Cleanup completed successfully
cd /d "e:\NexjsAndDotnet\School\src.worktrees\copilot-worktree-2026-03-27T06-43-12"
del replace_files.bat
echo Deleted: replace_files.bat
