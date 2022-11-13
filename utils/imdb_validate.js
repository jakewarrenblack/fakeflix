// Regular expression source: https://www.wikidata.org/wiki/Property_talk:P345 (See 'Allowed attributes')
let imdb_pattern = new RegExp(/ev\d{7}\/\d{4}(-\d)?|(ch|co|ev|nm|tt)\d{7}/)

const validate_imdb_id = (id) => {
    return imdb_pattern.test(id)
}

module.exports = validate_imdb_id