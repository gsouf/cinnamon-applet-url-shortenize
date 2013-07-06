const Soup = imports.gi.Soup;
const Util = imports.misc.util;
/**
*
* a_params keys :
*  
*
*
*
*    
*/
function Shortenizer(a_params, logger){

    // store it in the function. It will allow to define many shortenize services (bit.ly, github, personnal shortenizer... and so on)
    this.buildShortenizerUrl = a_params.requestPrepareHandler;

    // store it in the function. It will allow to define many shortenize services (bit.ly, github, personnal shortenizer... and so on)
    this.buildshortLinkHandler = a_params.buildshortLinkHandler;

    this.logger = logger;

    try {
        this.httpSession = new Soup.SessionAsync();
    } catch (e){ this.logger.logVerbose(" httpsession init failled "); throw 'Shortenizer : Creating SessionAsync failed : '+e; }
    
    try {
        Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
    } catch (e){ throw 'Shortenizer : Adding ProxyResolverDefault failed: '+e; }
}

/**
* true if the instance was initialized
*/
Shortenizer.prototype.initialised = function(){
    return true
    // return this.username != undefined 
    //     && this.callbacks.onError != undefined 
    //     && this.callbacks.onNewFeed != undefined;
}

Shortenizer.prototype.queryShortenizeService = function(urlToShortenize,successCallback){

    let self = this;


    let requestDefinition = this.buildShortenizerUrl(urlToShortenize);

    this.logger.logVerbose(requestDefinition.url);

    if(!requestDefinition.url)
        throw "No url available";

    if(!requestDefinition.method)
        requestDefinition.method = requestDefinition.method || (requestDefinition.postParams != undefined ? "POST" : "GET")

    urlStr=requestDefinition.url;

    if(requestDefinition.method == "POST" && requestDefinition.postParams){
        urlStr+="?";
        let i=0;
        for( let name in requestDefinition.postParams){
            if(i>0)
                urlStr+="&"
            urlStr+=name+"="+requestDefinition.postParams[name];
            i++;
        }
    }

    this.logger.logVerbose(urlStr);

    let message = Soup.Message.new('POST', urlStr);

    

    this.httpSession.queue_message(message, function(session,message){

        self.logger.logVerbose(" Query done");
        
        try{
            let response = self.parseResponse(message);

            if(response !== false){
                successCallback(response);
            }

        }catch(e){
            throw e;
        }


    

    });

    // self.parseResponse(response);


    
   
}



Shortenizer.prototype.parseResponse = function(message) {

    try {


        if (message.status_code !== 200) {
            this.logger.log("Error status code of: " + message.status_code + " | message: " + message.response_body.data);
            throw ""+message.response_body.data;
        }



        this.logger.logVerbose(message.response_body.data);
        this.logger.logVerbose(this.buildshortLinkHandler(message.response_body.data));
        return this.buildshortLinkHandler(message.response_body.data);
        //return message.response_body.data;
        
    } catch (e){
        this.logger.logVerbose("ERROR receiving data : "  + e);
        throw e;
    }
}

Shortenizer.prototype.parseJsonResponse = function(request){
    var rawResponseJSON = request.response_body.data;
    var jsonResponse = JSON.parse(rawResponseJSON);
    return jsonResponse;
}

