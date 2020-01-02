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
const setContextMenu = () => {
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

/**
 * 初期化処理
 */
const initSettings = () => {
    //右クリックメニュー更新
    setContextMenu();
    //現在の設定を取得
    chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED], function (value) {
        //設定が存在しなければデフォルト値を指定
        const visible = (typeof value.visible === 'undefined') ? true : value.visible;
        const speed = (typeof value.speed === 'undefined') ? "sp1.00" : value.speed;
        chrome.contextMenus.update(speed, {
            'checked': true
        });
        chrome.contextMenus.update(visible ? "visible" : "invisible", {
            'checked': true
        });
        //設定を更新する
        chrome.storage.local.set({
            [KEY_SETTINGS_VISIBLE]: visible,
            [KEY_SETTINGS_SPEED]: speed
        }, () => {});
    });
};
initSettings();