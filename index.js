const express = require('express');
const app = express();
const server = require('http').Server(app);
const request = require("request");
const cheerio = require("cheerio");
const fs = require('fs');

// Custom Dependencies
const CONFIG = require('./config.json');
const Tools = require('./server/tools');
const screenScrape = require('./server/screenScraper');
const roleCards = require('./server/role_cards/role_cards_core');
const Rand = require('./server/randing/randing_core');

const apiKeys = ["foo","bar","baz"];
const repos = [{name: "John"}];

app.use(express.json());

// Setting Routes
app.get("/", (req, res) => { res.sendFile(`${__dirname}/client/index.html`); });
app.get("/rolecard", (req, res) => { res.sendFile(`${__dirname}/client/rolecard/rolecard.html`) });
app.get("/replacement", (req, res) => { res.sendFile(`${__dirname}/client/replacement_form/replacement.html`) });
app.use('/', express.static(__dirname + `/client`));

app.use('/api', (req, res, next) => {
    let key = req.query['api-key'];
    if (!key) return next(error(400, "API Key Required"));
    if (!~apiKeys.indexOf(key)) return next(error(401, "Invalid API key"));
    req.key = key;
    next();
});
app.use('/api/users', (req, res, next) => {
    res.send(repos);
});

// Setting port and running server.
const PORT = process.env.PORT || 2000;
server.listen(PORT);
console.log(`Server Initialized. Port ${PORT}`);``

// Start SOCKET.IO
const io = require(`socket.io`)(server, {
    cors: {
        origin: '*'
    }
});
io.sockets.on('connection', (socket) => {
    socket.emit('connected', false);
    // Role Cards
    socket.on('parse-card', (data) => {
        let { block, globals, list } = data;

        console.log(typeof block);
        console.log(typeof globals);
        console.log(typeof list);

        let processed = [];
        for (const value of list) {
            processed.push(roleCards.lexer.parse({block, globals, value}));
        }
        socket.emit('parse-card', {list: processed});
    });
    socket.on("console", (data) => {console.log(data)});

    // Randing
    socket.on('rand', (data) => {
        let { list, players } = data;
        let randedArray = Rand.rand(players, list);
        socket.emit('rand', { rand: randedArray });
    });

    // Replacement Form
    socket.on('scrape-send', (data) => {
        var type = data.type;
        var link = data.link

        console.log(Tools.ScreenScraper.retrievePage(link));

        // request(link, (error, response, html) => {
        //     if (!error && response.statusCode == 200) {
        //         var results = {};
        //         const $ = cheerio.load(html);
        //         var header = $("h2").text();
        //         var pageNum = parseInt($("#jumpto1").val());
        //         var nextLink = $(".right-box.right").attr("href");
        //         var lastPage = $(".pagination").children("span").children("a:last-child").html();
        //         var firstPosterList = $(".postprofile dt a:first").text();
                
        //         results.header = header;
        //         results.author = firstPosterList;
        //         results.currentPage = pageNum;
        //         results.pageCount = lastPage;
        //         socket.emit("scrape-send", results);
        //     }
        //     else {
        //     }
        // });
    })
});