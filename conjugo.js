$(document).ready(function() {
    initialize();
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
}

function initialize(jQuery) {
    // Ignore clicks on button labels.
    $(".btn-group > .disabled").click(function(event) {
        // Immediately toggle this button from its active state.
        $(this).button("toggle");
        //event.preventDefault();
        event.stopPropagation();
        $("#verb-input").focus();
    });
    // Return focus to the text input after a button is clicked.
    $("div.btn-group > label.btn").click(function() {
        event.stopPropagation();
        $(this).button("toggle");
        $("#verb-input").focus();
    });
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
        if(event.keyCode == "13") {
            event.preventDefault();
            handleAnswer();
            next();
        }
    });
    $("#verb-input").keydown(function(event) {
        if(event.keyCode == "9") {
            // TAB inserts the verb stem.
            var partial = $("#verb-input").val();
            if(partial.length > 0 && partial.slice(-1) != " ") {
                // Add a space before the stem if necessary.
                partial += " ";
            }
            $("#verb-input").val(partial + verbStem);
            event.preventDefault();
        }
    });
    // Start a new session.
    startSession();
    // Get the first question.
    next();
    $("#verb-input").focus();
}

var correct, remaining, difficulty, sessionStart, sessionCount = 12;

function startSession() {
    $("#progress").css("width", "0%").attr('aria-valuenow', 0);
    remaining = sessionCount;
    sessionStart = new Date();
    difficulty = 0;
    correct = 0;
}

function updateSession(isCorrect, queryDifficulty) {
    remaining -= 1;
    difficulty += queryDifficulty;
    if(isCorrect) correct += 1;
    if(remaining > 0) {
        var progress = (100 * (sessionCount - remaining) / sessionCount).toFixed(2);
        $("#progress").css("width", progress + "%").attr("aria-valuenow", progress);
    }
    else {
        // End this session.
        var elapsed = (new Date() - sessionStart) / 1000;
        var accuracy = 100 * correct / sessionCount;
        var diff = 10 * difficulty / (6 * sessionCount);
        $("#speed").text("speed: " + elapsed.toFixed(1) + "s");
        $("#accuracy").text("accuracy: " + accuracy + "%");
        $("#difficulty").text("difficulty: " + diff.toFixed(0) + "/10");
        // Start a new session.
        startSession();
    }
}

function rint(n) {
    return Math.floor(n * Math.random());
}

function choose(a) {
    return a[rint(a.length)];
}

var queryTense = null;
var queryAnswer = null;
var queryAnswerNode = null;
var verbStem = null;
var queryTime = null;
var queryDifficulty = null;

function next() {
    // Pick a random verb that satisfies the selection criteria.
    var selected = false;
    var name, translation, pronoun;
    while(!selected) {
        var vidx = rint(nverb);
        var verb = conj[vidx];
        var info = verb["info"];
        queryDifficulty = 0;
        if(!info["com"]) {
            // Are uncommon verbs allowed?
            if($("#pococomunes-no").prop("checked")) continue;
            queryDifficulty += 2;
        }
        else {
            // Are common verbs allowed?
            if($("#pococomunes-only").prop("checked")) continue;
        }
        var name = info["name"];
        var ending = name.slice(-2);
        if(ending == "se") {
            // Are reflexive verbs allowed?
            if($("#reflexivos-no").prop("checked")) continue;
            ending = name.slice(-4);
            queryDifficulty += 1;
        }
        else {
            // Are non-reflexive verbs allowed?
            if($("#reflexivos-only").prop("checked")) continue;
        }
        verbStem = name.slice(0, -ending.length);
        translation = info["en"];
        // Pick a random pronoun.
        var pidx = rint(pron.length);
        var plist = pron[pidx];
        pronoun = choose(plist.split("/"));
        // Pick an active tense.
        var active = $(".tense > span.active");
        queryTense = $(choose(active));
        queryTense.addClass("query");
        var tidx = queryTense.data("tense");
        // Build the correct answer as a string and formatted content.
        var isRegular = true;
        queryAnswer = verb['conjs'];
        if(queryAnswer != "$") {
            queryAnswer = queryAnswer[tidx];
            if(queryAnswer != "*") {
                // This tense is not regular.
                queryAnswer = queryAnswer[pidx];
                if(queryAnswer != "*") {
                    // This pronoun is not regular.
                    isRegular = false;
                }
            }
        }
        if(isRegular) {
            // Are regular verbs allowed?
            if($("#irregularos-only").prop("checked")) continue;
            queryAnswer = regular[ending][tidx][pidx];
        }
        else {
            // Are irregular verbs allowed?
            if($("#irregularos-no").prop("checked")) continue;
            queryDifficulty += 3;
        }
        selected = true;
    }
    // Display the selected query.
    $("#verb-input").attr("placeholder", name);
    $("#translation").text(translation);
    $("#pronoun").text(pronoun);
    // Replace the stem in the answer, if necessary.
    if(queryAnswer.includes("_")) {
        var stemNode = $("<span />").append($("<span />").addClass("stem").html(verbStem));
        queryAnswerNode = $("<span />").html(queryAnswer.replace("_", stemNode.html()));
        queryAnswer = queryAnswer.replace("_", verbStem);
    }
    else {
        queryAnswerNode = $("<span />").html(queryAnswer);
    }
    queryAnswerNode.addClass(isRegular ? "regular" : "irregular");
}

function handleAnswer() {
    var solution = $("#verb-input").val();
    $("#answer1").removeClass("incorrect");
    var isCorrect = false;
    if(solution == "") {
        // No answer given.
        $("#answer1").html(queryAnswerNode);
        $("#answer2").html("");
    }
    else {
        if(solution == queryAnswer) {
            // Correct answer given.
            $("#answer1").html(queryAnswerNode);
            $("#answer2").html("");
            isCorrect = true;
        }
        else {
            // Incorrect answer given.
            $("#answer1").addClass("incorrect").text(solution);
            $("#answer2").html(queryAnswerNode);
        }
        $("#verb-input").val('');
    }
    queryTense.removeClass("query");
    updateSession(isCorrect, queryDifficulty);
}
