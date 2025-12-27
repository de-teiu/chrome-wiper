'use strict';
const KEY_SETTINGS_VISIBLE = "SETTINGS_VISIBLE";
const KEY_SETTINGS_SPEED = "SETTINGS_SPEED";

const DEFAULT_VISIBLE = true;
const DEFAULT_SPEED = "sp1.00";

const SETTINGS_VISIBLE_ID_LIST = ["visible", "invisible"];
const SETTINGS_SPEED_ID_LIST = ["sp0.25", "sp0.50", "sp0.75", "sp1.00", "sp1.25", "sp1.50", "sp2.00", "sp5.00", "sp10.00", "sp100.00"];

/**
 * ワイパー表示更新
 */
const updateWiper = async () => {
    const value = await chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED]);
    const visible = value[KEY_SETTINGS_VISIBLE];
    const speed = value[KEY_SETTINGS_SPEED];
    const settings = {
        "visible": visible,
        "speed": speed,
    };

    // アクティブなタブを取得して表示更新リクエストを送信
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
        try {
            await chrome.tabs.sendMessage(tabs[0].id, JSON.stringify({
                "type": "updateWiper",
                "settings": settings
            }));
        } catch (e) {
            // コンテンツスクリプトがまだ読み込まれていない場合は無視
        }
    }
};

/**
 * 右クリックメニュー設定
 */
const setContextMenu = async (visible, speed) => {
    // 既存のメニューをクリア
    await chrome.contextMenus.removeAll();

    chrome.contextMenus.create({
        id: "root",
        title: "外覇(ワイパァー) 設定",
        contexts: ["all"],
    });

    // 表示設定メニュー
    chrome.contextMenus.create({
        id: "visibleSettings",
        parentId: "root",
        title: "表示",
        contexts: ["all"],
    });

    SETTINGS_VISIBLE_ID_LIST.forEach(id => {
        const title = id === "visible" ? "ON" : "OFF";
        chrome.contextMenus.create({
            id: id,
            parentId: "visibleSettings",
            title: title,
            checked: visible === id,
            type: "radio",
            contexts: ["all"],
        });
    });

    // 速度設定メニュー
    chrome.contextMenus.create({
        id: "speedSettings",
        parentId: "root",
        title: "速度",
        contexts: ["all"],
    });

    SETTINGS_SPEED_ID_LIST.forEach(id => {
        const title = id.replace("sp", "×");
        chrome.contextMenus.create({
            id: id,
            parentId: "speedSettings",
            title: title,
            checked: speed === id,
            type: "radio",
            contexts: ["all"],
        });
    });
};

/**
 * メニュークリック時のハンドラ
 */
chrome.contextMenus.onClicked.addListener(async (info) => {
    const menuItemId = info.menuItemId;

    // 表示設定の処理
    if (SETTINGS_VISIBLE_ID_LIST.includes(menuItemId)) {
        await chrome.storage.local.set({
            [KEY_SETTINGS_VISIBLE]: menuItemId === "visible"
        });
        await updateWiper();
        return;
    }

    // 速度設定の処理
    if (SETTINGS_SPEED_ID_LIST.includes(menuItemId)) {
        await chrome.storage.local.set({
            [KEY_SETTINGS_SPEED]: menuItemId
        });
        await updateWiper();
        return;
    }
});

/**
 * 初期化処理
 */
const initSettings = async () => {
    // 設定読み込み
    const value = await chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED]);
    const visible = value.SETTINGS_VISIBLE || typeof value.SETTINGS_VISIBLE === "undefined" ? "visible" : "invisible";
    const speed = typeof value.SETTINGS_SPEED === "undefined" ? DEFAULT_SPEED : value.SETTINGS_SPEED;
    // 右クリックメニュー生成
    await setContextMenu(visible, speed);
};

// Service Workerの起動時に初期化
initSettings();

/**
 * 拡張機能インストール時の初期設定
 */
chrome.runtime.onInstalled.addListener(async () => {
    // 現在の設定を読み込み
    const value = await chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED]);
    if (typeof value.SETTINGS_VISIBLE === "undefined") {
        // 無ければデフォルトの設定を登録
        await chrome.storage.local.set({
            [KEY_SETTINGS_VISIBLE]: DEFAULT_VISIBLE,
            [KEY_SETTINGS_SPEED]: DEFAULT_SPEED
        });
    }
    // インストール時もメニューを初期化
    await initSettings();
});
