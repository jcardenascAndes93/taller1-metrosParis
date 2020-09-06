'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [            
            'dir/card-gatherer-api'
        ]
    }],

    audits: [        
        'dir/card-api'
    ],

    categories: {
        ratp_pwa: {
            name: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            auditRefs: [                
                { id: 'card-api', weight: 1 }
            ]
        }
    }
};
