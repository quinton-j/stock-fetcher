// https://iextrading.com/developer/docs/#stocks
// doesn't support TSX :(

const _ = require('lodash');
const request = require('request-promise-lite');

exports.default = function fetchStocks(stocks) {
    stocks = stocks || [];

    if (!stocks || !stocks.length) {
        return Promise.resolve([]);
    } else {
        try {
            return Promise.all(_.map(stocks, getStock))
                .then(_.flatten)
                .catch(error => {
                    if(error.response && error.response.body) {
                        error.message = error.response.body.toString('utf8');
                    }
                    throw error;
                });
        } catch (error) {
            return Promise.reject(error);
        }
    }
};

const iexUrl = 'api.iextrading.com/1.0/stock/market/batch?types=quote&symbols=';
function getStock(stock) {
    if (!stock) {
        return Promise.reject('Empty stock name was passed.');
    } else {
        return request.get(iexUrl + stock, {
            json: false,
            resolveWithFullResponse: true,
        }).then(response => parseStock(response.body.toString()));
    }
}

function parseStock(body) {
    //remove garbage starting characters
    let newBody = body.replace('//', '');
    //remove mutual funds trailing commas
    let match = newBody.match(/morningstarcategory.*,/g);
    if(match) {
        newBody = newBody.replace(match[0], match[0].slice(0, -1));
    }
    match = newBody.match(/\],\n\s*}/gm);
    if(match) {
        const position = newBody.indexOf(match[0]);
        newBody = newBody.slice(0, position + 1) + newBody.slice(position + 2);
    }
    return JSON.parse(newBody);
}