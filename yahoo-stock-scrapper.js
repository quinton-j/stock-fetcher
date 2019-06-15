
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
    const stockData = json.context.dispatcher.stores.QuoteSummaryStore;
    const summaryDetail = stockData.summaryDetail;

    const current = stockData.price.regularMarketPrice.raw;
    const stockYield = summaryDetail.yield && summaryDetail.yield.raw;

    return {
        symbol: splitSymbol[0],
        exchange: splitSymbol[1],
        close: current,
        high52: summaryDetail.fiftyTwoWeekHigh && summaryDetail.fiftyTwoWeekHigh.raw,
        low52: summaryDetail.fiftyTwoWeekLow &&  summaryDetail.fiftyTwoWeekLow.raw,
        div: stockYield ? stockYield * current : (summaryDetail.dividendRate && summaryDetail.dividendRate.raw),
        yield: stockYield ? stockYield : (summaryDetail.dividendYield && summaryDetail.dividendYield.raw),
        peRatio: !summaryDetail.trailingPE ? null : summaryDetail.trailingPE.raw,
    };
}
