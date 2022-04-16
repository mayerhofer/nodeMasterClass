var fs = require('fs');

var router = require('./router');

var buildHeaderPage = function(parsedRequest) {
    var message = [];
    message.push(
        "<html>",
        "<head>",
        "<title>Parse HTTP Header exercise - Pirple - NodeJS Master Class</title>",
        "</head>",
        "<body>",
        "<h2>Hello World!</h2><BR>",
        "<p>Headers from request: " + JSON.stringify(parsedRequest.headers),
        "<p>Path from request: " + parsedRequest.trimmedPath,
        "<p>Method from request: " + parsedRequest.method,
        "<p>Request parameters: " + JSON.stringify(parsedRequest.parameters),
        "<p>Payload: " + parsedRequest.buffer,
        "<HR></body>",
        "</html>",
    );
    return message.join("");
}

var buildModulePage = function(parsedRequest, page) {
    var framedPage = [];
    framedPage.push(
        "<html><head></head><body>",
        "<frameset rows=\"20%,*\">",
        "<frame>",
        buildHeaderPage(parsedRequest),
        "</frame>",
        "<frame>",
        page,
        "</frame>",
        "</body></html>"
    );
    return framedPage.join("");
}

var buildMenuPage = function() {
    var page = [];
    page.push(
        "<html><head></head><body>",
        "Main page, no modules loaded.",
        "</body></html>"
    );
    return page.join("");
}

var buildErrorPage = function(err) {
    var page = [];
    page.push(
        "<html><head></head><body>",
        err ? err.name + ": " + err.message + "<BR><BR>" + err.stack : "Empty error, this is a bug! Bad developer, no tea and cookies for you!",
        "</body></html>"
    );
    return page.join("");
}

var select = function(serviceManager, endServiceCallback) {
    var parsedRequest = serviceManager.elements;
    var path = parsedRequest.trimmedPath;

    if (path) {
        // If path is defined, try bootstart identifyed module
        var firstSlashIndex = path.indexOf("/");
        var selectedModule = (firstSlashIndex >= 0 ? path.substring(0, firstSlashIndex) : path).toLowerCase();
        var content = "";

        // If route not found, choose default handler (404 - Not Found)
        var choosenModule = typeof(router[selectedModule]) == 'object' ? router[selectedModule] : router['default'];

        switch (selectedModule) {
            case 'module1':
                content = buildModulePage(parsedRequest, "Module 1 was called");
                endServiceCallback(serviceManager, content);
                break;
            default:
                content = buildErrorPage(new Error("No module selected"));
                endServiceCallback(serviceManager, content);
        }
    } else {
        // return main content
        endServiceCallback(serviceManager, buildModulePage(parsedRequest, buildMenuPage()));
    }
}

module.exports = select;
