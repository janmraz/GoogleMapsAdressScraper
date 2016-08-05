/**
 * CSV file must exists
 * parameters must be in particular order -> queryToGoogleMaps, language, coordinates, pathToCsv
 * Google APIKEY must be activated in https://console.developers.google.com (also every IP address must be activated)
 */

var json2csv = require('json2csv');
var fs = require('fs');
var request = require('request');
var async = require('async');
var appKeyId = "AIzaSyCeLk_knIpAU5-AIaUPiMBE2eddGZzjtA4";

var lookingfor = {
    language: process.argv[3],
    location: process.argv[4],
    radius: "10000",
    keyword: process.argv[2],
    key: appKeyId
};

var crawlerData = [];
var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
var len;
var timeout = 5000;
var fulldata = [];
NearbySearch(lookingfor);
function NearbySearch(lookingfor){
    request({url: url, qs: lookingfor}, function (err, response, body) {
        if (err) return console.log(err);

        var data = JSON.parse(body);

        if (data['error_message']) return console.log(data['error_message']);

        len = data['results'].length;
        console.log(len)
        if(len == 20){
            var pageindex = data['next_page_token']
            console.log('we need next page');
            var lookingfor = {
                nextpage: pageindex,
                key: appKeyId,
                language: process.argv[3],
                location: process.argv[4],
                radius: "10000",
                //keyword: process.argv[2],
            };
            console.log('token',lookingfor['nextpage'])
            if(fulldata.indexOf(data['results'][1])!= -1) {
                fulldata.push(data['results']);//go thru. just placeid
                console.log(data['results'][1]['name'])
                console.log()
                console.log('token',lookingfor['nextpage'])
                var lookingfor = {
                    nextpage: pageindex,
                    key: appKeyId,
                    //language: process.argv[3],
                    //location: process.argv[4],
                    //radius: "10000",
                    //keyword: process.argv[2],
                };
            }
            setTimeout(function(){ timeout+=5000; NearbySearch(lookingfor); },timeout);
        }else{
            //if(len == 0){}else{fulldata.push(data['results']);}
            async.forEachOf(fulldata, function (value, key) {

                var result = data['results'][key];
                var placeid = result['place_id'];

                getPlaceDetails(lookingfor, key, placeid);
            }, function (err) {
                if (err) console.error(err.message);
            });
        }
    });
}

function getPlaceDetails(urlIndex, pageIndex, placeid)
{
    var url = "https://maps.googleapis.com/maps/api/place/details/json";
    var params = {
        placeid: placeid,
        key: appKeyId
    };
   getDetails(params,pageIndex,urlIndex,url)
}
function getDetails(params,pageIndex,urlIndex,url){
    request({url: url, qs: params}, function (err, response, body) {
        if (err) return console.log(err);

        var data = JSON.parse(body);
        var result = data['result'];

        crawlerData.push({
            name: result['name'],
            address: result['formatted_address']
        });
        console.log(result['name']);

        if(len == crawlerData.length) {
            onFinished(crawlerData, ['name', 'address']);//more dynamic
        }
    });
};
function onFinished(data, fields)
{
    json2csv({data: data, fields: fields}, function (err, csv) {
        if (err) {
            console.log(err);
        }
        var path = process.argv[5];
        if (fs.existsSync(path)){
            fs.appendFile(path, csv, function (err) {
                if (err) {
                    throw err;
                }
                console.log('OK')
            });
        }else{
            fs.writeFile(path, csv, function (err) {
                if (err) {
                    throw err;
                }
                console.log('file saved');
            });
        }

    });
}