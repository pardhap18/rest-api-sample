'use strict';
/*
 Module dependencies
 */
var express = require('express'),
    morgan = require('morgan'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    bodyParser = require('body-parser'),
    uuid = require('node-uuid'),
    app = express();
var data_path = path.resolve('./data');
var tweets_json_path = data_path + '/tweets.json';


var prefix_api = "/api/v1";


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//use from morgan to logging these request into console
app.use(morgan('combined'));

/**
 helper functions for get data from json files
 **/
var getTweetsFromJsonFile = function () {
    return jsonfile.readFileSync(tweets_json_path);
};

//REST FULL API Routes

/**
 * create new tweet
 */
app.post(prefix_api + '/tweet', function (req, res) {
    var body = req.body.body;
    var feel = req.body.feel;
    if (body && feel) {
        //create new tweet object
        var newTweet = {id: uuid.v1(), body: body, feel: feel, created_at: new Date(), updated_at: new Date()};
        //get the tweets list and add this new tweet to that list
        var tweets = getTweetsFromJsonFile();
        if (tweets) {
            //add this tweet to tweet list
            tweets.push(newTweet);
            //write these tweet to json file
            jsonfile.writeFile(tweets_json_path, tweets, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(newTweet);
                }
            });
        }
        else {
            //error happend in get list of tweets from json file
            res.status(500).send({
                type: 'INTERNAL_SERVER_ERROR',
                description: 'Internal server error'
            });
        }
    }
    else {
        res.status(400).send({
            type: 'SOME_FIELDS_ARE_EMPTY',
            description: 'body field or feel field for create new tweet was empty :|'
        });
    }
});

/*
 get the list of tweets
 we can also search in tweets by feel with this query string like ?feel=😀
 */
app.get(prefix_api + '/tweet', function (req, res) {
    var tweets = getTweetsFromJsonFile();
    if (tweets) {
        //filter if have query string feel
        var wanted_feel = req.query.feel;
        if (wanted_feel) {
            var result = [];
            //filter with this feel
            tweets.forEach(function (tweet) {
                if (tweet.feel === wanted_feel) {
                    result.push(tweet);
                }
            });
            res.json(result.reverse());
        }
        else {
            res.json(tweets.reverse());
        }
    }
    else {
        res.status(500).send({
            type: 'INTERNAL_SERVER_ERROR',
            description: 'Internal server error'
        });
    }
});

/*
 get one tweet by id
 */
app.get(prefix_api + '/tweet/:id', function (req, res) {
    var tweet_with_this_id;
    var tweets = getTweetsFromJsonFile();
    var tweet_id = req.params.id;
    tweets.forEach(function (tweet) {
        if (tweet.id === tweet_id) {
            tweet_with_this_id = tweet;
        }
    });
    if (tweet_with_this_id) {
        res.json(tweet_with_this_id);
    }
    else {
        res.status(404).send({
            type: 'NOT_FOUND_TWEET_WITH_THIS_ID',
            description: 'not found any tweet with this id'
        });
    }
});

/*
 update the tweet by id
 */
app.put(prefix_api + '/tweet/:id', function (req, res) {
    var updated_tweet;
    var tweets = getTweetsFromJsonFile();
    var tweet_id = req.params.id;
    var body = req.body.body;
    var feel = req.body.feel;
    if (body && feel) {
        tweets.forEach(function (tweet) {
            if (tweet.id === tweet_id) {
                //find it :) now should edit the fields
                tweet.body = body;
                tweet.feel = feel;
                tweet.updated_at = new Date();
                updated_tweet = tweet;
            }
        });
        if (updated_tweet) {
            //write it to json file
            jsonfile.writeFile(tweets_json_path, tweets, function (err) {
                if (err) {
                    res.status(500).send({
                        type: 'INTERNAL_SERVER_ERROR',
                        description: 'Internal server error'
                    });
                }
                else {
                    res.json(updated_tweet);
                }
            });
        }
        else {
            res.status(404).send({
                type: 'NOT_FOUND_TWEET_WITH_THIS_ID',
                description: 'not found any tweet with this id'
            });
        }
    }
    else {
        res.status(400).send({
            type: 'SOME_FIELDS_ARE_EMPTY',
            description: 'body field or feel field for create new tweet was empty :|'
        });
    }
});

/*
 delete the tweet by id
 */
app.delete(prefix_api + '/tweet/:id', function (req, res) {
    //first should find it then remove it and write it to json file
    var tweet_index = -1;
    var tweets = getTweetsFromJsonFile();
    var tweet_id = req.params.id;
    tweets.forEach(function (tweet, index) {
        if (tweet.id === tweet_id) {
            tweet_index = index;
        }
    });
    if (tweet_index !== -1) {
        //remove it
        tweets.splice(tweet_index, 1);
        //write it to json file
        jsonfile.writeFile(tweets_json_path, tweets, function (err) {
            if (err) {
                res.status(500).send({
                    type: 'INTERNAL_SERVER_ERROR',
                    description: 'Internal server error'
                });
            }
            else {
                //inform user this tweet successfully remove it
                res.send({
                    type: 'REMOVED_SUCCESSFULLY', description: 'Removed successfully'
                });
            }
        });
    }
    else {
        res.status(404).send({
            type: 'NOT_FOUND_TWEET_WITH_THIS_ID',
            description: 'not found any tweet with this id'
        });
    }
});


var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    host = host === '::' ? 'localhost' : host;
    console.log("sample REST API for Retrofit in android without Authentication is running at http://%s:%s", host, port);
});
