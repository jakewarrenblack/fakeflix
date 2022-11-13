const search = (query) => ({
    '$search': {
        'index': 'default',
        'text': {
            'query': query,
            'path': {
                'wildcard': '*'
            },
            'fuzzy': {
                // number of characters that can be changed to match the term
                'maxEdits': 1,
                // max number of variations on the search term to generate and search for
                'maxExpansions': 100
            }
        }
    },
})

const searchAndMatch = (query, filter) => ({
    '$search': {
        'index': 'default',
        'text': {
            'query': query,
            'path': {
                'wildcard': '*'
            },
            'fuzzy': {
                // number of characters that can be changed to match the term
                'maxEdits': 1,
                // max number of variations on the search term to generate and search for
                'maxExpansions': 100
            }
        }
    },
},
    {
        '$match': {
            // We have to spread the filter object to apply its individual attributes to the match
            ...filter
        }


    })

const searchPipeline = (request_value, filter) => (!filter ?
        search(request_value) : searchAndMatch(request_value, filter)
);

module.exports = searchPipeline