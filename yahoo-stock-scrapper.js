
const request = require('request-promise-lite');

module.exports = {
    fetchStocks: async function (stocks) {
        stocks = stocks || [];

        if (!stocks || !stocks.length) {
            return [];
        } else {
            return Promise.all(stocks.sort().map(getStock));
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
        return parseStockJson(stock, response.body.toString());
    }
}

function parseStockJson(stock, body) {
    const splitSymbol = stock.split('.');
    const data = /^root\.App\.main = (.*);$/gm.exec(body);
    const json = JSON.parse(data[1]);
    const quoteSummaryStore = json.context.dispatcher.stores.QuoteSummaryStore;
    const streamDataStore = json.context.dispatcher.stores.StreamDataStore.quoteData[stock];
    const summaryDetail = quoteSummaryStore.summaryDetail;

    const current = quoteSummaryStore.price.regularMarketPrice.raw;

    return {
        symbol: splitSymbol[0],
        exchange: splitSymbol[1],
        close: current,
        high52: streamDataStore.fiftyTwoWeekHigh.raw,
        low52: streamDataStore.fiftyTwoWeekLow.raw,
        div: summaryDetail.dividendRate && summaryDetail.dividendRate.raw,
        yield: summaryDetail.dividendYield && summaryDetail.dividendYield.raw,
        peRatio: summaryDetail.trailingPE && summaryDetail.trailingPE.raw,
    };
}
