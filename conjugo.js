$(document).ready(function() {
    console.log("document loaded");
    initialize();
});

$(window).on( "load", function() {
    console.log("window loaded");
});

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

var queryTense = null;
var queryAnswer = null;

function next() {
    // Pick a random verb.
    var vidx = rint(nverb);
    var verb = conj[vidx];
    var info = verb["info"];
    var name = info["name"];
    var ending = name.slice(-2);
    if(ending == "se") {
        ending = name.slice(-4);
    }
    console.log("ending", ending);
    $("#verb-input").attr("placeholder", name);
    $("#translation").text(info["en"]);
    // Pick a random pronoun.
    var pidx = rint(pron.length);
    var plist = pron[pidx];
    p = choose(plist.split("/"));
    console.log('verb', vidx, p, info['name']);
    $("#pronoun").text(p);
    // Pick an active tense.
    var active = $(".tense > span.active");
    queryTense = $(choose(active));
    queryTense.addClass("query");
    var tidx = queryTense.data("tense");
    console.log("tense", tidx, queryTense.text());
    // Remember the correct answer.
    queryAnswer = verb['conjs'];
    if(queryAnswer == "$") {
        // All tenses of this verb are regular.
        queryAnswer = regular[ending][tidx][pidx];
    }
    else {
        queryAnswer = queryAnswer[tidx];
        if(queryAnswer == "*") {
            // This tense is regular.
            queryAnswer = regular[ending][tidx][pidx];
        }
        else {
            queryAnswer = queryAnswer[pidx];
            if(queryAnswer == "*") {
                // This pronoun is regular.
                queryAnswer = regular[ending][tidx][pidx];
            }
        }
    }
    console.log("answer", queryAnswer);
}

function handleAnswer() {
    var solution = $("#verb-input").val();
    if(solution != '') {
        $("#answer2").text(queryAnswer);
        $("#answer1").text(solution);
        $("#verb-input").val('');
    }
    queryTense.removeClass("query");
}
