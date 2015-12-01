"use strict";

/*
* Parser
* @desc Parses DOM strings
*/

var $ = require("cheerio");
var weekFact = require(__dirname + "/week");
var Pattern = require(__dirname + "/pattern");

var Parser = function Parser() {
    //this
    var parser = {};

    /*
    * Initial parse,  parse campus html page
    * @param mined html
    * @param selector to find in html
     */
    parser.parseLinks = function (DOM, selector, element, attributes, url, minedPages) {

        var parsed = {
            links: parser.parseZ(DOM).selector(selector).find(element).attr(attributes),
            week: parser.parseTimeTable(DOM),
            isClassList: parser.parseHeader(DOM, false),
            isInFuture: parser.parseHeader(DOM, true)
        };

        if (parsed.week.scedule) {
            parsed.isWeek = true;
            parsed.dateRange = week.dateRange;
        }

        function doLinks(list) {

            var prev = { href: "" };
            var returnList = [];

            for (var i = 0; i < list.length; i++) {

                if (prev.href === list[i].href || list[i].href.match(Pattern.obsolete) != null || !list[i].href || !list[i].href) {} else {
                    prev.href = list[i].href;
                    if (list[i].href) list[i].href = formatLink(url, list[i].href);
                    //dont add if already mined
                    //if(minedPages.indexOf(list[i].href)>-1) {console.log("Dupe found...",)}
                    returnList.push(list[i]);
                }
            }

            function formatLink(root, newUrl) {

                var returnUrl = undefined;

                if (root.indexOf("htm") > 0) returnUrl = filterUrlPrevious(root) + "/" + newUrl;else returnUrl = root + "/" + newUrl;

                return returnUrl;

                function filterUrlPrevious(arg) {

                    var urlArr = arg.split("/");

                    urlArr.splice(urlArr.length - 1, 1);
                    urlArr = urlArr.join("/");

                    return urlArr;
                }
            }
            return returnList;
        }
        parsed.links = doLinks(parsed.links);
        killMimosa(parsed.links);
        return parsed;
    };

    function killMimosa(arr) {

        for (var i = 0; i < arr.length; i++) {
            if (arr[i].href.indexOf(Pattern.mimosa) > -1) {
                delete arr[i];
                return;
            }
        }
    }
    /*
    * Parse header
    * @param DOM
     */
    parser.parseHeader = function (DOM, isRelevant) {

        var headerText = $(DOM).find(Pattern.selector.header).text();
        if (!isRelevant) return headerText.match(Pattern.header) != null;else return parseRelevancy();

        function parseRelevancy() {

            headerText = headerText.replace(Pattern.weekNumber, "");
            headerText = headerText.replace(/\s/gi, "").replace(/[^\d\.]/gi, "");

            var sArray = headerText.split(Pattern.dateRangeSeparator);
            var d = new Date();

            var mD1 = sArray[0].split(".");
            mD1 = new Date(mD1[2] + "-" + mD1[1] + "-" + mD1[0]);
            var mD2 = sArray[0].split(".");
            mD2 = new Date(mD2[2] + "-" + mD2[1] + "-" + mD2[0]);

            if (d <= mD1 || d <= mD2) return true;
            return false;
        }
    };

    /*
    * Parse timetables...
     */
    parser.parseTimeTable = function (DOM) {

        var elArray = $(DOM).find("td");
        var textArray = [];

        for (var i = 0; i < elArray.length; i++) {
            $(elArray[i]).text($(elArray[i]).text().replace(/\r\n/gi, '@br@'));

            var el = {};
            el.text = $(elArray[i]).text();

            if ($(elArray[i]).attr("rowspan")) el.duration = $(elArray[i]).attr("rowspan");
            if ($(elArray[i]).attr("colspan")) el.colspan = $(elArray[i]).attr("colspan");

            textArray.push(el);
        }
        // console.log(textArray);
        var week = weekFact.parseWeek(textArray);
        //console.log("RESRESRESRE")
        //console.log(week);
        return week;
    };

    /*
     * Parser actual, pipe methods <3
     * @param: a mined DOM
     *   .find()
     *   @param selector to find in dom
     */
    parser.parseZ = function (DOM) {

        var setTobeParsed = DOM;
        return {
            selector: function selector(selectorArg) {
                //console.log("parser find");

                var initialDom = $(setTobeParsed).find(selectorArg);
                return {
                    find: function find(elementArg) {

                        var el = elementArg;
                        return {
                            attr: function attr(attributes) {

                                var elementList = [];
                                //find attributes from element
                                for (var key in initialDom) {
                                    //console.log(initialDom[key]);
                                    if (initialDom.hasOwnProperty(key)) {
                                        if (initialDom[key].name === el) {

                                            //elemtn obj
                                            var elemn = {};
                                            for (var i = 0; i < attributes.length; i++) {
                                                //set to null if doesn't have
                                                elemn[attributes[i]] = initialDom[key].attribs ? initialDom[key].attribs[attributes[i]] : null;
                                                elemn.name = $(initialDom[key]).text(); /*initialDom[key].children[0].data */
                                            }
                                            elementList.push(elemn);
                                        }
                                    }
                                } //for var key
                                // console.log(elementList);
                                return elementList;
                            } /*attr */
                        }; /*find */
                    } /*selector */
                }; /*selector */
            }
        }; /*selector */
    };

    return parser;
};

module.exports = Parser();