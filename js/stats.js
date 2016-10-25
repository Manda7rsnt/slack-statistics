// Primary JavaScript for Slack Statistics

// Settings and initialisation
var slackToken = "xoxp-2849779886-2849810124-95795725287-bd74e98e569e8d7ffd11ff7eb2b90717";

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

var requestOptions = {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
}

// Help Functions
function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getIndexOfMax(numArray) {
    return numArray.indexOf(getMaxOfArray(numArray));
}

//SearchMessages Fn

function SearchMessagesRequest(){
    var queries = ["today", "yesterday"];
    var proms =  queries.map((query)=>{
        return fetch("https://slack.com/api/search.messages?token=" + slackToken + "&query=on:" + query, requestOptions).then((response)=>{return response.json()});
    });
    return Promise.all(proms);
}

function SearchMessageHandler(response){
    return new Promise((resolve, reject)=>{
        todayCount = (response.length>0 && typeof response[0] != 'undefined') ? response[0].messages.total : 0;
        yesterdayCount = (response.length>0 && typeof response[1] != 'undefined') ? response[1].messages.total : 0;
        resolve();
    });
}

function UserListRequest(){
    return fetch("https://slack.com/api/users.list?token=" + slackToken, requestOptions).then((response)=>{return response.json()});
}

function UserMessageCountRequest(member){
    return fetch("https://slack.com/api/search.messages?token=" + slackToken + "&query=" + todayQuery + "+" + "from:" + member.name, requestOptions)
        .then((response)=>{
            return response.json().then((resultObj)=>{
                resultObj.member = member;
                return Promise.resolve(resultObj);
            });
        });
}

function UserListHandler(response){
    return new Promise((resolve, reject)=>{
        userCount = Object.keys(response.members).length - 1;
        userName = response.members.map((member)=> { return member.profile.name});
        userMessage = response.members.map((member) => { return "from:" + member.name })
        userMessageCountPromise = response.members.map((member)=>{ return UserMessageCountRequest(member)});
        resolve();
    });
}

function TeamInfoRequest(){
    return fetch("https://slack.com/api/team.info?token=" + slackToken, requestOptions).then((response)=>{return response.json()});
}

function TeamInfoHandler(response){
    return new Promise((resolve, reject)=>{
        console.log(response)
        teamName = response.team.name;
        resolve();
    });
}


function getPercentage() {
    return new Promise(function(resolve, reject) {
        var difference = todayCount - yesterdayCount;
        var percentage = (yesterdayCount === 0 ) ? 100 : Math.round(difference / Number(yesterdayCount) * 100);
        diffPercentage = percentage;
        resolve();
    })
};


function getTalkativeUser() {
    return new Promise(function(resolve, reject) {
        Promise.all(userMessageCountPromise).then((response) => {
            userMostTalkative = response.sort((a,b)=>{ return (a.messages.matches.length < b.messages.matches.length)})[0]
            console.log(userMostTalkative)
            resolve();
        });
    })
};

function getData() {
    // Chain all the requests and console.log caught errors

    TeamInfoRequest()
        .then(TeamInfoHandler)
        .then(SearchMessagesRequest)
        .then(SearchMessageHandler)
        .then(UserListRequest)
        .then(UserListHandler)
        .then(getPercentage)
        .then(getTalkativeUser)
        .then(postToHTML)
        .catch(error => console.log(error))
};

function postToHTML() {
    document.getElementById("title").innerHTML = 'Slack stats for <span id="teamNameStyle">' + teamName + '</span>';
    document.getElementById("todayCounter").innerHTML = todayCount;
    document.getElementById("yesterdayCounter").innerHTML = yesterdayCount;

    if (diffPercentage >= 0) {
        document.getElementById("compare").innerHTML = "That's ~" + diffPercentage + "% messages more than yesterday!";
    } else {
        document.getElementById("compare").innerHTML = "That's ~" + Math.abs(diffPercentage) + "% messages less than yesterday!";
    };

    document.getElementById("mostTalkativeUser").innerHTML = userMostTalkative.member.profile.real_name;
    document.getElementById("compare2").innerHTML = "is today's most talkative user, with " + userMostTalkative.messages.matches.length + " messages.";

};

getData();
// All promises are now resolved in the getData function
