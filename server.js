//Создаём web-server, который возвращает файл пользователю
//из дирректории public
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');

var ROOT = __dirname + "\\public";

http.createServer(function (req, res) {

    if (!checkAccess(req)) {
        res.statusCode = 403;
        res.end("Tell me the secret to access!");
        return;
    }

    sendFileSave(url.parse(req.url).pathname, res);

}).listen(3000);

function checkAccess(req) {
    return url.parse(req.url, true).query.secret = 'o_O'
}

//function sendFileSave принимает путь от юзера,
//в нашем случае(pathname) и отсылает соответствующий файл
//из дирректории public, учитывая поддирректории
function sendFileSave(filePath, res) {

    try {
        filePath = decodeURIComponent(filePath);//Декодируем url
    } catch (e) {
        res.statusCode = 400;
        res.end("Bad Request");
        return;
    }

    //Проверка на наличие нулевого байта, который в строке присутствовать не должен
    //если он есть - это значит, что кто-то злонамеренно его передал и
    //некоторые встроенные функции с таким байтом будут работать не корректно,
    //если байт есть - то ошибка(запрос не корректен)
    if (~filePath.indexOf('\0')) {
        res.statusCode = 400;
        res.end("Bad Request");
        return;
    }

    //Модуль path позволяет нам получить полный путь к файлу на диске
    //.join - объеденяет пути
    //.normalize - удаляет с пути разные ., .., // - делает путь более корректным

    //url, который передал uset выглядит:
    // /deep/nodejs.jpg

    filePath = path.normalize(path.join(ROOT, filePath));

    //url, который передал uset ПОСЛЕ path.join(ROOT, filePath выглядит:
    // C:\Users\user\WebstormProjects\path\public\deep\nodejs.jpg

    if (filePath.indexOf(ROOT) != 0) {//Проверка на путь, что он начинается с ROOT, т.е с (C:\Users\user\WebstormProjects\path\public)
        res.statusCode = 404;
        res.end("File not found " + filePath);
        return;
    }

    fs.stat(filePath, function (err, stats) {//Проверка на наличие пути и нахождения чего-либо в этом пути(например: файл)
        if (err || !stats.isFile()) {//Если ничего нет -> err, также проверить файл ли это !stats.isFile()
            res.statusCode = 404;
            res.end("File not found");
            return;
        }
        //Если это файл, то отсылаем его
        sendFile(filePath, res);
    })

}

function sendFile(filePath, res) {
    fs.readFile(filePath, function (err, content) {//Как только файл будет прочитан
        if (err) throw err;

        //Модуль mime определяет нужный тип файла по расширению
        var mime = require('mime').lookup(filePath);// npm install mime
        res.setHeader('Content-type', mime + "; charset=utf-8");//Различные файлы должны снабжаться различными заголовками
        //Например:
        //html файл должен иметь тип text/html
        //файл с картинкой должен иметь тип image/jpeg
        res.end(content);//Выведем содержимое, прочитанного файла
    })
}