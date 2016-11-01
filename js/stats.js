/**
 * File: Primary JavaScript for Slack Statistics (stats.js)
 *
 * Details:  Makes requests to Slack API and processes that info to display
 * to users.  This script makes use of Javascript Promises to handle successful
 * and failed calls to the API. Information about promises can be found here
 * https://developers.google.com/web/fundamentals/getting-started/primers/promises.
 * The Fetch API is also used in place of XMLHttpRequest. Information on that
 * can be found at https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API.
 *
 */

// Settings and initialisation
var slackToken = "YOUR-TOKEN-HERE";

// Queries
var todayQuery = "on:today";

// Pre-defined Variables
var userMostTalkative = [],
    userTalkativeRanking = [],
    userMessageCountPromise = [];

var teamName, todayCount, yesterdayCount, diffPercentage;

var requestOptions = {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
}

/* =========================== Helper Functions =========================== */

function getHighestResolutionImage(profile) {
    return ['original', '1024', '512', '192']
      .map((resolutionString) => profile['image_' + resolutionString])
      .find((possibleImageUrl) => possibleImageUrl);
}

/* ======================================================================== */

if (slackToken == "YOUR-TOKEN-HERE") {
	var promptToken = prompt("Please enter your token:");
	if (promptToken != null) {
		slackToken = promptToken;
		getData();
	}
} else {
	getData();
}

/**
 * Get the messages sent today and yesterday.  Uses
 * Fetch API as an improvement on XMLHttpRequest.
 */
function SearchMessagesRequest() {
    var queries = ["today", "yesterday"];
    //create an array of promises for the queries above
    var proms = queries.map((query) => {
        return fetch("https://slack.com/api/search.messages?token=" + slackToken + "&query=on:" + query, requestOptions).then((response) => {
            return response.json()
        });
    });
    return Promise.all(proms);
}

/**
 * Process the result of the SearchMessageRequest and store it in global variables
 */
function SearchMessageHandler(response) {
    return new Promise((resolve, reject) => {
        todayCount = (response.length > 0 && typeof response[0] != 'undefined') ? response[0].messages.total : 0;
        yesterdayCount = (response.length > 0 && typeof response[1] != 'undefined') ? response[1].messages.total : 0;
        resolve();
    });
}

/**
 * Get users list call
 */
function UserListRequest() {
    return fetch("https://slack.com/api/users.list?token=" + slackToken, requestOptions).then((response) => {
        return response.json()
    });
}

/**
 * Get message Count for a user
 */
function UserMessageCountRequest(member) {
    return fetch("https://slack.com/api/search.messages?token=" + slackToken + "&query=" + todayQuery + "+" + "from:" + member.name, requestOptions)
        .then((response) => {
            //Convert the response in a json object
            return response.json().then((resultObj) => {
                //Inject the member data into the object result that will be handled in getTalkativeUser
                resultObj.member = member;
                return Promise.resolve(resultObj);
            });
        });
}

/**
 * Place values found in UserList response into corresponding variables
 */
function UserListHandler(response) {
    return new Promise((resolve, reject) => {
        userMessageCountPromise = response.members.map((member) => {
            return UserMessageCountRequest(member)
        });
        resolve();
    });
}

/**
 * Get team info response.
 */
function TeamInfoRequest() {
    return fetch("https://slack.com/api/team.info?token=" + slackToken, requestOptions).then((response) => {
        return response.json()
    });
}

/**
 * Place team info response in teamName
 */
function TeamInfoHandler(response) {
    return new Promise((resolve, reject) => {
        teamName = response.team.name;
        resolve();
    });
}

/**
 * Get percentage of messages sent in current day compared to previous day.
 * populate diffPercentage with this value.
 */
function getPercentage() {
    return new Promise(function(resolve, reject) {
        var difference = todayCount - yesterdayCount;
        //check if the yesterday's count is 0 show 100% in order to avoid division by 0 errors
        diffPercentage = (yesterdayCount === 0) ? 100 : Math.round(difference / Number(yesterdayCount) * 100);
        resolve();
    })
};

/**
 * Get most talkative user.  Populate userMostTalkative with a reference to
 * this user.
 */
function getTalkativeUser() {
    return new Promise(function(resolve, reject) {
        Promise.all(userMessageCountPromise).then((response) => {
            //sort the array of user by the number of messages sent and get the first entry with the highest value
            userMostTalkative = response.sort((a,b)=>{ return (a.messages.total < b.messages.total)})[0];
            userTalkativeRanking = response.sort((a,b)=>{ return (a.messages.total < b.messages.total)});
            resolve();
        });
    })
};

/**
 * Send out all requests and handle their responses.
 */
function getData() {
  /**
   * Chain all the requests and console.log caught errors.
   * After each successful call the next call will execute, however if a
   * call fails there will be no more calls and the error will be logged
   */
    TeamInfoRequest() // response data forwarded
        .then(TeamInfoHandler)
        .then(SearchMessagesRequest) // response data forwarded
        .then(SearchMessageHandler)
        .then(UserListRequest) // response data forwarded
        .then(UserListHandler)
        .then(getPercentage)
        .then(getTalkativeUser)
        .then(postToHTML)
        .catch(error => alert(error + ". \nEnsure you have added your API token into stats.js"))
};
/**
 * Escape HTML tag opening/closing to prevent xss attacks
 */
function escapeHtmlTags(html){
    html = html.replace(/</, '&lt;');
    html = html.replace(/>/, '&gt;');
    return html;
}
/**
 * Escape HTML quots to prevent xss via attribute injection
 */
function escapeAttributeQuots(attribute){
    attribute = attribute.replace(/"/, '&quot;');
    attribute = attribute.replace(/'/, '&#39;');
    return attribute;
}

/**
 * Manipulate DOM to reflect values found in API requests.
 */
function postToHTML() {
    document.getElementById("title").innerHTML = 'Slack stats for ' + escapeHtmlTags(teamName);
    document.getElementById("todayCounter").innerHTML = todayCount;
    document.getElementById("yesterdayCounter").innerHTML = yesterdayCount;

    if (diffPercentage >= 0) {
        document.getElementById("compare").innerHTML = "That's ~" + diffPercentage + "% messages more than yesterday!";
    } else {
        document.getElementById("compare").innerHTML = "That's ~" + Math.abs(diffPercentage) + "% messages less than yesterday!";
    };

    document.getElementById("mostTalkativeUser").innerHTML = escapeHtmlTags(userMostTalkative.member.profile.real_name);
    document.getElementById("compare2").innerHTML = "is today's most talkative user, with " + userMostTalkative.messages.total + " messages.";
    document.getElementById("mostTalkativeUserPicture").src = getHighestResolutionImage(userMostTalkative.member.profile);

    document.getElementById("realName1").innerHTML = escapeHtmlTags(userTalkativeRanking[0].member.profile.real_name);
    document.getElementById("messages1").innerHTML = userTalkativeRanking[0].messages.total;

    document.getElementById("realName2").innerHTML = escapeHtmlTags(userTalkativeRanking[1].member.profile.real_name);
    document.getElementById("messages2").innerHTML = userTalkativeRanking[1].messages.total;

    document.getElementById("realName3").innerHTML = escapeHtmlTags(userTalkativeRanking[2].member.profile.real_name);
    document.getElementById("messages3").innerHTML = userTalkativeRanking[2].messages.total;
};

// All promises are now resolved in the getData function
