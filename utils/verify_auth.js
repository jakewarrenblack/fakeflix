const compareFields = (response, filter, checkSubscriptionType = false) => {
    let values = [];
    // Remember, a child's default maturity settings will be the most restricted option
    // otherwise determined by the maturity settings User field

    // if !checkSubscriptionType, verify the user's subscription type
    if (checkSubscriptionType) {
        values = [
            {"Subscription type": filter.type.$regex === response.type}
        ]
        // otherwise, just check if the maturity settings match up with the resource
        // e.g. a user might not want to see 18+ results
    } else {
        values = [{"Maturity settings": filter.age_certification.$in.includes(response.age_certification)}]
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

module.exports = compareFields

