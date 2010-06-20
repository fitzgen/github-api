(function (globals) {
    var
    // Create a local jQuery variable to play nice with noConflict and get a
    // slight speed up in variable lookup.
    $ = globals.jQuery,

    // Keep authentication variables private.
    username,
    token,

    // Expose global gh variable and keep a local variable.
    gh = globals.gh = {};

    gh.authenticate = function (un, t) {
        username = un;
        token = t;
        return this;
    };
}(window))