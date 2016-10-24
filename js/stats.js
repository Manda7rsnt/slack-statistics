// Slack Statistics
// Settings
var slackToken = "PASTE SLACK TOKEN HERE";

// Queries
var todayQuery = "on:today";
var yesterdayQuery = "on:yesterday";

// Pre-defined Variables
var userName = [],
    userMessage = [],
    userMessageCount = [],
    userMostTalkative = [], // ..[0] = username; ..[1] = # of messages
	userMessageCountPromise = [];

var userCount, teamName, todayCount, yesterdayCount, diffPercentage;

// Help Functions
function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getIndexOfMax(numArray) {
    return numArray.indexOf(getMaxOfArray(numArray));
}

// Data Function
function data(query, type, proc, index) {
    if (typeof index === 'undefined') {
        index = null;
    };
    return new Promise(function(resolve, reject) { // Returning a promise!
        var xhr = new XMLHttpRequest();
        switch (type) {
            case "search":
                xhr.open("GET", "https://slack.com/api/search.messages?token=" + slackToken + "&query=" + query, true); // make GET request
                break;
            case "users":
                xhr.open("GET", "https://slack.com/api/users.list?token=" + slackToken, true);
                break;
            case "info":
                xhr.open("GET", "https://slack.com/api/team.info?token=" + slackToken, true);
                break;
            default:
                reject({
                    ok: false,
                    error: "Invalid request"
                })
        };

        xhr.send();
        /*
         * Changed to a load listener in order to not have to check for ready state
         */
        xhr.addEventListener("load", processRequest, false); // when state change -> do processRequest

        function processRequest(e) {
            // No need to check readyState now
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText); // parse response
                if (!response.ok) {
                    reject(response); //Slack returns its error message with a 200 code
                    return;
                }
                switch (proc) {
                    case "teamName":
                        teamName = response.team.name;
                        resolve(); //Resolve promise
                        break;
                    case "todayCount":
                        todayCount = response.messages.total;
                        resolve(); //Resolve promise
                        break;
                    case "yesterdayCount":
                        yesterdayCount = response.messages.total;
                        resolve(); //Resolve promise
                        break;
                    case "userCount":
                        userCount = Object.keys(response.members).length - 1;
                        resolve(); //Resolve promise
                        break;
                    case "userMessageCount":
                        userMessageCount[index] = response.messages.total;
                        resolve(); //Resolve promise
                        break;
                    case "userList":
                        for (i = 0; i < userCount; i++) {
                            if (response.members[i].is_bot != true || response.members[i].profile.real_name != "slackbot") {
                                userName.push(response.members[i].profile.real_name); // Push real names to userName array
                                userMessage.push("from:" + response.members[i].name); // Push "from:username" to userMessage array
                                userMessageCountPromise.push(data(todayQuery + "+" + "from:" + response.members[i].name, "search", "userMessageCount", i)); // Get number of messages
                            } else {
                                return undefined;
                            };
                        };
                        resolve(); //Resolve promise
                        break;
                    default:
                        reject({
                            ok: false,
                            error: "Invalid request"
                        }); // Error on request and reject promise
                };
            } else {
                reject({
                    ok: false,
                    error: "Invalid response",
                    code: xhr.status
                }); //Error on response type and reject promise
            }
        };
    });
};

function getPercentage() {
    return new Promise(function(resolve, reject) {
        var difference = todayCount - yesterdayCount;
        var percentage = Math.round(difference / Number(yesterdayCount) * 100);
        diffPercentage = percentage;
        resolve();
    })
};


function getTalkativeUser() {
    return new Promise(function(resolve, reject) {
        Promise.all(userMessageCountPromise).then(() => {
            userMostTalkative[0] = userName[getIndexOfMax(userMessageCount)];
            userMostTalkative[1] = getMaxOfArray(userMessageCount);
            resolve();
        });
    })
};

function getData() {
    // Chain all the requests and console.log caught errors
    data(null, "info", "teamName")
        .then(() => data(todayQuery, "search", "todayCount"))
        .then(() => data(yesterdayQuery, "search", "yesterdayCount"))
        .then(() => data(null, "users", "userCount"))
        .then(() => data(null, "users", "userList"))
        .then(() => getPercentage())
        .then(() => getTalkativeUser())
        .then(() => postToHTML())
        .catch(error => console.log(error))
};

function postToHTML() {
    document.getElementById("title").innerHTML = 'Slack Statistics for "' + teamName + '"';
    document.getElementById("todayCounter").innerHTML = todayCount;
    document.getElementById("yesterdayCounter").innerHTML = yesterdayCount;

    if (diffPercentage >= 0) {
        document.getElementById("compare").innerHTML = "That's ~" + diffPercentage + "% messages more than yesterday!";
    } else {
        document.getElementById("compare").innerHTML = "That's ~" + Math.abs(diffPercentage) + "% messages less than yesterday!";
    };

    document.getElementById("mostTalkativeUser").innerHTML = userMostTalkative[0] + " with " + userMostTalkative[1] + " messages";
};

getData();
// All promises are now resolved in the getData function
