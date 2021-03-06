const DBus = imports.dbus;
const Main = imports.ui.main;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const SessionIface = {
    name: "org.gnome.SessionManager",
	methods: [
		{ name: "Inhibit", inSignature: "susu", outSignature: "u" },
		{ name: "Uninhibit", inSignature: "u", outSignature: "" }
	]
};

let SessionProxy = DBus.makeProxyClass(SessionIface);

function PresentationMode() {
	let present;	
	this._inhibit = undefined;
	this._sessionProxy = new SessionProxy(DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager');
	this.m = new PopupMenu.PopupSwitchMenuItem(_("Presentation Mode"));
	this.m.connect('toggled', Lang.bind(this,
		function () {
			if (this._inhibit) {
				this._sessionProxy.UninhibitRemote(this._inhibit);
				this._inhibit = undefined;
				Main.Util.spawn(['xset', '+dpms']); // disable
				Main.Util.spawn(['xset', 's', 'on']);
			}
			else {
				try {
					this._sessionProxy.InhibitRemote(
							"presentor", 0,
							"Presentation Mode", 9,
							Lang.bind(this, this._onInhibit)
					);
					Main.Util.spawn(['xset', '-dpms']); // enable
					Main.Util.spawn(['xset', 's', 'off']);
				}
				catch (e) { 
				//
				}
			}
		} 	
	));
	this.menu.addMenuItem(this.m);
	this._onInhibit = function (inhibit_cookie) {
		this._inhibit = inhibit_cookie;
	}
}

function init(metadata) {
	// no init data
}

let Power;

function enable() {
	Power = Main.panel._statusArea.battery;
	PresentationMode.call(Power);
}

function disable() {
	Power = Main.panel._statusArea.battery;
	Power.m.destroy();
	if (Power._inhibit) {
		Power._sessionProxy.UninhibitRemote(Power._inhibit);
		Power._inhibit = undefined;
		Main.Util.spawn(['xset', '+dpms']); // disable presentation mode
		Main.Util.spawn(['xset', 's', 'on']);
	}
}