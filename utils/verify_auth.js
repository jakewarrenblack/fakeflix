const compareFields = (response, filter, checkSubscriptionType = false) => {
    let values = [];
    // Remember, a child's default maturity settings will be the most restricted option
    // otherwise determined by the maturity settings User field

    // if !checkSubscriptionType, verify the user's subscription type
    if (checkSubscriptionType) {
        values = [
            {"Subscription type": filter.type.$regex === response?.type ? response[0]?.type : response?._doc?.type}
        ]
        // otherwise, just check if the maturity settings match up with the resource
        // e.g. a user might not want to see 18+ results
    } else {
        values = [{"Maturity settings": filter.age_certification.$in.includes(response?.age_certification)}]
    }


    values = values.filter((v) => Object.values(v)[0] === false)


    if (values.length) {
        let attrs = []
        // Return whichever one(s) failed, so we can notify the user
        // iterate over the objects
        for (value of values) {
            attrs.push(Object.keys(value)[0])
        }
        return attrs
    }
    // Otherwise don't return anything, all must be well
}

// used for when a request returning multiple results made,
// and some are authorised, others not, e.g. searching for 'batman' but subscribed only to shows
// shouldn't return 'batman returns', a movie, but should return 'batman the animated series'
const getAuthorisedResults = async (data, filter, checkSubscriptionType) => {
    if (data || data.length > 0) {

        let failing_fields = []
        let authorised_results = data.filter((result, i, data) => {
            // check if there are no invalid fields
            let unauthorised_fields = compareFields(result, filter, checkSubscriptionType)

            // if compareFields didn't return anything
            if (!(unauthorised_fields)) {
                return result;

                // if there are unauthorised fields in this result
            } else {
                // if we already know this field failed to return some result, don't bother pushing it
                if (!failing_fields.includes(unauthorised_fields[0])) {
                    failing_fields = unauthorised_fields
                }
            }
        })

        return {authorised_results, failing_fields}
    } else {
        return false;
    }
}

module.exports = {
    getAuthorisedResults,
    compareFields
}

