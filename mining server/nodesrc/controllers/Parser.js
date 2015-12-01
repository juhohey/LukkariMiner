/*
* Parser
* @desc Parses DOM strings
*/

let $ = require("cheerio");
let weekFact = require(__dirname+"/week");
let Pattern = require(__dirname+"/pattern");

let Parser = function( ) {
    //this
    let parser = {};

    /*
    * Initial parse,  parse campus html page
    * @param mined html
    * @param selector to find in html
     */
    parser.parseLinks = function(DOM, selector, element, attributes, url,minedPages){

        let parsed = {
            links: parser.parseZ(DOM).selector(selector).find(element).attr(attributes),
            week : parser.parseTimeTable(DOM),
            isClassList: parser.parseHeader(DOM, false),
            isInFuture: parser.parseHeader(DOM, true)
        };

        if (parsed.week.scedule){
            parsed.isWeek = true;
            parsed.dateRange = week.dateRange;
        }

        function doLinks(list){

            let prev = {href:""};
            let returnList = [];

            for(let i = 0;i<list.length;i++){

                if(prev.href===list[i].href||list[i].href.match(Pattern.obsolete)!=null||!list[i].href||!list[i].href){}
                else{
                    prev.href = list[i].href;
                    if(list[i].href) list[i].href = formatLink(url,list[i].href);
                    //dont add if already mined
                    //if(minedPages.indexOf(list[i].href)>-1) {console.log("Dupe found...",)}
                    returnList.push(list[i]);
                }

            }

            function formatLink(root, newUrl){

                let returnUrl;

                if(root.indexOf("htm")>0) returnUrl = filterUrlPrevious(root) + "/"+ newUrl;
                else returnUrl = root + "/"+newUrl;

                return returnUrl;

                function filterUrlPrevious(arg){

                    let urlArr = arg.split("/");

                    urlArr.splice(urlArr.length-1, 1);
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

    function killMimosa(arr){

        for(let i = 0;i<arr.length;i++){
            if (arr[i].href.indexOf(Pattern.mimosa) >-1){
                delete arr[i];
                return;
            }
        }
    }
    /*
    * Parse header
    * @param DOM
     */
    parser.parseHeader = function(DOM, isRelevant){

        let headerText = $(DOM).find(Pattern.selector.header).text();
        if(!isRelevant) return (headerText.match(Pattern.header) != null);
        else return parseRelevancy();

        function parseRelevancy(){

            headerText = headerText.replace(Pattern.weekNumber,"");
            headerText = headerText.replace(/\s/gi,"").replace(/[^\d\.]/gi,"");

            let sArray = headerText.split(Pattern.dateRangeSeparator);
            let d = new Date();

            let mD1 = sArray[0].split(".");
            mD1 = new Date(mD1[2] +"-"+  mD1[1] +"-"+  mD1[0]);
            let mD2 = sArray[0].split(".");
            mD2 = new Date(mD2[2] +"-"+  mD2[1] +"-"+  mD2[0]);

            if(d<=mD1||d<=mD2) return true;
            return false;
        }
    };

    /*
    * Parse timetables...
     */
    parser.parseTimeTable = function(DOM){

        let elArray  = $(DOM).find("td");
        let textArray = [];

        for(let i = 0;i<elArray.length;i++){
            $(elArray[i]).text(
                $(elArray[i]).text().replace(/\r\n/gi,'@br@')
            );

            let el = {};
            el.text = $(elArray[i]).text();

            if( $(elArray[i]).attr("rowspan")) el.duration = $(elArray[i]).attr("rowspan");
            if( $(elArray[i]).attr("colspan")) el.colspan = $(elArray[i]).attr("colspan");

            textArray.push(el);
        }
       // console.log(textArray);
        let week = weekFact.parseWeek(textArray);
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
    parser.parseZ = function(DOM){

        let setTobeParsed = DOM;
        return {
            selector : function(selectorArg) { //console.log("parser find");

                let initialDom = $(setTobeParsed).find(selectorArg);
                return {
                    find: function(elementArg){

                        let el = elementArg;
                        return {
                            attr : function (attributes) {

                                let elementList = [];
                                //find attributes from element
                                for(let key in initialDom){  //console.log(initialDom[key]);
                                    if(initialDom.hasOwnProperty(key)){
                                        if(initialDom[key].name===el) {

                                            //elemtn obj
                                            let elemn = {};
                                            for(let i = 0;i<attributes.length;i++){
                                                //set to null if doesn't have
                                                elemn[attributes[i]] = initialDom[key].attribs ? initialDom[key].attribs[attributes[i]] : null;
                                                elemn.name= $(initialDom[key]).text(); /*initialDom[key].children[0].data */
                                            }
                                            elementList.push(elemn);
                                        }
                                    }
                                } //for var key
                               // console.log(elementList);
                                return elementList;
                            } /*attr */
                        };/*find */
                    }/*selector */
                };/*selector */
            }
        };/*selector */
    };


    return parser;
};

module.exports = Parser();