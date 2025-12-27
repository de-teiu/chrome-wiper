'use strict';
const WIPER_ROOT = "resource/wiper_root.png";
const WIPER_BRANCH = "resource/wiper_branch.png";

const KEY_SETTINGS_VISIBLE = "SETTINGS_VISIBLE";
const KEY_SETTINGS_SPEED = "SETTINGS_SPEED";

/**
 * ワイパーを画面に追加
 * @param {*} wiperRootPath ワイパー根本画像ファイルのパス
 * @param {*} wiperBranchPath ワイパー枝画像ファイルのパス
 * @param {*} isRight ワイパーを右側に表示する時true
 * @param {*} settings 設定情報
 */
const createWiper = (wiperRootPath, wiperBranchPath, isRight, settings) => {
    const wiper = document.createElement("span");
    wiper.classList.add("chrome-wiper-base");
    wiper.classList.add("chrome-wiper");
    if (isRight) {
        wiper.classList.add("wiper-position-right");
    }
    //ワイパー(根本部分)を追加
    const rootImg = document.createElement("img");
    rootImg.src = chrome.runtime.getURL(wiperRootPath);
    rootImg.classList.add("wiper-root");
    wiper.appendChild(rootImg);
    //ワイパー(枝部分)を追加
    const branch = document.createElement("span");
    branch.classList.add("chrome-wiper");
    branch.classList.add("wiper-branch");
    const branchImg = document.createElement("img");
    branchImg.src = chrome.runtime.getURL(wiperBranchPath);
    branchImg.classList.add("branch__img");
    branch.appendChild(branchImg);
    wiper.appendChild(branch);

    document.body.appendChild(wiper);

    updateWiper(settings);
};

/**
 * ワイパーの表示/非表示切り替え
 * @param {w} visible trueなら表示
 * @param {*} element styleを更新するDOM要素
 */
const setVisible = (visible, element) => {
    if (visible) {
        element.removeAttribute("style");
    } else {
        element.setAttribute("style", "display:none;");
    }
};

/**
 * ワイパーの回転にかける時間を設定
 * @param {*} duration 時間
 * @param {*} animationName 適用するCSSアニメーション名
 * @param {*} element styleを更新するDOM要素 
 */
const setWiperRotateSpeed = (duration, animationName, element) => {
    element.setAttribute("style", `animation: ${animationName} ${duration}s linear 0s infinite alternate;`);
};

/**
 * 1回のアニメーションにかける時間を算出
 * @param {*} speed 速度倍率
 */
const calcDuration = (speed) => {
    return Math.round((1.5 / speed) * 100) / 100;
}

/**
 * ワイパーの設定を更新する
 */
const updateWiper = (settings) => {
    // 表示/非表示切り替え
    document.querySelectorAll(".chrome-wiper-base").forEach(element => {
        setVisible(settings.visible, element);
    });
    //アニメーションにかける時間を算出
    const speedNum = Number(settings.speed.replace("sp", ""));
    const duration = calcDuration(speedNum);

    // 速度切り替え
    document.querySelectorAll(".wiper-root").forEach(element => {
        setWiperRotateSpeed(duration, "rotation", element);
    });
    document.querySelectorAll(".wiper-branch").forEach(element => {
        setWiperRotateSpeed(duration, "rotation", element);
    });
    document.querySelectorAll(".branch__img").forEach(element => {
        setWiperRotateSpeed(duration, "rotation_branch", element);
    });
};

/**
 * 初期化処理
 */
const initWiper = () => {
    //現在の設定を取得
    chrome.storage.local.get([KEY_SETTINGS_VISIBLE, KEY_SETTINGS_SPEED], (value) => {
        const visible = value[KEY_SETTINGS_VISIBLE];
        const speed = value[KEY_SETTINGS_SPEED];
        const settings = {
            "visible": visible,
            "speed": speed,
        };
        //ワイパーの初期化
        createWiper(WIPER_ROOT, WIPER_BRANCH, false, settings);
        createWiper(WIPER_ROOT, WIPER_BRANCH, true, settings);
    });
    
    //backgroundからのリクエストのリスナー設定
    chrome.runtime.onMessage.addListener(
        (request, _sender, sendResponse) => {
            if (!request) {
                sendResponse({});
                return true;
            }
            const result = JSON.parse(request);
            if (result.type === "updateWiper") {
                //ワイパーの設定更新
                updateWiper(result.settings);
            }
            sendResponse({});
            return true;
        });
};

initWiper();