require('dotenv').config();
const mongoose = require('mongoose');
const { app, server } = require('./api/serverManager');

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log('Connected to MongoDB database'));
const port = process.env.PORT || 5000;

(async () => {
    require('./api/restManager').attach(app);
    require('./api/websocketManager').attach(server);
    await require('./test.js')();
    server.listen(port, () => {
        console.log(`Server Start. [PORT=${port}]`);
    });
})();
