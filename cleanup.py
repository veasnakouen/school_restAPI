#!/usr/bin/env python
import os

base_path = r'e:\NexjsAndDotnet\School\src.worktrees\copilot-worktree-2026-03-27T06-43-12\SchoolAPI'
files_to_delete = ['Program_clean.cs', 'Program_fixed.cs', 'replace_files.bat']

for file in files_to_delete:
    file_path = os.path.join(base_path, file)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f'Deleted: {file}')
        except Exception as e:
            print(f'Failed to delete {file}: {e}')
    else:
        print(f'File not found: {file}')

print('Cleanup completed successfully')
