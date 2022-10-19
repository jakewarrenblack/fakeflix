
const readData = (req, res) => {
    res.status(200).json({
        "msg" : "All users retrieved"
    });
};

const readOne = (req, res) => {

    let id = req.params.id;

    // connect to db and retrieve user with :id

    res.status(200).json({
        "msg" : `You retrieved user with ID: ${id}`
    });
};

const createData = (req, res) => {
    console.log(req.body);
    let data = req.body;

    // connect to db, check if email exists, if yes respond with error
    // if some user info is missing, respond with error

    if(data.password.length < 6){
        res.status(422).json({
            "msg": "User password must be over 6 characters"
        });
    }
    else{
        data.id = 1;
        res.status(201).json({
            "msg": "All good",
            "data": data
        });
    }
    
};

const updateData = (req, res) => {

    let id = req.params.id;
    let data = req.body;
    
    // connect to db and retrieve user with :id
    // if user exists, validate the new user info, if all good update user

    data.id = id;

    res.status(200).json({
        "msg" : `You edited user with ID: ${id}`,
        "data" : data
    });
};

const deleteData = (req, res) => {

    let id = req.params.id;

    // connect to db and retrieve user with :id and delete them

    res.status(200).json({
        "msg" : `You deleted user with ID: ${id}`
    });
};

module.exports = {
    readData,
    readOne,
    createData,
    updateData,
    deleteData
};


