// https://github.com/zackurben/alphavantage
// https://www.alphavantage.co/documentation/

const _ = require('lodash');
const alpha = require('alphavantage')({ key: 'SQW8Y7TY5RVQAQ6G' });

module.exports = {
    fetchStocks: async function (stocks) {
        stocks = stocks || [];

        if (!stocks || !stocks.length) {
            return [];
        } else {
            console.info(`Alpha vantage free tier limit is 5 requests/min.  ETA ~${stocks.length / 5} mins`);
            const results = [];
            for (const stock of stocks) {
                console.info(`Fetching stock ${stock} [${results.length + 1}/${stocks.length}]`);
                const result = await getStock(stock);
                await sleep(60 / 5); // free tier limit of 5 requests/min
                results.push(result);
            }
            return results;
        }
    },
}

async function getStock(stock) {
    if (!stock) {
        throw new Error('Empty stock name was passed.');
    } else {
        const response = await alpha.data.monthly_adjusted(stock);
        return calculateSummary(alpha.util.polish(response));
    }
}

function calculateSummary(response) {
    const lastYear = _.take(Object.keys(response.data), 13)
        .map(key => {
            const value = response.data[key];
            return {
                monthEnding: new Date(key),
                adjusted: parseFloat(value.adjusted),
                open: parseFloat(value.open),
                close: parseFloat(value.close),
                high: parseFloat(value.high),
                low: parseFloat(value.low),
                volume: parseInt(value.volume),
                dividend: parseFloat(value.dividend),
            }
        });
    const lastDataPoint = _.first(lastYear);
    const dividendTotal = _.sumBy(lastYear, 'dividend');
    const splitSymbol = response.meta.symbol.split(':');
    return {
        symbol: splitSymbol[1],
        exchange: splitSymbol[0],
        close: lastDataPoint.close,
        high52: _.maxBy(lastYear, 'high').high,
        low52: _.minBy(lastYear, 'low').low,
        div: dividendTotal,
        yield: dividendTotal <= 0 ? 0 : lastDataPoint.close / dividendTotal,
    };
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}