"use strict";

var nforce = require('nforce');

var org; // single connection

var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).
var CLIENT_ID = '3MVG9zlTNB8o8BA2qUzWCasqTES9Uyd8Aay1vlNoxN584njVT0RVMOiGzcztc3a_DcpTirPRS_iJ4RpVw3.3j';
var CLIENT_SECRET = '240979047346245814';
var CALLBACK_URL = 'https://pitangui.amazon.com/api/skill/link/M3LPK44D48STDO';


var CLIENT_STATES = {
    MYACCOUNT: "_MYACCOUNTMODE", // Asking MYACCOUNT questions.
    START: "_STARTMODE", // Entry point, start the game.
    HELP: "_HELPMODE" // The user is asking for help.
};


var languageString = {
    "en": {
        "translation": {
            "QUESTIONS" : "Questions"
        }
    }
};

var Alexa = require("alexa-sdk");
var moment = require('./moment-timezone');
var APP_ID = "amzn1.ask.skill.9cee7ac6-e050-44cd-81cf-0ff6365d4c03";  // TODO replace with your app ID (OPTIONAL).

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, myAccountStateHandlers, helpStateHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        console.log('*********In newSession.LaunchRequest**********');
        this.handler.state = CLIENT_STATES.START;
        handleSFDCLogin(this.event.request, this.event.session, this.emit);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = CLIENT_STATES.START;
        this.emit("StartClient");
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = CLIENT_STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};


var startStateHandlers = Alexa.CreateStateHandler(CLIENT_STATES.START, {

    //------------------------------------------------------------------------------------
    // Initialize
    //------------------------------------------------------------------------------------
    "StartClient": function () {
      console.log(this);
      console.log('*********In START.StartClient**********');
      handleSFDCLogin(this.event.request, this.event.session, this.emit);
    },
    "DiscussAccountIntent": function () {
      handleQueryAccount(this.event.request, this.event.session, this.emit);
    },
    "PlayAccountDetailsIntent": function () {
        handlePlayAccountDetailsRequest(this.event.request, this.event.session, this.emit);
    },
    "CreateCallIntent": function () {
        handleCreateCallRequest(this.event.request, this.event.session, this.emit);
    },
    "MyCalendarIntent": function () {
        handleMyCalendarRequest(this.event.request, this.event.session, this.emit);
    },
    "DebugIntent": function () {
      console.log('*********In START.DebugIntent**********');
      handleDebugRequest(this);
    },
    "Unhandled": function () {
      //console.log(this);
      console.log('*********In START.Unhandled**********');
      //handleSFDCLogin(this.event.request, this.event.session, this.emit);
    }
});

var myAccountStateHandlers = Alexa.CreateStateHandler(CLIENT_STATES.MYACCOUNT, {
    "DiscussAccountIntent": function () {
        handleQueryAccount(this.event.request, this.event.session, this.emit);
    },
    "CreateCallIntent": function () {
        handleCreateCallRequest(this.event.request, this.event.session, this.emit);
    },
    "DontKnowIntent": function () {
        //handleUserGuess.call(this, true);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = CLIENT_STATES.START;
        this.emitWithState("StartClient", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = CLIENT_STATES.HELP;
        this.emitWithState("helpTheUser", false);
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = CLIENT_STATES.HELP;
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("MYACCOUNT_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in MYACCOUNT state: " + this.event.request.reason);
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(CLIENT_STATES.HELP, {
    "StartClient": function (newGame) {
      console.log(this);
      handleSFDCLogin(this.event.request, this.event.session, this.emit);
    },
    "helpTheUser": function (newGame) {
        var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("REPEAT_QUESTION_MESSAGE") + this.t("STOP_MESSAGE");
        var speechOutput = askMessage;
        var repromptText = this.t("HELP_REPROMPT") + askMessage;
        this.emit(":ask", speechOutput, repromptText);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = CLIENT_STATES.START;
        this.emitWithState("StartClient", false);
    },
    "AMAZON.RepeatIntent": function () {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.HelpIntent": function() {
        var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
        this.emitWithState("helpTheUser", newGame);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["speechOutput"] && this.attributes["repromptText"]) {
            this.handler.state = CLIENT_STATES.MYACCOUNT;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = CLIENT_STATES.START;
            this.emitWithState("StartClient", false);
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t("NO_MESSAGE");
        this.emit(":tell", speechOutput);
    },
    "AMAZON.StopIntent": function () {
        var speechOutput = this.t("STOP_MESSAGE");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("HELP_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

//----------------------------------------------------------------------------------------------------------------------------
// Handle SFDC Login
//----------------------------------------------------------------------------------------------------------------------------
function handleSFDCLogin(request, session, emit) {
  console.log('*********In handleSFDCLogin******');
  var welcomeSpeech = "Hello, my name is Vern. ";
  var speechOutput = "What can I help you with?";
  var repromptText = "You may say bring up account followed by their name or bring up my calendar";

  // only say the welcome speech once per session
  if (session.attributes.welcomeMsgPlayed == null) {
      session.attributes.welcomeMsgPlayed = true;
      speechOutput = welcomeSpeech + speechOutput;
  }


  // set up the connection
  org = nforce.createConnection({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: CALLBACK_URL,
    apiVersion: 'v27.0',  // optional, defaults to current salesforce API version
    environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
    mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
  });

  // store this in the attributes
  var oauth = {
    // "access_token":"00Df40000003jc1!ARAAQDa.abMBBkjcqQXT9sPnZQk4t9gtp5M8zIZiL26angfl8mczuTnixrxT3NcV9.6oW6lAhlEkhBtOFJ5nueWJBoA4A4pb",
    "access_token": session.user.accessToken,
    "instance_url":"https://na59.salesforce.com",
    "id":"https://login.salesforce.com/id/00Df40000003jc1EAA/005f4000000MOhVAAW",
    "token_type":"Bearer",
    "issued_at":"1499748006477",
    "signature":"aYSsShYjcghD0dRcJyHgx4gDWopnSQSaJ3v6CKwLD1E="};
  session.attributes.oauth = oauth;

  console.log('Accesstoken: ' + session.user.accessToken);
  if (session.user.accessToken == null) {
    emit(":tell", "Could not find a connected app session. Please go to your Alexa app to link an account", "Please try again");
    return;
  } else {
    //emit(":ask", speechOutput, repromptText);

    var cardTitle = 'Hello, my name is Vern';
    var cardContent = 'What can I help you with?';
    var imageObj = {
      smallImageUrl: 'https://www.veeva.com/wp-content/uploads/2014/04/Vern-headshot.png',
      largeImageUrl: 'https://www.veeva.com/wp-content/uploads/2014/04/Vern-headshot.png'
    };
    emit(':askWithCard', speechOutput, repromptText, cardTitle, cardContent, imageObj);
  }
  console.log('Request:' + request);
  console.log('Session:' + session);
  console.log('*********Exit handleSFDCLogin******');
}

//-------------------------------------------------------------
// Veeva: Handle create call
//-------------------------------------------------------------
function handleQueryAccount(request, session, emit) {
  console.log('*********In handleQueryAccount ******');
  console.log('Request:' + request);
  console.log('Session:' + session);
  console.log('Intent:' + JSON.stringify(request.intent));

  // query for this account
  var accountName = request.intent.slots.Name.value;
  var query = "select name, Id, Gender_vod__c, Specialty_1_vod__c from Account where Name = '" + accountName + "'";
  var speechOutput = 'Sorry, I could not find the account ' + accountName + ' . Please try to search for another account. ';
  if (session.attributes.oauth == null) {
    this.omit(":ask", "No oauth object detected", "No oauth object detected");
  }

  console.log('Account Name: ' + request.intent.slots.Name.value);
  console.log('slots: ' + JSON.stringify(request.intent.slots));
  console.log('slots.Name: ' + JSON.stringify(request.intent.slots.Name));
  console.log('slots.Name.value: ' + JSON.stringify(request.intent.slots.Name.value));

  console.log('YYY Before query...')
  org.query({ query: query, oauth: session.attributes.oauth }).then(function(results){
    console.log('RESULTS: ' + results)
    if (results.records.length > 0) {
      var acc = results.records[0];
      speechOutput = 'I found the Account ' + accountName + '. ';
      speechOutput = speechOutput + (acc.get('Gender_vod__c') == "M" ? " his " : " her " ) + ' specialty is ' + acc.get('Specialty_1_vod__c') + '. You can say give me a summary or create a call.';
      session.attributes.accountName = accountName;  // if query was successful, then store the account id
      session.attributes.accountId = acc.get('Id');
      // Set the current state to MYACCOUNT mode. The skill will now use handlers defined in MYACCOUNTStateHandlers
      //this.handler.state = CLIENT_STATES.MYACCOUNT;
      emit(":ask", speechOutput, speechOutput);

    }
  }).error(function(err) {
    console.log('YYY error: ' +err);
    speechOutput = 'Something went wrong.';
    emit(":ask", speechOutput, speechOutput);

  });
}

//-------------------------------------------------------------
// Veeva: Handle create call
//-------------------------------------------------------------
function handleCreateCallRequest(request, session, emit) {
  console.log('*********In handleCreateCallRequest ******');
  console.log('slots: ' + JSON.stringify(request.intent.slots));


  // intent was created to contain the account name in the same utterance.  However, this requires
  // an additional query for the account id, which isn't finished yet
  if (request.intent.slots.Name.value == null) { session.attributes.name = request.intent.slots.Name.value };

  if (session.attributes.accountName == '') {
     response.ask('Which account are we talking about?');
     return;
  }

  var speechOutput = "Ok. A call was created for, " + session.attributes.accountName + ". The date requested is, "
    + request.intent.slots.CallDate.value + ". The time requested is "
    + request.intent.slots.CallTime.value;
  var repromptOutput = "What else can I help you with?";

  console.log('Call time: ' + request.intent.slots.CallDate.value+'T'
    +request.intent.slots.CallTime.value+':00-07:00');
  var obj = nforce.createSObject('Call2_vod__c');
  obj.set('Account_vod__c', session.attributes.accountId);
  //obj.set('Call_Datetime_vod__c',intent.slots.CallDate.value + 'T' + intent.slots.CallTime.value + ':00:00-05:00');
  obj.set('Call_Datetime_vod__c',request.intent.slots.CallDate.value+'T'
    +request.intent.slots.CallTime.value+':00-07:00');
  obj.set('Status_vod__c','Planned');

  org.insert({ sobject: obj, oauth: session.attributes.oauth }
  ).then(function(results) {
    if (results.success) {
      emit(":ask", speechOutput, repromptOutput);
    } else {
      speechOutput = 'Result was not successful.';
      emit(":ask", speechOutput, repromptOutput);
    }
  }).error(function(err) {
    var errorOutput = 'A problem was encountered.';
    emit(":ask", errorOutput, repromptOutput);
  });

}

//-------------------------------------------------------------
// Veeva: Handle create call
//-------------------------------------------------------------
function handlePlayAccountDetailsRequest(request, session, emit) {
  console.log('*********In handlePlayAccountDetailsRequest ******');
  console.log('slots: ' + JSON.stringify(request.intent.slots));

  // query for this account
  var query = "SELECT id, Address_vod__r.Name, Address_vod__r.City_vod__c, Address_vod__r.State_vod__c, Last_Activity_Date_vod__c,My_Target_vod__c,YTD_Activity_vod__c FROM TSF_vod__c where account_vod__c = '" + session.attributes.accountId + "'";
  var speechOutput = 'Sorry, I could not find the account ' + session.attributes.accountId + ' . Please try to search for another account. ';

  console.log('YYY Before query...');
  org.query({ query: query, oauth: session.attributes.oauth }).then(function(results){
    console.log('RESULTS: ' + results)
    if (results.records.length > 0) {
      var tsf = results.records[0];
      var address = tsf.get('Address_vod__r');
      console.log(JSON.stringify(address));
      speechOutput = session.attributes.accountName + ', is at the preferred address '
        + address.Name + ',' +  address.City_vod__c +
        + address.State_vod__c + '.'
        + ' This year, you have made ' + tsf.get('YTD_Activity_vod__c') + ' calls against this H C P.' +
        (tsf.get('My_Target_vod__c') == "true" ? " This account is a target. " : " This account is not a target. ")+
        ' What else can I do for you?';
      emit(":ask", speechOutput, speechOutput);

    }
  }).error(function(err) {
    console.log('YYY error: ' +err);
    speechOutput = 'Something went wrong.';
    emit(":ask", speechOutput, speechOutput);

  });

}

//-------------------------------------------------------------
// find any calendar events for today
function handleMyCalendarRequest(request,session,emit) {
  console.log('*********In handleCalendarRequest ******');
  createConnection();
  var query = 'select id, StartDateTime, Subject, Who.Name from Event where startdatetime = LAST_N_DAYS:2 order by StartDateTime';
  // auth and run query
  org.query({ query: query, oauth: session.attributes.oauth }).then(function(results){
    var speechOutput = 'You have  ' + results.records.length + ' event for today, ';
    //forEach(results.records, function(rec) {
    //  speechOutput += 'At ' + moment(rec.get('StartDateTime')).tz('America/New_York').format('h:m a') + ', ' + rec.get('Subject');
    //  if (rec.get('Who')) speechOutput += ', with  ' + rec.get('Who').Name;
    //  speechOutput += ', ';
    //});
    console.log(results.records);
    console.log('length' + results.records.length);
    for (var i = 0; i < results.records.length; i++) {
        var rec = results.records[i];
        speechOutput += 'At ' + moment(rec.get('StartDateTime')).tz('America/Los_Angeles').format('h a') + ', ' + rec.get('Subject') ;
        if (rec.get('Who')) speechOutput += ', with  ' + rec.get('Who').Name;
        speechOutput += ', ';
    }
    emit(":ask", speechOutput, "What else would like you for me to do?");
  }).error(function(err) {
    var errorOutput = 'Something has gone wrong';
    emit(":tell", errorOutput, errorOutput);
  });
}

//-------------------------------------------------------------
// Veeva: Handle debug request
//-------------------------------------------------------------
function handleDebugRequest(topThis) {
    console.log('*********In handleSFDCLogin******');
    console.log(topThis);
    var speechOutput = "Client state is "; // + this.state;
    emit(":ask", speechOutput, speechOutput);
}

//-------------------------------------------------------------
// Veeva: Handle debug request
//-------------------------------------------------------------
function handleUnhandled(topThis) {
    console.log('*********In handleUnhandled******');
    console.log(topThis);
    var speechOutput = "I'm sorry.  Something went wrong";
    emit(":ask", speechOutput, speechOutput);
}

function createConnection() {

  if (org == null) {
    // set up the connection
    org = nforce.createConnection({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: CALLBACK_URL,
      apiVersion: 'v27.0',  // optional, defaults to current salesforce API version
      environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
      mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
    });
  }


}
