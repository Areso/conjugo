$(document).ready(function() {
    console.log("document loaded");
    initialize();
});

$(window).on( "load", function() {
    console.log("window loaded");
});

function initialize(jQuery) {
    // Implement toggling tenses on/off.
    $(".tense > span").click(function() {
        var self = $(this);
        var nactive = $(".tense > span.active").length;
        // Cannot make last active tense inactive.
        if(nactive > 1 || !self.hasClass("active")) {
            $(this).toggleClass("active");
        }
        // Always return focus to the text input.
        $("#verb-input").focus();
    });
    // Handle typed input.
    $("#verb-input").keypress(function(event) {
        console.log('key', event.which, event.keyCode);
        if(event.keyCode == "13") {
            console.log("RETURN");
            event.preventDefault();
            handleAnswer();
            next();
        }
    });
    $("#verb-input").keydown(function(event) {
        if(event.keyCode == "9") {
            console.log("TAB");
            event.preventDefault();
        }
    });
    // Get the first question.
    next();
    $("#verb-input").focus();
}

function rint(n) {
    return Math.floor(n * Math.random());
}

function choose(a) {
    return a[rint(a.length)];
}

function next() {
    // Pick a random verb.
    vidx = rint(nverb);
    verb = conj[vidx];
    info = verb['info'];
    conjs = verb['conjs'];
    $("#verb-input").attr("placeholder", info["name"]);
    $("#translation").text(info["en"]);
    // Pick a random pronoun.
    plist = choose(pron);
    p = choose(plist.split("/"));
    console.log('verb', vidx, p, info['name']);
    $("#pronoun").text(p);
    // Pick an active tense.
    var active = $(".tense > span.active");
    var tense = $(choose(active));
    var tidx = tense.data("tense");
    console.log("tense", tidx, tense.text());
}

var nverb = 0;
var pron = null;
var conj = null;
var regular = null;

function initData(cdata) {
    pron = cdata["pronouns"];
    conj = cdata["conjugations"];
    regular = cdata["regular"];
    nverb = Object.keys(conj).length;
    console.log("loaded " + nverb + " verbs.");
}

function handleAnswer() {
    var solution = $("#verb-input").val();
    if(solution != '') {
        $("#answer1").text(solution);
        $("#verb-input").val('');
    }
}