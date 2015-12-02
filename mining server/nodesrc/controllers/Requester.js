/*
* Requester
* @desc Makes requests, changes encoding to support äöÄÖåÅ
*/

let request = require("request");
let iconv = require('iconv-lite');

let Requester = function() {

    let requester = {};

    /*
    * Primary function, a get req
    * @param url to request
    * @param cb
    * @return the mined document
     */
    requester.get = function(url,cb){
        //Wrap requests in a timeout so we wont DOS
        setTimeout(()=> {
            request(url, {encoding: null}, (err, res, body)=> {

                console.log("requesting", url);

                if (err) cb(err, null);
                else if(res.statusCode==404){
                    console.log("status", res.statusCode);
                    cb(url+" not found", null);
                }
                else {
                    //For windows & ä ö å | I don't know why uft-8 doesn't work
                    let bodyUtf = iconv.decode(body, 'win1252');body
                   // console.log(bodyUtf);
                    cb(null, bodyUtf);
                }
            });
        },global.REQUEST_TIMEOUT);
    };

    return requester;
};

module.exports = Requester();