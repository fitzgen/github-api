(function (globals) {
    var

    // Keep authentication variables private.
    authUsername,
    authToken,

    apiRoot = "https://github.com/api/v2/json/",

    jsonp = function (url, callback, context) {
        var id = +new Date,
        script = document.createElement("script");

        gh.__jsonp_callbacks[id] = function () {
            delete gh.__jsonp_callbacks[id];
            callback.apply(context, arguments)
        };

        url += "?callback=" + encodeURIComponent("gh.__jsonp_callbacks["+ id +"]");
        if (authUsername && authToken) {
            url += "&login=" + authUsername + "&authToken=" + authToken;
        }
        script.setAttribute("src", apiRoot + url);

        document.getElementsByTagName('head')[0].appendChild(script);
    },

    post = function (url, vals) {
        var
        form = document.createElement("form"),
        iframe = document.createElement("iframe"),
        doc = iframe.contentDocument !== undefined ?
            iframe.contentDocument :
            iframe.contentWindow.document;
        key, field;
        vals = vals || {};

        form.setAttribute("method", "post");
        form.setAttribute("action", apiRoot + url);
        for (key in vals) {
            if (vals.hasOwnProperty(key)) {
                field = document.createElement("input");
                field.type = "hidden";
                field.value = encodeURIComponent(vals[key]);
                form.appendChild(field);
            }
        }

        iframe.setAttribute("style", "display: none;");
        doc.body.appendChild(form);
        document.body.appendChild(iframe);
        form.submit();
    },

    authRequired = function (username) {
        if (!authUsername || !authToken || authUsername !== username) {
            throw new TypeError("gh: Must be authenticated to do that.");
        }
    },

    paramify = function (params) {
        var str = "", key;
        for (key in params) if (params.hasOwnProperty(key))
            str += key + "=" + params[key] + "&";
        return str.replace(/&$/, "");
    },

    // Expose global gh variable and keep a local variable.
    gh = globals.gh = {};

    gh.__jsonp_callbacks = {};

    gh.authenticate = function (username, token) {
        authUsername = username;
        authToken = token;
        return this;
    };

    /*
     * Users
     */

    gh.user = function (username) {
        if ( !(this instanceof gh.user)) {
            return new gh.user(username);
        }
        this.username = username;
    };
    gh.user.prototype.show = function (callback, context) {
        jsonp("user/show/" + this.username, callback, context);
        return this;
    };
    gh.user.prototype.update = function (params) {
        authRequired(this.username);
        var key, postData = {
            login: authUsername,
            token: authToken
        };
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData["values["+key+"]"] = encodeURIComponent(params[key]);
            }
        }
        post("user/show/" + this.username, postData);
        return this;
    };
    gh.user.prototype.following = function (callback, context) {
        jsonp("user/show/" + this.username + "/following", callback, context);
    };
    gh.user.prototype.followers = function (callback, context) {
        jsonp("user/show/" + this.username + "/followers", callback, context);
    };
    gh.user.prototype.follow = function (user) {
        authRequired.call(this);
        post("user/follow/" + user);
        return this;
    };
    gh.user.prototype.unfollow = function (user) {
        authRequired.call(this);
        post("user/unfollow/" + user);
        return this;
    };
    gh.user.prototype.watching = function (callback, context) {
        jsonp("repos/watched/" + this.username, callback, context);
        return this;
    };
    gh.user.prototype.repos = function (callback, context) {
        gh.repo.forUser(this.username, callback, context);
        return this;
    };
    gh.user.prototype.forkRepo = function (user, repo) {
        authRequired(this.username);
        post("repos/fork/" + user + "/" + repo);
        return this;
    };

    gh.user.search = function (query, callback, context) {
        jsonp("user/search/" + query, callback, context);
        return this;
    };

    /*
     * Repositories
     */

    gh.repo = function (user, repo) {
        if ( !(this instanceof gh.repo)) {
            return new gh.repo(user, repo);
        }
        this.repo = repo;
        this.user = user;
    };
    gh.repo.prototype.show = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo, callback, context);
        return this;
    };
    gh.repo.prototype.update = function (params) {
        authRequired(this.user);
        var key, postData = {
            login: authUsername,
            token: authToken
        };
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData["values["+key+"]"] = encodeURIComponent(params[key]);
            }
        }
        post("repos/show/" + this.user + "/" + this.repo, postData);
        return this;
    };
    // TODO: visibility, collaborators, contributors, network, languages, tags, branches

    gh.repo.search = function (query, opts, callback, context) {
        var url = "repos/search/" + query.replace(" ", "+");
        if (typeof opts === "function") {
            opts = {};
            callback = arguments[1];
            context = arguments[2];
        }
        url += "?" + paramify(opts);
        return this;
    };
    gh.repo.forUser = function (user, callback, context) {
        jsonp("repos/show/" + user, callback, context);
        return this;
    };
    gh.repo.create = function (name, opts) {
        authRequired(authUsername);
        opts.name = name;
        post("repos/create", opts);
        return this;
    };
    gh.repo.del = function (name) {
        authRequired(authUsername);
        post("repos/delete/" + name);
        return this;
    };

}(window));