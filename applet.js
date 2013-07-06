/** Allows import of other files  */
imports.searchPath.push( imports.ui.appletManager.appletMeta["shorturl@sneakybobito.com"].path );

const Lang = imports.lang;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;

/** Custom Imports START **/
const Shrtnzr=imports.shortenizer;
const Logger=imports.logger;
/** Custom Imports END **/




const APPLET_ICON = global.userdatadir + "/applets/shorturl@sneakybobito.com/tray_icon.png";

const shortenizerServices = [

    {
        icon : "github-icon",
        name : "git.io",
        requestPrepareHandler : function(url){
            return {
                url : "http://git.io/create",
                postParams : {
                    url : url
                },
                method : "POST"
            }
        },
        buildshortLinkHandler : function(message){
            return "http://git.io/"+message;
        }

    }

]

function MyApplet(orientation) {
    this._init(orientation);
}
 
MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,
 
    _init: function(orientation) {
        Applet.IconApplet.prototype._init.call(this, orientation);
 
        try {
            this.set_applet_icon_path(APPLET_ICON)
            this.set_applet_tooltip(_("Replace clipboard by shortenized URL ?"));

            //Setup logger
            this.logger = new Logger.Logger({
                'verboseLogging':true, 
                'UUID':"shortenize-url"
            });

            // Menu setup
            this.menu = new Applet.AppletPopupMenu(this, orientation);

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menuManager.addMenu(this.menu);



            for(let i=0;i<shortenizerServices.length;i++){
                let self=this;
                self.logger.logVerbose(i);
                let menuitem = new ShrtnzrServiceMenu(shortenizerServices[i].name, shortenizerServices[i].icon);

                let rHandler = shortenizerServices[i].requestPrepareHandler;
                let bHandler = shortenizerServices[i].buildshortLinkHandler;
                let nameShrtnzr = shortenizerServices[i].name;

                menuitem.connect('activate', function(){
                    
                    try {
                        shortenizer=new Shrtnzr.Shortenizer(
                            {
                                "requestPrepareHandler":rHandler,
                                "buildshortLinkHandler":bHandler,
                            }
                        ,self.logger);

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
                        self.showNotify({title:"Clipboard couldnt be shortenized with "+nameShrtnzr,content:e});
                        global.logError(e);
                    }

                });
                this.menu.addMenuItem(menuitem);
            }

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

        this.menu.toggle();
    }
};



function ShrtnzrServiceMenu() {
    this._init.apply(this, arguments);
}

ShrtnzrServiceMenu.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function (label, icon) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {});

        this.label = new St.Label({ text: label });
        this.addActor(this.label);
        
        var file = Gio.file_new_for_path( global.userdatadir + "/applets/shorturl@sneakybobito.com/"+icon+".png" );
        var iconFile = new Gio.FileIcon({ file: file });
        this.addActor(new St.Icon({ gicon: iconFile, icon_size: 32 }));
    },

};

function main(metadata, orientation) {
    let myApplet = new MyApplet(orientation);
    return myApplet;
}