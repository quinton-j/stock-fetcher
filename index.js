const minimist = require('minimist');
const _ = require('lodash');
const json2csv = require('json2csv').parse;
const fs = require('fs');

const fetchStocks = require('./yahoo-stock-scrapper').fetchStocks;

const parsedArgs = minimist(process.argv.slice(2));
const symbols = (parsedArgs['symbols'] || '').split(',');
const outFile = parsedArgs['out-file'];

(async () => await run(symbols, outFile))();

async function run(symbols, outFile) {
    console.info(`Fetching for symbols:`, symbols);
    try {
        const stocks = await fetchStocks(symbols);
        if (outFile) {
            recordsToCsvFile(stocks, outFile);
        } else {
            console.info(JSON.stringify(stocks, null, 4));
        }
    } catch (error) {
        console.error(error.toString())
    }
}

function recordsToCsvFile(results, outFile) {
    try {
        const csv = json2csv(results, {
            fields: ['symbol', 'close', 'high52', 'low52', 'div', 'yield', 'peRatio'],
        });
        fs.writeFileSync(outFile, csv);
        console.info(`Successfully wrote output to ${outFile}`);
    } catch (error) {
        console.error('Failed to convert records to csv:', error);
    }
}