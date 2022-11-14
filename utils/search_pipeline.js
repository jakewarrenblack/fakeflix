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

const searchAndMatch = (query, filter) => [{
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


    }]

const searchMatchSort = (query, filter, sort, direction) => [{
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
        },

    },
    {
        "$sort": {
            sort: direction === 'asc' ? 1 : -1
        }
    }]


const searchPipeline = (request_value, filter, sort, direction) => {
    let args = [request_value, filter, sort, direction]
    let res;

    if (sort && direction) {
        res = searchMatchSort(...args)
    } else if (filter) {
        res = searchAndMatch(...args)
    } else {
        res = search(request_value)
    }

    return res;
}


module.exports = searchPipeline