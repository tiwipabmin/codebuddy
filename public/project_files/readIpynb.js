var markdown = require("markdown").markdown;
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const fs = require("fs");

data = fs.readFileSync("test.ipynb", "utf8");

var obj = JSON.parse(data);
// // console.log(obj)
var cells = obj["cells"];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/read.html");
});

http.listen(3000, function() {});

//possible EventEmitter memory leak detected
require("events").EventEmitter.prototype._maxListeners = 50;

for (x in cells) {
  console.log("---------Cells  [" + x + "]----------");
  if (cells[x]["cell_type"] == "markdown") {
    for (y in cells[x]["source"]) {
      console.log(markdown.toHTML(cells[x]["source"][y]));
      let markdowns = markdown.toHTML(cells[x]["source"][y]);

      // send html syntax to html file
      io.on("connect", socket => {
        io.emit("markdown", markdowns);
      });
    }
  } else {
    for (y in cells[x]["source"]) {
      console.log(cells[x]["source"][y]);
      let code = cells[x]["source"][y];
      io.on("connect", socket => {
        io.emit("code", code);
      });
    }
  }
}
