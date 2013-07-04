const Soup = imports.gi.Soup;
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
    this.buildShortenizerUrl = function(url){
        return {
            url : "http://git.io/create",
            postParams : {
                url : url
            },
            method : "POST"
        }
    };

    // store it in the function. It will allow to define many shortenize services (bit.ly, github, personnal shortenizer... and so on)
    this.buildshortLinkHandler = function(message){
        return "http://git.io/"+message;
    };

    this.logger = logger;
    
    //Count Number of failures to prevent 
    this.totalFailureCount = 0;

    // this.callbacks={
    //     onError:undefined,
    //     onNewFeed:undefined
    // };

    if (a_params != undefined){
       


        // if (a_params.callbacks!=undefined){
        //     this.callbacks.onError=a_params.callbacks.onError;
        //     this.callbacks.onNewFeed=a_params.callbacks.onNewFeed;
        // }
    }
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

    try{
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
            let response = self.parseResponse(message);



            if(response !== false){
                successCallback(response);
            }

        });

        // self.parseResponse(response);


    }catch(e){
        this.logger.logVerbose(" Error happened while querying shortnize service : " + e);
    }

    
   
}



Shortenizer.prototype.parseResponse = function(message) {

    try {


        if (message.status_code !== 200) {
            this.logger.log("Error status code of: " + message.status_code + " | message: " + message.response_body.data);
            return false;
        }



        this.logger.logVerbose(message.response_body.data);
        this.logger.logVerbose(this.buildshortLinkHandler(message.response_body.data));
        return this.buildshortLinkHandler(message.response_body.data);
        //return message.response_body.data;
        
    } catch (e){
        this.logger.logVerbose("ERROR receiving data : "  + e);
    }
}

Shortenizer.prototype.parseJsonResponse = function(request){
    var rawResponseJSON = request.response_body.data;
    var jsonResponse = JSON.parse(rawResponseJSON);
    return jsonResponse;
}

