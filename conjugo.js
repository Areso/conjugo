$(document).ready(function() {
    initialize();
});

var nverb = 0;
var pron = null;
var conj = null;
var regular = null;
var sessionData = null;

function initData(cdata) {
    pron = cdata["pronouns"];
    conj = cdata["conjugations"];
    regular = cdata["regular"];
    nverb = Object.keys(conj).length;
}

function initialize(jQuery) {
    // Lookup data from a previous session.
    sessionData = localStorage.getItem("sessionData");
    if(!sessionData) {
        console.log("init sessionData");
        sessionData = {
            "nsessions": 0
        };
    }
    else {
        sessionData = JSON.parse(sessionData);
    }
    console.log("sessionData:", sessionData);
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
        if(sessionStart == null) {
            // Start session timer after first keystroke.
            sessionStart = new Date();
            console.log("start at", sessionStart);
        }
        if(event.keyCode == "13") {
            event.preventDefault();
            handleAnswer();
            next();
        }
    });
    $("#verb-input").keydown(function(event) {
        if(event.keyCode == "9") {
            if(!hintGiven) {
                // The first TAB displays the verb infinitive.
                $("#verb-input").attr("placeholder", verbInfinitive);
                $("#verb-input").val("");
                // Penalize the difficulty for using this hint.
                queryDifficulty = 0;
                hintGiven = true;
            }
            else {
                // A second TAB appends the verb stem to the current input.
                var partial = $("#verb-input").val();
                if(partial.length > 0 && partial.slice(-1) != " ") {
                    // Add a space before the stem if necessary.
                    partial += " ";
                }
                $("#verb-input").val(partial + verbStem);
            }
            event.preventDefault();
        }
    });
    // Initialize the chart.
    initChart();
    // Start a new session.
    startSession();
    // Get the first question.
    next();
    $("#verb-input").focus();
}

function initChart() {
    // Build a database of verb properties.
}

var correct, remaining, sessionDifficulty, sessionStart, numSessionQueries = 12;

function startSession() {
    $("#progress").css("width", "0%").attr('aria-valuenow', 0);
    remaining = numSessionQueries;
    sessionStart = null; // wait until first keystroke to start session
    sessionDifficulty = 0;
    correct = 0;
}

function updateSession(isCorrect, queryDifficulty) {
    // Parameters:
    //   isCorrect (bool): is the most recent query answer correct?
    //   queryDifficulty (number): value 0-1.
    remaining -= 1;
    sessionDifficulty += queryDifficulty;
    if(isCorrect) correct += 1;
    if(remaining > 0) {
        var progress = (100 * (numSessionQueries - remaining) / numSessionQueries).toFixed(2);
        $("#progress").css("width", progress + "%").attr("aria-valuenow", progress);
    }
    else {
        // End this session.
        var elapsed = (new Date() - sessionStart) / 1000;
        var accuracy = 100 * correct / numSessionQueries;
        var diff = Math.round(10 * sessionDifficulty / numSessionQueries);
        $("#speed").text("speed: " + elapsed.toFixed(1) + "s");
        $("#accuracy").text("accuracy: " + accuracy.toFixed(0) + "%");
        $("#difficulty").text("difficulty: " + diff.toFixed(0) + "/10");
        // Save session data.
        sessionData.nsessions += 1;
        console.log("storing:", sessionData);
        localStorage.setItem("sessionData", JSON.stringify(sessionData));
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
var verbInfinitive = null;
var hintGiven = false;
var verbStem = null;
var queryTime = null;
var queryDifficulty = null;

function next() {
    // Pick a random verb that satisfies the selection criteria.
    var selected = false;
    var translation, pronoun;
    var isUncommon, isReflexive, isIrregular;
    while(!selected) {
        var vidx = rint(nverb);
        var verb = conj[vidx];
        var info = verb["info"];
        if(!info["com"]) {
            // Are uncommon verbs allowed?
            if($("#pococomunes-no").prop("checked")) continue;
            isUncommon = true;
        }
        else {
            // Are common verbs allowed?
            if($("#pococomunes-only").prop("checked")) continue;
            isUncommon = false;
        }
        verbInfinitive = info["name"];
        var ending = verbInfinitive.slice(-2);
        if(ending == "se") {
            // Are reflexive verbs allowed?
            if($("#reflexivos-no").prop("checked")) continue;
            ending = verbInfinitive.slice(-4);
            isReflexive = true;
        }
        else {
            // Are non-reflexive verbs allowed?
            if($("#reflexivos-only").prop("checked")) continue;
            isReflexive = false;
        }
        verbStem = verbInfinitive.slice(0, -ending.length);
        translation = info["en"];
        // Pick a random pronoun.
        var pidx = rint(pron.length);
        var plist = pron[pidx];
        pronoun = choose(plist.split("/"));
        // Pick an active tense.
        var active = $(".tense > span.active");
        queryTense = $(choose(active));
        var tidx = queryTense.data("tense");
        // Build the correct answer as a string and formatted content.
        var isIrregular = false;
        queryAnswer = verb['conjs'];
        if(queryAnswer != "$") {
            queryAnswer = queryAnswer[tidx];
            if(queryAnswer != "*") {
                // This tense is not regular.
                queryAnswer = queryAnswer[pidx];
                if(queryAnswer != "*") {
                    // This pronoun is not regular.
                    isIrregular = true;
                }
            }
        }
        if(isIrregular) {
            // Are irregular verbs allowed?
            if($("#irregularos-no").prop("checked")) continue;
        }
        else {
            // Are regular verbs allowed?
            if($("#irregularos-only").prop("checked")) continue;
            queryAnswer = regular[ending][tidx][pidx];
        }
        selected = true;
    }
    // Display the selected query.
    queryTense.addClass("query");
    $("#verb-input").attr("placeholder", "TAB for infinitive");
    hintGiven = false;
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
    queryAnswerNode.addClass(isIrregular ? "irregular" : "regular");
    // Append details of what was asked in this query.
    queryAnswerNode = $("<span />").append(queryAnswerNode).append(
        $("<span />").html("&emsp;[" + pronoun + " + " + verbInfinitive +
        " &rarr; " + queryTense.text() + "]").addClass("details"));
    // Calculate this query's difficulty 0-1 based on (isUncommon, isReflexive, isIrregular).
    // The base value (0.3) is subtracted if TAB is used to reveal the infinitive.
    queryDifficulty = 0.3;
    if(isIrregular) queryDifficulty += 0.4;
    if(isUncommon) queryDifficulty += 0.2;
    if(isReflexive) queryDifficulty += 0.1;
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
