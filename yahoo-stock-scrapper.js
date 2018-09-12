
const _ = require('lodash');
const request = require('request-promise-lite');
const cheerio = require('cheerio');

module.exports = {
    fetchStocks: async function (stocks) {
        stocks = stocks || [];

        if (!stocks || !stocks.length) {
            return [];
        } else {
            return Promise.all(stocks.map(getStock));
        }
    },
}

const baseUrl = 'https://finance.yahoo.com/quote/';
async function getStock(stock) {
    if (!stock) {
        throw new Error('Empty stock name was passed.');
    } else {
        console.info(`Fetching stock ${stock}....`);
        const response = await request.get(baseUrl + stock, {
            json: false,
            resolveWithFullResponse: true,
        });
        return parseStock(stock, response.body.toString());
    }
}

function parseStock(stock, body) {
    const splitSymbol = stock.split('.');
    const $ = cheerio.load(body);
    const current = parseFloat($('span[data-reactid="35"]').text());
    const range52Weeks = $('td[data-test="FIFTY_TWO_WK_RANGE-value"]').text().split('-');
    const peRatio = $('span', 'td[data-test="PE_RATIO-value"]').text().trim();
    let dividend, stockYield;
    let dividendAndYield = $('td[data-test="DIVIDEND_AND_YIELD-value"]').text().trim();
    if(dividendAndYield === "") {
        const yieldString = $('span', 'td[data-test="TD_YIELD-value"]').text().replace('%', '').trim();
        stockYield = parseFloat(yieldString)/100.0;
        dividend = current * stockYield;
    } else {
        const splits = dividendAndYield.split('(');
        dividend = parseFloat(splits[0].trim());
        stockYield = parseFloat(splits[1].split('%')[0])/100.0;
    }
    return {
        symbol: splitSymbol[0],
        exchange: splitSymbol[1],
        close: current,
        high52: parseFloat(range52Weeks[1].trim()),
        low52: parseFloat(range52Weeks[0].trim()),
        div: dividend,
        yield: stockYield,
        peRatio: parseFloat(peRatio),
    };
}
