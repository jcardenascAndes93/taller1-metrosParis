'use strict';

const Gatherer = require('lighthouse').Gatherer;

class TimeToAPI extends Gatherer {
    afterPass(options) {
        const driver = options.driver;

        return driver.evaluateAsync('window.cardAPITime')
            .then(cardAPITime => {
                if (!cardAPITime) {

                    throw new Error('Unable to find card load metrics in page');
                }
                return cardAPITime;
            });
    }
}

module.exports = TimeToAPI;