(function (globals) {
    var

    // Keep authentication variables private.
    authUsername,
    authToken,

    // Always using JSON because it is the only way to leverage JSONP.
    apiRoot = "https://github.com/api/v2/json/",

    // Send a JSONP request to the Github API that calls `callback` with
    // `context` as `this`.
    jsonp = function (url, callback, context) {
        var id = +new Date,
        script = document.createElement("script");

        gh.__jsonp_callbacks[id] = function () {
            delete gh.__jsonp_callbacks[id];
            callback.apply(context, arguments);
        };

        url += "?callback=" + encodeURIComponent("gh.__jsonp_callbacks["+ id +"]");
        if (authUsername && authToken) {
            url += "&login=" + authUsername + "&authToken=" + authToken;
        }
        script.setAttribute("src", apiRoot + url);

        document.getElementsByTagName('head')[0].appendChild(script);
    },

    // Send an HTTP POST. Unfortunately, it isn't possible to support a callback
    // with the resulting data. (Please prove me wrong!)
    post = function (url, vals) {
        var
        form = document.createElement("form"),
        iframe = document.createElement("iframe"),
        doc = iframe.contentDocument !== undefined ?
            iframe.contentDocument :
            iframe.contentWindow.document,
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

    // Throw a TypeError if the user is not authenticated properly.
    authRequired = function (username) {
        if (!authUsername || !authToken || authUsername !== username) {
            throw new TypeError("gh: Must be authenticated to do that.");
        }
    },

    // Convert an object to a url parameter string, e.g. {foo:1, bar:3} ->
    // "foo=1&bar=3".
    paramify = function (params) {
        var str = "", key;
        for (key in params) if (params.hasOwnProperty(key))
            str += key + "=" + params[key] + "&";
        return str.replace(/&$/, "");
    },

    // Get around how the GH team haven't migrated all the API to version 2, and
    // how gists use a different api root.
    withTempApiRoot = function (tempApiRoot, fn) {
        return function () {
            var oldRoot = apiRoot;
            apiRoot = tempApiRoot;
            fn.apply(this, arguments);
            apiRoot = oldRoot;
        };
    },

    // Expose global gh variable and keep a local variable.
    gh = globals.gh = {};

    // Psuedo private home for JSONP callbacks (which are required to be global
    // by the nature of JSONP).
    gh.__jsonp_callbacks = {};

    // Authenticate a user. Does not try to validate at any point.
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

    // Show basic user info. More info if authenticated.
    gh.user.prototype.show = function (callback, context) {
        jsonp("user/show/" + this.username, callback, context);
        return this;
    };

    // Update user info. Must be authenticated as this user.
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

    // Find out who this user is following.
    gh.user.prototype.following = function (callback, context) {
        jsonp("user/show/" + this.username + "/following", callback, context);
    };

    // Find out who is following this user.
    gh.user.prototype.followers = function (callback, context) {
        jsonp("user/show/" + this.username + "/followers", callback, context);
    };

    // Make this user follow some other user. Must be authenticated as this
    // user.
    gh.user.prototype.follow = function (user) {
        authRequired.call(this);
        post("user/follow/" + user);
        return this;
    };

    // Quit following the given user. Must be authenticated as this user.
    gh.user.prototype.unfollow = function (user) {
        authRequired.call(this);
        post("user/unfollow/" + user);
        return this;
    };

    // Find out who this user is watching.
    gh.user.prototype.watching = function (callback, context) {
        jsonp("repos/watched/" + this.username, callback, context);
        return this;
    };

    // Find out what repos this user has.
    gh.user.prototype.repos = function (callback, context) {
        gh.repo.forUser(this.username, callback, context);
        return this;
    };

    // Fork the repo that lives at http://github.com/user/repo. Must be
    // authenticated.
    gh.user.prototype.forkRepo = function (user, repo) {
        authRequired(this.username);
        post("repos/fork/" + user + "/" + repo);
        return this;
    };

    // Get a list of all repos that this user can push to (including ones that
    // they are just a collaborator on, and do not own. Must be authenticated.
    gh.user.prototype.pushable = function (callback, context) {
        authRequired(authUsername);
        jsonp("repos/pushable", callback, context);
    };

    // Search users for `query`.
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

    // Get information on this repo.
    gh.repo.prototype.show = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo, callback, context);
        return this;
    };

    // Update information on this repo. Must be authenticated. Params can include:
    //   * description
    //   * homepage
    //   * has_wiki
    //   * has_issues
    //   * has_downloads
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

    // Get all tags in this repo.
    gh.repo.prototype.tags = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/tags",
              callback,
              context);
        return this;
    };

    // Get all branches in this repo.
    gh.repo.prototype.branches = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/branches",
              callback,
              context);
        return this;
    };

    // Gather line count information on the language(s) used in this repo.
    gh.repo.prototype.languages = function (callback, context) {
        jsonp("/repos/show/" + this.user + "/" + this.repo + "/languages",
              callback,
              context);
        return this;
    };

    // Gather data on all the forks of this repo.
    gh.repo.prototype.network = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/network",
              callback,
              context);
        return this;
    };

    // All users who have contributed to this repo. Pass true to showAnon if you
    // want to see the non-github contributors.
    gh.repo.prototype.contributors = function (callback, context, showAnon) {
        var url = "repos/show/" + this.user + "/" + this.repo + "/contributors";
        if (showAnon)
            url += "/anon";
        jsonp(url,
              callback,
              context);
        return this;
    };

    // Get all of the collaborators for this repo.
    gh.repo.prototype.collaborators = function (callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/collaborators",
              callback,
              context);
        return this;
    };

    // Add a collaborator to this project. Must be authenticated.
    gh.repo.prototype.addCollaborator = function (collaborator) {
        authRequired(this.user);
        post("repos/collaborators/" + this.repo + "/add/" + collaborator);
        return this;
    };

    // Remove a collaborator from this project. Must be authenticated.
    gh.repo.prototype.removeCollaborator = function (collaborator) {
        authRequired(this.user);
        post("repos/collaborators/" + this.repo + "/remove/" + collaborator);
        return this;
    };

    // Make this repository private. Authentication required.
    gh.repo.prototype.setPrivate = function () {
        authRequired(this.user);
        post("repo/set/private/" + this.repo);
        return this;
    };

    // Make this repository public. Authentication required.
    gh.repo.prototype.setPublic = function () {
        authRequired(this.user);
        post("repo/set/public/" + this.repo);
        return this;
    };

    // Search for repositories. `opts` may include `start_page` or `language`,
    // which must be capitalized.
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

    // Get all the repos that are owned by `user`.
    gh.repo.forUser = function (user, callback, context) {
        jsonp("repos/show/" + user, callback, context);
        return this;
    };

    // Create a repository. Must be authenticated.
    gh.repo.create = function (name, opts) {
        authRequired(authUsername);
        opts.name = name;
        post("repos/create", opts);
        return this;
    };

    // Delete a repository. Must be authenticated.
    gh.repo.del = function (name) {
        authRequired(authUsername);
        post("repos/delete/" + name);
        return this;
    };

    /*
     * Commits
     */

    gh.commit = function (user, repo, sha) {
        if ( !(this instanceof gh.commit) )
            return new gh.commit(user, repo, sha);
        this.user = user;
        this.repo = repo;
        this.sha = sha;
    };

    gh.commit.prototype.show = function (callback, context) {
        jsonp("commits/show/" + this.user + "/" + this.repo + "/" + this.sha,
              callback,
              context);
        return this;
    };

    // Get a list of all commits on a repos branch.
    gh.commit.forBranch = function (user, repo, branch, callback, context) {
        jsonp("commits/list/" + user + "/" + repo + "/" + branch,
              callback,
              context);
        return this;
    };

    // Get a list of all commits on this path (file or dir).
    gh.commit.forPath = function (user, repo, branch, path, callback, context) {
        jsonp("commits/list/" + user + "/" + repo + "/" + branch + "/" + path,
              callback,
              context);
        return this;
    };

    /*
     * Issues
     */

    gh.issue = function (user, repo, number) {
        if ( !(this instanceof gh.issue) )
            return new gh.commit(user, repo, number);
        this.user = user;
        this.repo = repo;
        this.number = number;
    };

    // View this issue's info.
    gh.issue.prototype.show = function (callback, context) {
        jsonp("issues/show/" + this.user + "/" + this.repo + "/" + this.number,
              callback,
              context);
        return this;
    };

    // Get a list of all comments on this issue.
    gh.issue.prototype.comments = function (callback, context) {
        jsonp("issues/comments/" + this.user + "/" + this.repo + "/" + this.number,
              callback,
              context);
        return this;
    };

    // Close this issue.
    gh.issue.prototype.close = function () {
        authRequired(this.user);
        post("issues/close/" + this.user + "/" + this.repo + "/" + this.number);
        return this;
    };

    // Reopen this issue.
    gh.issue.prototype.reopen = function () {
        authRequired(this.user);
        post("issues/reopen/" + this.user + "/" + this.repo + "/" + this.number);
        return this;
    };

    // Reopen this issue.
    gh.issue.prototype.update = function (title, body) {
        authRequired(this.user);
        post("issues/edit/" + this.user + "/" + this.repo + "/" + this.number, {
            title: title,
            body: body
        });
        return this;
    };

    // Add `label` to this issue. If the label is not yet in the system, it will
    // be created.
    gh.issue.prototype.addLabel = function (label) {
        post("issues/label/add/" + this.user + "/" + this.repo + "/" + label + "/" + this.number);
        return this;
    };

    // Remove a label from this issue.
    gh.issue.prototype.removeLabel = function (label) {
        post("issues/label/remove/" + this.user + "/" + this.repo + "/" + label + "/" + this.number);
        return this;
    };

    // Comment on this issue as the user that is authenticated.
    gh.issue.prototype.comment = function (comment) {
        authRequired(authUsername);
        post("/issues/comment/" + user + "/" + repo + "/" + this.number, {
            comment: comment
        });
        return this;
    };

    // Get all issues' labels for the repo.
    gh.issue.labels = function (user, repo) {
        jsonp("issues/labels/" + user + "/" + repo,
              callback,
              context);
        return this;
    };

    // Open an issue. Must be authenticated.
    gh.issue.open = function (repo, title, body) {
        authRequired(authUsername);
        post("issues/open/" + authUsername + "/" + repo, {
            title: title,
            body: body
        });
        return this;
    };

    // Search a repository's issue tracker. `state` can be "open" or "closed".
    gh.issue.search = function (user, repo, state, query, callback, context) {
        jsonp("/issues/search/" + user + "/" + repo + "/" + state + "/" + query,
              callback,
              context);
        return this;
    };

    // Get a list of issues for the given repo. `state` can be "open" or
    // "closed".
    gh.issue.list = function (user, repo, state, callback, context) {
        jsonp("issues/list/" + user + "/" + repo + "/" + state,
              callback,
              context);
        return this;
    };

}(window));