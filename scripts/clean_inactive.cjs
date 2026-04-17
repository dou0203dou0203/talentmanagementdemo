const fs = require('fs');

const file1 = 'src/data/mockData.ts';
const file2 = 'supabase/03_seed_users.sql';

const inactiveIds = ['u-7', 'u-35', 'u-55', 'u-80', 'u-120', 'u-145', 'u-170', 'u-190'];

let data1 = fs.readFileSync(file1, 'utf8');
let lines = data1.split('\n');
let outLines = [];
let inBlock = false;
let blockLines = [];
let blockMatchesInactive = false;
let bracesCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we are inside an array of objects
    if (line.match(/^  \{$/) && bracesCount === 0) {
        inBlock = true;
        blockLines = [line];
        blockMatchesInactive = false;
        bracesCount = 1;
        continue;
    }
    
    if (inBlock) {
        blockLines.push(line);
        // count braces
        const open = (line.match(/\{/g) || []).length;
        const close = (line.match(/\}/g) || []).length;
        bracesCount += open - close;
        
        // Check if any inactive ID is referenced in this block
        for (let id of inactiveIds) {
            if (line.includes(`'${id}'`) && (line.includes('id:') || line.includes('user_id:') || line.includes('evaluator_id:'))) {
                blockMatchesInactive = true;
            }
        }
        
        if (bracesCount === 0) {
            inBlock = false;
            // If block is safe, output it. Otherwise drop it.
            if (!blockMatchesInactive) {
                outLines.push(...blockLines);
            }
            continue;
        }
    } else {
        outLines.push(line);
    }
}

fs.writeFileSync(file1, outLines.join('\n'));

// Now clean up SQL for users table
let sqlData = fs.readFileSync(file2, 'utf8');
let sqlLines = sqlData.split('\n');
let outSql = [];
for (let line of sqlLines) {
    let skip = false;
    for (let id of inactiveIds) {
        if (line.includes(`('${id}'`)) {
            skip = true;
        }
    }
    if (!skip) {
        outSql.push(line);
    }
}
fs.writeFileSync(file2, outSql.join('\n'));

// Clean up SQL for evaluations/surveys/interviews if they exist in 04/05/06 seeds
const otherSqlFiles = ['supabase/04_seed_business_data.sql', 'supabase/05_seed_interviews_aptitude.sql'];
for (const f of otherSqlFiles) {
    if (fs.existsSync(f)) {
        let fData = fs.readFileSync(f, 'utf8');
        let fLines = fData.split('\n');
        let fOut = [];
        for (let line of fLines) {
            let skip = false;
            for (let id of inactiveIds) {
                // In SQL, they are referenced like 'u-7'
                if (line.includes(`'${id}'`)) {
                    skip = true;
                }
            }
            if (!skip) {
                // ensure we don't break INSERT INTO trailing commas by fixing the last line manually if needed
                fOut.push(line);
            }
        }
        
        // fix trailing commas
        for (let j = 0; j < fOut.length; j++) {
            if (fOut[j].trim() === ';' && j > 0 && fOut[j-1].trim().endsWith(',')) {
                fOut[j-1] = fOut[j-1].replace(/,$/, '');
            }
        }
        fs.writeFileSync(f, fOut.join('\n'));
    }
}

console.log('Successfully pruned ' + inactiveIds.length + ' inactive users.');
