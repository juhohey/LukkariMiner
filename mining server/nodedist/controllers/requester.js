"use strict";

/*
* Requester
* @desc Makes requests, changes encoding to support äöÄÖåÅ
*/

var request = require("request");
var iconv = require('iconv-lite');

var Requester = function Requester() {

    var requester = {};

    /*
    * Primary function, a get req
    * @param url to request
    * @param cb
    * @return the mined document
     */
    requester.get = function (url, cb) {
        //Wrap requests in a timeout so we wont DOS
        setTimeout(function () {
            request(url, { encoding: null }, function (err, res, body) {

                console.log("requesting", url);

                if (err) cb(err, null);else if (res.statusCode == 404) {
                    console.log("status", res.statusCode);
                    cb(url + " not found", null);
                } else {
                    //For windows & ä ö å | I don't know why uft-8 doesn't work
                    var bodyUtf = iconv.decode(body, 'win1252');
                    cb(null, bodyUtf);
                }
            });
        }, global.REQUEST_TIMEOUT);
    };

    return requester;
};

module.exports = Requester();