const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove 'item' and convert xs={12} sm={6} to size={{ xs: 12, sm: 6 }}
    // A bit tricky because props can be in any order and can have different breakpoints
    // First, let's just find <Grid item ... >
    
    // We can use a regex to replace the entire <Grid item ...> tag.
    content = content.replace(/<Grid\s+item\s+([^>]*?)>/g, (match, propsStr) => {
        // Find all breakpoint props: xs, sm, md, lg, xl
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
        let sizes = [];
        let otherProps = propsStr;

        breakpoints.forEach(bp => {
            const regex = new RegExp(bp + '={([^}]+)}|' + bp + '="([^"]+)"|' + bp + '=(\\d+)');
            const matchBp = otherProps.match(regex);
            if (matchBp) {
                const val = matchBp[1] || matchBp[2] || matchBp[3];
                if (val !== 'true') {
                  sizes.push(bp + ': ' + val);
                } else {
                  sizes.push(bp + ': true');
                }
                otherProps = otherProps.replace(matchBp[0], '');
            } else {
                // Check for boolean shorthand e.g. <Grid item xs>
                const boolRegex = new RegExp('\\b' + bp + '\\b(?!=)');
                if (boolRegex.test(otherProps)) {
                    sizes.push(bp + ': true');
                    otherProps = otherProps.replace(boolRegex, '');
                }
            }
        });

        otherProps = otherProps.replace(/\s+/g, ' ').trim();
        let sizeProp = sizes.length > 0 ? ' size={{ ' + sizes.join(', ') + ' }}' : '';
        
        return '<Grid' + (otherProps ? ' ' + otherProps : '') + sizeProp + '>';
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
        console.log('Updated ' + file);
    }
});

console.log('Total files updated: ' + changedFiles);
