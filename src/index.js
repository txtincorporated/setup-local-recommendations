
// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

var languageStrings = {
    'en': {
        'translation': {
            'WELCOME' : "Welcome to myPDX, your personal guide to Portland Oregon!",
            'HELP'    : "Say about, to hear more about the city, or say coffee, breakfast, lunch, or dinner, to hear portland restaurant suggestions, or say recommend an attraction, or say, go outside. ",
            'ABOUT'   : "Portland Oregon is a city between the Willamette and Columbia Rivers.  Popularly known as America's most livable city, Portland is internationally popular with foodies, music lovers and outdoor adventurers.",
            'STOP'    : "Okay, see you next time!"
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
var data = {
    "city"        : "Portland",
    "state"       : "OR",
    "postcode"    : "97202",
    "restaurants" : [
        { "name":"Jupiter Hotel",
            "address":"800 E Burnside St", "phone": "503-230-9200",
            "meals": "breakfast, lunch, dinner",
            "description": "Voted one of America's top 10 Jewish delis by Foursquare dot com."
        },
        { "name":"Kenny and Zuke's",
            "address":"1038 SW Stark St", "phone": "503-222-3354",
            "meals": "breakfast, lunch, dinner",
            "description": "Voted one of America's top 10 Jewish delis by Foursquare dot com."
        },
        { "name":"Public Domain",
            "address":"603 SW Broadway", "phone": "503-243-6374",
            "meals": "coffee, breakfast, lunch",
            "description": "A great example of Portlands famous coffee culture at its finest."
        },
        { "name":"Stumptown Coffee Roasters",
            "address":"3356 SE Belmont St", "phone": "503-232-8889",
            "meals": "coffee",
            "description": "Portland's best-know coffee roasters.  Be sure to try a Stumptown cold brew this summer!"
        },
    ],
    "attractions":[
        {
            "name": "Columbia River Gorge",
            "description": "Columbia River Gorge National Scenic Area runs along I-84 for 80 miles starting just outside Portland.  This four thousand foot canyon includes hundreds of miles of recreation trails and over 90 spectacular waterfalls.",
            "distance": "10"
        },
        {
            "name": "Washington Park",
            "description": "Home to the Hoyt Arboretum Oregon Forestry Center and Oregon Zoo, Washington Park is a favorite family destination for Portlanders and visitors alike.  Check out the summer concert series at the zoo from May through September.",
            "distance": "0"
        },
        {
            "name": "Canon Beach",
            "description": "One of the Pacific Northwest's best loved beach towns just an hour and an half from Portland, Canon Beach is famous for its generous beach, iconic haystack rock and first rate tide pooling opportunities.",
            "distance": "60"
        }
    ]
}

// Weather courtesy of the Yahoo Weather API.
// This free API recommends no more than 2000 calls per day

var myAPI = {
    host: 'query.yahooapis.com',
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: 'GET'
};
// 2. Skill Code =======================================================================================================

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var say = this.t('WELCOME') + ' ' + this.t('HELP');
        this.emit(':ask', say, say);
    },

    'AboutIntent': function () {
        this.emit(':tell', this.t('ABOUT'));
    },
    
    'TeamNameIntent': function () {
        var say = 'handling the team name intent';
        var sport = '';
        if(this.event.request.intent.slots.sport.value) {
            sport = this.event.request.intent.slots.sport.value;
        }
        switch(sport) {
            case 'basketball':
                say = 'The Portland Trailblazers are the local basketball team.';
                break;
            case 'soccer':
                say = 'The Portland Timbers are the local soccer team.';
                break;
            case 'baseball':
                say = 'The Seattle Mariners are the regional baseball team.';
                break;
            case 'football':
                say = 'The Oregon Ducks are the local football team.';
                break;
            default:
                say = 'Please try again.  You can ask which team plays basketball, soccer, baseball or football.';
                break;
        }
        this.emit(':tell', say);
        this.emit(':tell', this.t('ABOUT'));
    },

    'CoffeeIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For a great coffee shop, I recommend, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'BreakfastIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For breakfast, try this, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'LunchIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Lunch time! Here is a good spot. ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'DinnerIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Enjoy dinner at, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'AMAZON.YesIntent': function () {
        var restaurantName = this.attributes['restaurant'];
        var restaurantDetails = getRestaurantByName(restaurantName);

        var say = restaurantDetails.name
            + ' is located at ' + restaurantDetails.address
            + ', the phone number is ' + restaurantDetails.phone
            + ', and the description is, ' + restaurantDetails.description
            + '  I have sent these details to the Alexa App on your phone.  Enjoy your meal! <say-as interpret-as="interjection">bon appetit</say-as>' ;

        var card = restaurantDetails.name + '\n' + restaurantDetails.address + '\n'
            + data.city + ', ' + data.state + ' ' + data.postcode
            + '\nphone: ' + restaurantDetails.phone + '\n';

        this.emit(':tellWithCard', say, restaurantDetails.name, card);

    },

    'AttractionIntent': function () {
        var distance = 200;
        if (this.event.request.intent.slots.distance.value) {
            distance = this.event.request.intent.slots.distance.value;
        }

        var attraction = randomArrayElement(getAttractionsByDistance(distance));

        var say = 'Try '
            + attraction.name + ', which is '
            + (attraction.distance == "0" ? 'right in town. ' : attraction.distance + ' miles away. Have fun! ')
            + attraction.description;

        this.emit(':tell', say);
    },

    'GoOutIntent': function () {

        getWeather( ( localTime, currentTemp, currentCondition) => {
            // time format 10:34 PM
            // currentTemp 72
            // currentCondition, e.g.  Sunny, Breezy, Thunderstorms, Showers, Rain, Partly Cloudy, Mostly Cloudy, Mostly Sunny

            // sample API URL for Irvine, CA
            // https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22irvine%2C%20ca%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

            // this.emit(':tell', 'It is ' + localTime
            //     + ' and the weather in ' + data.city
            //     + ' is '
            //     + currentTemp + ' and ' + currentCondition);

            // TODO
            // Decide, based on current time and weather conditions,
            // whether to go out to a local beach or park;
            // or recommend a movie theatre; or recommend staying home
            
            var AMPM = localTime.substring(6,8);
            console.log(AMPM);
            var hour = parseInt(localTime.substring(6,8));
            if(AMPM == "PM") { hour = hour + 12; }

            var suggestion = 'Read a book.';

            console.log(suggestion);

            if(hour < 7 ) {suggestion = 'Sleep.'; }
            if(hour >= 7 && hour < 12) {suggestion = 'Ask me for a breakfast recommendation.'; }
            if(hour >= 12 && hour < 14) {suggestion = 'Ask me for a lunch recommendation.'; }
            if(hour >= 17 && hour < 20) {suggestion = 'Ask me for a dinner recommendation.'; }

            if(hour >= 22 || (hour == 12 && AMPM == 'AM')) {suggestion = 'Go to bed.'; }

            if(hour >= 20 && hour < 22) {
                if(['Rain', 'Shower', 'Thunderstorms'].indexOf(currentCondition) > -1) {
                    suggestion = 'Stay home and watch a movie on Amazon Prime since it is wet outside.';   
                } else {
                    suggestion = 'Check out what is playing at the Cineplex movie theater on 123 Main St.';
                }

            }

            if (['Sunny'].indexOf(currentCondition) > -1 -1 && currentTemp > 75 && hour < 11) {suggestion = 'Plan a day at the beach, as it is sunny and warm today.'}

            console.log(suggestion);
            this.emit(':tell', 'It is ' + localTime
            + ' and the weather in ' + data.city
            + ' is '
            + currentTemp + ' and ' + currentCondition
            + '. I suggest you ' + suggestion);


        });
    },

    'AMAZON.NoIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', this.t('HELP'));
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP'));
    }

};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================

function getRestaurantsByMeal(mealtype) {

    var list = [];
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].meals.search(mealtype) >  -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getRestaurantByName(restaurantName) {

    var restaurant = {};
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].name == restaurantName) {
            restaurant = data.restaurants[i];
        }
    }
    return restaurant;
}

function getAttractionsByDistance(maxDistance) {

    var list = [];

    for (var i = 0; i < data.attractions.length; i++) {

        if(parseInt(data.attractions[i].distance) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}

function getWeather(callback) {
    var https = require('https');


    var req = https.request(myAPI, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var channelObj = JSON.parse(returnData).query.results.channel;

            var localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            var currentTemp = channelObj.item.condition.temp;

            var currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);

        });

    });
    req.end();
}
function randomArrayElement(array) {
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}
