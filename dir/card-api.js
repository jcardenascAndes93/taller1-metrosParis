'use strict';

const Audit = require('lighthouse').Audit;

const MAX_CARD_TIME = 3000;

class APIAudit extends Audit {
    static get meta() {
        return {
            id: 'card-api',
            title: 'Cart audit api',
            category: 'MyPerformance',
            name: 'card-api',
            description: 'Schedule card with info retrieve from API',
            failureDescription: 'Schedule Card slow to initialize',
            helpText: 'Used to measure time from navigationStart to when the schedule' +
                ' card is shown.',
            requiredArtifacts: ['TimeToAPI']
        };
    }

    static audit(artifacts) {
        const loadedTime = artifacts.TimeToAPI;

        const belowThreshold = loadedTime < MAX_CARD_TIME;

        return {
            displayValue: loadedTime,
            score: Number(belowThreshold)
        };
    }
}

module.exports = APIAudit;