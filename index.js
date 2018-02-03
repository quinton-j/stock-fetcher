const minimist = require('minimist');
const _ = require('lodash');
const json2csv = require('json2csv');
const fs = require('fs');

const googleStocks = require('./google-stocks').default;

const parsedArgs = minimist(process.argv.slice(2));
const symbols = (parsedArgs['symbols'] || '').split(',');
const outFile = parsedArgs['out-file'];

console.info(`Fetching for symbols:`, symbols);
googleStocks(symbols).then(results => {
    const remappedValues = _.map(results, mapResult);
    if (outFile) {
        recordsToCsvFile(remappedValues, outFile);
    } else {
        console.info(JSON.stringify(remappedValues, null, 4));
    }
}).catch(console.error);

function mapResult(result) {
    if (result.l) { // stock
        return {
            symbol: result.symbol,
            exhcange: result.exchange,
            close: result.l,
            high52: result.hi52,
            low52: result.lo52,
            div: result.ldiv,
            yield: result.dy,
        };
    } else if (result.nav_prior) { //mutual fund
        return {
            symbol: result.t,
            exhcange: result.e,
            close: result.nav_prior,
            yield: result.yield_percent,
            expenseRatio: result.expense_ratio,
        };
    } else { //unknown
        return {};
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