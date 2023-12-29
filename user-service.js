const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoDBConnectionString = process.env.MONGO_URL;

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        require: true,
    },
    email: {
        type:String,
        require: true,
        unique: true
    },
    password: {
        type:String,
        require: true,
    },
    favourites: {
        type: [String],
        require: false,
    },
    history: {
        type: [String],
        require: false,
    },
});

let User;
let db;

module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        db = mongoose.createConnection(mongoDBConnectionString);

        db.on('error', err => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {

        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }
        // Check if email is already registered
        User.findOne({ email: userData.email })
            .then(existingUser => {
                if (existingUser) {
                    reject("Email already registered");
                    return;
                }
                // Hash the password
                return bcrypt.hash(userData.password, 10);
            })
            .then(hash => {
                // Set the hashed password back to userData object
                userData.password = hash;

                // Insert the new user into the database
                return User.create({
                    userName: userData.userName,
                    email: userData.email,
                    password: userData.password,
                });
            })
            .then(userSaved => {
                console.log(`User ${userSaved.userName} has been added to the database.`);
                resolve("User " + userSaved.userName + " successfully registered");
            })
            .catch(err => {
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                    console.error(err);
                    reject("There was an error creating the user: " + err);
                }
            });
    });
};


module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {

        User.findOne({ userName: userData.userName })
            .exec()
            .then(user => {
                bcrypt.compare(userData.password, user.password).then(res => {
                    if (res === true) {
                        resolve(user);
                    } else {
                        reject("Incorrect password for user " + userData.userName);
                    }
                });
            }).catch(err => {
                reject("Unable to find user " + userData.userName);
            });
    });
};

module.exports.getUserName = function (id) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then(user => {
                resolve(user.userName);
            }).catch(err => {
                reject(`Unable to find user with id: ${id}`);
            });
    });
};

module.exports.getFavourites = function (id) {
    return new Promise(function (resolve, reject) {
        User.findById(id)
            .exec()
            .then(user => {
                resolve(user.favourites)
            }).catch(err => {
                reject(`Unable to get favourites for user with id: ${id}`);
            });
    });
}

module.exports.addFavourite = function (id, favId) {

    return new Promise(function (resolve, reject) {

        User.findById(id).exec().then(user => {
            if (user.favourites.length < 50) {
                User.findByIdAndUpdate(id,
                    { $addToSet: { favourites: favId } },
                    { new: true }
                ).exec()
                    .then(user => { resolve(user.favourites); })
                    .catch(err => { reject(`Unable to update favourites for user with id: ${id}`); })
            } else {
                reject(`Unable to update favourites for user with id: ${id}`);
            }

        })

    });


}

module.exports.removeFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        User.findByIdAndUpdate(id,
            { $pull: { favourites: favId } },
            { new: true }
        ).exec()
            .then(user => {
                resolve(user.favourites);
            })
            .catch(err => {
                reject(`Unable to update favourites for user with id: ${id}`);
            })
    });
}

module.exports.getHistory = function (id) {
    return new Promise(function (resolve, reject) {

        User.findById(id)
            .exec()
            .then(user => {
                resolve(user.history)
            }).catch(err => {
                reject(`Unable to get history for user with id: ${id}`);
            });
    });
}

module.exports.addHistory = function (id, historyId) {

    return new Promise(function (resolve, reject) {

        User.findById(id).exec().then(user => {
            if (user.favourites.length < 50) {
                User.findByIdAndUpdate(id,
                    { $addToSet: { history: historyId } },
                    { new: true }
                ).exec()
                    .then(user => { resolve(user.history); })
                    .catch(err => { reject(`Unable to update history for user with id: ${id}`); })
            } else {
                reject(`Unable to update history for user with id: ${id}`);
            }
        })
    });
}

module.exports.removeHistory = function (id, historyId) {
    return new Promise(function (resolve, reject) {
        User.findByIdAndUpdate(id,
            { $pull: { history: historyId } },
            { new: true }
        ).exec()
            .then(user => {
                resolve(user.history);
            })
            .catch(err => {
                reject(`Unable to update history for user with id: ${id}`);
            })
    });
}
