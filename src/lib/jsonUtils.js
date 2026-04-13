const fs = require('fs');
const path = require('path');

/**
 * Safely read and parse a JSON file (synchronous)
 * @param {string} filepath - Path to JSON file
 * @returns {object|null} - Parsed JSON or null if error/not found
 */
function readJsonFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) {
        console.log(`Warning: Could not read ${filepath}`);
    }
    return null;
}

/**
 * Safely read and parse a JSON file (asynchronous)
 * @param {string} filepath - Path to JSON file
 * @returns {Promise<object|null>} - Parsed JSON or null if error/not found
 */
async function readJsonFileAsync(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            const data = await fs.promises.readFile(filepath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.log(`Warning: Could not read ${filepath}`);
    }
    return null;
}

/**
 * Check if a file is accessible for reading/writing
 * @param {string} filepath - Path to file
 * @returns {boolean} - True if accessible
 */
function isFileAccessible(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            fs.accessSync(filepath, fs.constants.R_OK | fs.constants.W_OK);
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

/**
 * Ensure a directory exists
 * @param {string} dirpath - Path to directory
 */
function ensureDir(dirpath) {
    if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
    }
}

/**
 * Write JSON to file with backup (synchronous)
 * @param {string} filepath - Path to file
 * @param {object} data - Data to write
 */
function writeJsonFile(filepath, data) {
    const dir = path.dirname(filepath);
    ensureDir(dir);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Write JSON to file (asynchronous)
 * @param {string} filepath - Path to file
 * @param {object} data - Data to write
 * @returns {Promise<void>}
 */
async function writeJsonFileAsync(filepath, data) {
    const dir = path.dirname(filepath);
    ensureDir(dir);
    await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Find and read a report JSON file across all possible locations.
 * Search order:
 *   1. reports/YYYY-MM-DD/raw_data/filename.json  (current daily workflow)
 *   2. reports/YYYY-MM-DD/filename.json  (organized structure)
 *   3. reports/YYYY-MM-DD_filename.json  (legacy flat root)
 *   4. reports/archive/YYYY-MM-DD/raw_data/filename.json  (archived current layout)
 *   5. reports/archive/YYYY-MM-DD/filename.json  (archived organized)
 *   6. reports/archive/YYYY-MM-DD/YYYY-MM-DD_filename.json  (archived legacy flat)
 *
 * @param {string} date - Date string YYYY-MM-DD
 * @param {string} filename - Base filename without date prefix, e.g. "portfolio_snapshot.json"
 * @param {string} [reportsDir] - Path to reports directory (default: ./reports)
 * @returns {object|null} - Parsed JSON or null
 */
function findReport(date, filename, reportsDir) {
    const dir = reportsDir || path.join(process.cwd(), 'reports');
    
    const searchPaths = [
        path.join(dir, date, 'raw_data', filename),
        path.join(dir, date, filename),
        path.join(dir, `${date}_${filename}`),
        path.join(dir, 'archive', date, 'raw_data', filename),
        path.join(dir, 'archive', date, filename),
        path.join(dir, 'archive', date, `${date}_${filename}`)
    ];
    
    for (const p of searchPaths) {
        const result = readJsonFile(p);
        if (result) {return result;}
    }
    
    return null;
}

module.exports = {
    readJsonFile,
    readJsonFileAsync,
    isFileAccessible,
    ensureDir,
    writeJsonFile,
    writeJsonFileAsync,
    findReport
};
