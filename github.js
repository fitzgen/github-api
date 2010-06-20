(function (globals) {
    var

    // Keep authentication variables private.
    auth_username,
    auth_token,

    api_root = "https://github.com/api/v2/json/",

    jsonp = function (url, callback, context) {
        var id = +new Date,
        script = document.createElement("script");

        gh.__jsonp_callbacks[id] = function () {
            delete gh.__jsonp_callbacks[id];
            callback.apply(context, arguments)
        };

        url += "?callback=" + encodeURIComponent("gh.__jsonp_callbacks["+ id +"]");
        if (auth_username && auth_token) {
            url += "&login=" + auth_username + "&auth_token=" + auth_token;
        }
        script.src = api_root + url;

        document.getElementsByTagName('head')[0].appendChild(script);
    },

    // Expose global gh variable and keep a local variable.
    gh = globals.gh = {};

    gh.__jsonp_callbacks = {};

    gh.authenticate = function (username, token) {
        auth_username = username;
        auth_token = token;
        return this;
    };

    gh.user = {};
    gh.user.search = function (query, callback, context) {
        jsonp("user/search/" + query, callback, context);
        return this;
    };
    gh.user.show = function (username, callback, context) {
        // The username argument is optional (defaults to the authenticated
        // user), so if it is missing, shift the arguments down.
        if (typeof username === "function") {
            context = arguments[1];
            callback = arguments[0];
            username = "";
        }
        jsonp("user/show/" + username, callback, context);
    };
}(window))