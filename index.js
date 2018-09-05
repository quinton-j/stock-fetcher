const minimist = require('minimist');
const _ = require('lodash');
const json2csv = require('json2csv');
const fs = require('fs');

//const fetchStocks = require('./google-stocks').fetchStocks;
//const fetchStocks = require('./iex-stocks').fetchStocks;
// const fetchStocks = require('./alpha-vantage-stocks').fetchStocks;
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
    json2csv({
        data: results,
        fields: ['symbol', 'close', 'high52', 'low52', 'div', 'yield'],
    }, (error, csvString) => {
        if (error) {
            console.error('Failed to convert records to csv:', error);
        } else {
            fs.writeFileSync(outFile, csvString);
            console.info(`Successfully wrote output to ${outFile}`);
        }
    });
}