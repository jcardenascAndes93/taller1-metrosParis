'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [
            'dir/card-gatherer',
            'dir/card-gatherer-api'
        ]
    }],

    audits: [
        'dir/card-audit',
        'dir/card-api'
    ],

    categories: {
        ratp_pwa: {
            name: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            auditRefs: [
                { id: 'card-audit', weight: 1 },
                { id: 'card-api', weight: 1 }
            ]
        }
    }
};