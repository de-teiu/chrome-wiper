'use strict';
const KEY_SETTINGS_VISIBLE = "SETTINGS_VISIBLE";
const KEY_SETTINGS_SPEED = "SETTINGS_SPEED";

/**
 * ワイパー表示更新
 */
const updateWiper = () => {
    chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED], (value) => {
        const visible = value[KEY_SETTINGS_VISIBLE];
        const speed = value[KEY_SETTINGS_SPEED];
        const settings = {
            "visible": visible,
            "speed": speed,
        };
        //表示更新リクエストをscript.jsのロジックに送信
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendMessage(tab.id, JSON.stringify({
                "type": "updateWiper",
                "settings": settings
            }), function (response) {});
        });
    });
};

/**
 * 右クリックメニュー設定
 */
const setContextMenu = (visible,speed) => {
    chrome.contextMenus.create({
        id: "root",
        title: "外覇(ワイパァー) 設定",
        contexts: ["all"],
    });

    //表示設定メニュー
    chrome.contextMenus.create({
        id: "visibleSettings",
        parentId: "root",
        title: "表示",
        contexts: ["all"],
    });
    const SETTINGS_VISIBLE_ID_LIST = ["visible", "invisible"];
    SETTINGS_VISIBLE_ID_LIST.forEach(id => {
        const title = id === "visible" ? "ON" : "OFF";
        chrome.contextMenus.create({
            id: id,
            parentId: "visibleSettings",
            title: title,
            checked: visible === id,
            "type": "radio",
            contexts: ["all"],
            onclick: info => {
                chrome.storage.local.set({
                    [KEY_SETTINGS_VISIBLE]: id === "visible"
                }, () => {
                    updateWiper();
                });
            }
        });
    });
    //速度設定メニュー
    chrome.contextMenus.create({
        id: "speedSettings",
        parentId: "root",
        title: "速度",
        contexts: ["all"],
    });
    const SETTINGS_SPEED_ID_LIST = ["sp0.25", "sp0.50", "sp0.75", "sp1.00", "sp1.25", "sp1.50", "sp2.00", "sp5.00", "sp10.00", "sp100.00"];
    SETTINGS_SPEED_ID_LIST.forEach(id => {
        const title = id.replace("sp", "×");
        chrome.contextMenus.create({
            id: id,
            parentId: "speedSettings",
            title: title,
            checked: speed === id,
            "type": "radio",
            contexts: ["all"],
            onclick: info => {
                chrome.storage.local.set({
                    [KEY_SETTINGS_SPEED]: id
                }, () => {
                    updateWiper();
                });
            }
        });
    });
};

const DEFAULT_VISIBLE = true;
const DEFAULT_SPEED = "sp1.00";

/**
 * 初期化処理
 */
const initSettings = () => {
    //設定読み込み
    chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED], (value) => {
        const visible = value.SETTINGS_VISIBLE || typeof value.SETTINGS_VISIBLE === "undefined" ? "visible" : "invisible";
        const speed = typeof value.SETTINGS_SPEED === "undefined" ? DEFAULT_SPEED : value.SETTINGS_SPEED;
        //右クリックメニュー生成
        setContextMenu(visible,speed);
    });
};
initSettings();

/**
 * 拡張機能インストール時の初期設定
 */
chrome.runtime.onInstalled.addListener(() => {
    //現在の設定を読み込み
    chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED], (value) => {
        if(typeof value.SETTINGS_VISIBLE === "undefined"){
            //無ければデフォルトの設定を登録
            chrome.storage.local.set({
                [KEY_SETTINGS_VISIBLE]: DEFAULT_VISIBLE,
                [KEY_SETTINGS_SPEED]: DEFAULT_SPEED
            }, () => {
            });
        }
    });
    
});