const fs = require('fs');
const path = require('path');

const basePath = 'e:\\NexjsAndDotnet\\School\\src.worktrees\\copilot-worktree-2026-03-27T06-43-12\\SchoolAPI';
const filesToDelete = ['Program_clean.cs', 'Program_fixed.cs', 'replace_files.bat'];

filesToDelete.forEach(file => {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${file}`);
        } catch (error) {
            console.log(`Failed to delete ${file}: ${error.message}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

console.log('Cleanup completed successfully');
