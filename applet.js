/** Allows import of other files  */
imports.searchPath.push( imports.ui.appletManager.appletMeta["shorturl@sneakybobito.com"].path );

const Lang = imports.lang;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const St = imports.gi.St;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;

/** Custom Imports START **/
const Shrtnzr=imports.shortenizer;
const Logger=imports.logger;
/** Custom Imports END **/

const APPLET_ICON = global.userdatadir + "/applets/github-projects@morgan-design.com/icon.png";

function MyApplet(orientation) {
    this._init(orientation);
}
 
MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,
 
    _init: function(orientation) {
        Applet.IconApplet.prototype._init.call(this, orientation);
 
        try {
            this.set_applet_icon_name("force-exit");
            this.set_applet_tooltip(_("Replace clipboard by shortenized URL"));

            //Setup logger
            this.logger = new Logger.Logger({
                'verboseLogging':true, 
                'UUID':"shortenize-url"
            })

            

        }
        catch (e) {
            global.logError(e);
            this.showNotify({title:"starting failled",content:"Short URL applet couldn't start"});
        }
    },


    showNotify: function(notifyContent){
        let title = notifyContent.title;
        let msg = notifyContent.content;
        if(notifyContent.append != undefined){ 
            switch(notifyContent.append){
                case "USER_NAME":
                    msg += this.gh.username;
            }
        }
        let notification = "notify-send \""+title+"\" \""+msg+"\" -i " + APPLET_ICON + " -a GIT_HUB_EXPLORER -t 10 -u low";
        this.logger.logVerbose("notification call = [" + notification + "]")
        Util.spawnCommandLine(notification);
    },
 

    on_applet_clicked: function(event) {

        let self = this;

        try {
            shortenizer=new Shrtnzr.Shortenizer({},this.logger);

            let clipboard = St.Clipboard.get_default();

            clipboard.get_text( function(clipboard,text){

                shortenizer.queryShortenizeService(text,function(response){
                    self.logger.logVerbose(response);
                    self.showNotify({title:"url shorenized",content:response});
                    clipboard.set_text(response);
                });

            } );


        }
        catch (e) {
            global.logError(e);
        }

    }
};

function main(metadata, orientation) {
    let myApplet = new MyApplet(orientation);
    return myApplet;
}