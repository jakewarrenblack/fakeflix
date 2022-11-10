const verifyAuth = (response, filter) => {
    const values = [
        {"Maturity settings": filter.age_certification.$in.includes(response.age_certification)},
        {"Subscription type": filter.type.$regex === response.type}
    ]
        .filter((v) => Object.values(v)[0] === false)


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

module.exports = verifyAuth

