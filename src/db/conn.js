const mongoose = require('mongoose');

const uri = process.env.USER_DB_URI;

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true 
}

mongoose.connect(uri,connectionParams)
          .then( () => {
            console.log('Connected to the database ')
          })
          .catch( (err) => {
            console.error(`Error connecting to the database. n${err}`);
          })