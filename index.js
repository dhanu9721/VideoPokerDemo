const WindowEventTypes = {
    OrientationEvent: "OrientationEvent",
    FullScreenEvent: "FullScreenEvent",
};

var encryptedData = "";
var decryptedData = {};

const DecryptEventListner = "DecryptEventListner";

const Edit_Box_Event_Name = "Edit_Box_Event_Name";
const DecryptionEvent = "DecryptionEvent";

const OrientationTypes = {
    Landscape: "Landscape",
    Portrait: "Portrait",
    Auto: "Auto",
};

const baseURL = "App/index.html";

let isAndroid = false;
let isIphone = false;
let isIPad = false;

let isEditBoxActive = false;
let currentGameOrientation = OrientationTypes.Auto;
let lastOrientation = null;
let isGameOrientationChange = false;
let isOrientationGIFActive = false;
let isAllowShowSwipe = false;
let isSwipeForceStop = false;
let checkScrollInterval = null;
let orientationChangeCount = 0;
let isAllowedToFullScreenInOtherDevices = false;

let isOnTouchStart = false;
let isOnTouchEnd = false;
const parsedUrl = new URL(window.location.href);
const searchParams = parsedUrl.searchParams;
let gameId = searchParams.get("gameId");
let localRefToken = searchParams.get("refreshToken");
let gameCode = searchParams.get("gameCode");
let gameCategory = searchParams.get("gameCategory");
let callback = searchParams.get("callback");
let params = {};
const iframeURL = `${baseURL}`;

// Set the src attribute of the iframe with the constructed URL
const iframe = document.getElementById("gameFrame");
iframe.src = iframeURL;

/**EVENT LISTENERS */

window.addEventListener("orientationchange", function () {
    console.log("orientationchange: ", this.window.orientation);
    if (this.window.orientation === 90 || this.window.orientation === -90) {
        // Portrait orientation
        console.log("inside Portrait orientation");
        lastOrientation = OrientationTypes.Landscape;
        // showVerticalOrientationGIF();
    } else {
        //LandScape orientation
        console.log("inside LandScape orientation");
        lastOrientation = OrientationTypes.Portrait;
        // showHorizontalOrientationGIF();
    }

    handleOrientationChange();
    orientationChangeCount++;
});

document.addEventListener(
    "touchstart",
    (event) => {
        isOnTouchStart = true;
        isOnTouchEnd = false;
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    },
    { passive: false }
);

document.addEventListener(
    "touchend",

    (event) => {
        console.log("gsl;knkflbk", isAllowedToFullScreenInOtherDevices);
        if (isAllowedToFullScreenInOtherDevices) {
            makeScreenInOtherDevices();
            isOnTouchStart = false;
        }
        isOnTouchEnd = true;
        if (event.scale !== 1) {
            event.preventDefault();
        }
    },
    { passive: false }
);

document.addEventListener(
    "touchmove",
    (event) => {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    },
    { passive: false }
);

/** METHODS */

function generateQueryString(params) {
    const queryString = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join("&");
    return queryString ? `?${queryString}` : "";
}

function addCustomEventListners() {
    for (const eventName in WindowEventTypes) {
        window.addEventListener(eventName, customEventHandler);
    }
    window.addEventListener(Edit_Box_Event_Name, editBoxEventHandler);
    window.addEventListener(DecryptionEvent, decryptEventHandler);
}

function removeCustomEventListners() {
    for (const eventName in WindowEventTypes) {
        window.removeEventListener(eventName, customEventHandler);
    }
    window.removeEventListener(Edit_Box_Event_Name, editBoxEventHandler);
    window.removeEventListener(DecryptionEvent, decryptEventHandler);
}

function editBoxEventHandler(eventData) {
    // console.log("Event handler : ", eventData.detail);
    isEditBoxActive = eventData.detail.isEditBoxActive;
}

function decryptEventHandler(eventData) {
    let data = decrypt(encryptedData, eventData.detail.key, eventData.detail.iv);
    // let data = LocalData(encryptedData, eventData.detail.key, eventData.detail.iv);
    let decryptedDataEvent = new CustomEvent(DecryptEventListner, {
        detail: {
            od: data,
        },
        bubbles: true,
        cancelable: true,
        composed: false,
    });
    let iframe = document.getElementById("gameFrame");
    iframe.contentWindow.postMessage(decryptedDataEvent.detail, "*");
    console.log("decryptedDataEvent : ", data);
}

function customEventHandler(e) {
    currentGameOrientation = e.detail.orientation;
    if (lastOrientation != currentGameOrientation) isGameOrientationChange = true;
    checkCurrentOrientation(e.detail.orientation);
}

function handleOrientationChange() {
    if (currentGameOrientation == OrientationTypes.Auto && lastOrientation == OrientationTypes.Portrait && (isIphone || isIPad)) {
        // console.log("handleOrientationChange hideOrientationGIF 35", currentGameOrientation, lastOrientation, window.orientation);
        hideOrientationGIF();
        hideSwipeGIF();
        isAllowShowSwipe = false;
        // st
        // checkScroll();
    } else if (!isGameOrientationChange) {
        // console.log("handleOrientationChange", currentGameOrientation, lastOrientation, window.orientation);
        if (currentGameOrientation == OrientationTypes.Landscape && lastOrientation == OrientationTypes.Portrait) {
            showHorizontalOrientationGIF();
        } else if (currentGameOrientation == OrientationTypes.Portrait && lastOrientation == OrientationTypes.Landscape) {
            showVerticalOrientationGIF();
        } else {
            hideOrientationGIF();
            checkScroll();
        }
    } else if (orientationChangeCount == 0) {
        checkOrientatonOfPlayingGame(currentGameOrientation);
    } else {
        // console.log("handleOrientationChange hideOrientationGIF", currentGameOrientation, lastOrientation, window.orientation);
        hideOrientationGIF();
        checkScroll();
    }
    isGameOrientationChange = false;
}

function checkCurrentOrientation(newOrientation) {
    // console.log("checkCurrentOrientation", newOrientation, currentGameOrientation, lastOrientation, window.orientation, orientationChangeCount);
    if (orientationChangeCount == 0) {
        checkOrientatonOfPlayingGame(newOrientation);
    } else {
        if (newOrientation == OrientationTypes.Landscape && (window.orientation === 90 || window.orientation === -90)) {
            hideOrientationGIF();
            checkScroll();
        } else if (newOrientation == OrientationTypes.Portrait && (window.orientation === 0 || window.orientation === 180)) {
            hideOrientationGIF();
            checkScroll();
        } else if (newOrientation == OrientationTypes.Auto) {
            hideOrientationGIF();
            if (window.orientation === 0 || window.orientation === 180) {
                hideSwipeGIF();
            } else {
                checkScroll();
            }
        } else {
            if ((window.orientation == 0 || window.orientation === 180) && lastOrientation == OrientationTypes.Portrait) {
                // Portrait orientation
                showHorizontalOrientationGIF();
            } else if ((window.orientation === 90 || window.orientation === -90) && lastOrientation == OrientationTypes.Landscape) {
                showVerticalOrientationGIF();
            } else {
                hideOrientationGIF();
                checkScroll();
            }
        }
    }
}

function checkOrientatonOfPlayingGame(newOrientation) {
    if (newOrientation == OrientationTypes.Portrait && (window.orientation === 90 || window.orientation === -90)) {
        // checkScroll();
        showVerticalOrientationGIF();
    } else if (newOrientation == OrientationTypes.Landscape && (window.orientation === 0 || window.orientation === 180)) {
        showHorizontalOrientationGIF();
    } else {
        hideOrientationGIF();
        checkScroll();
    }
}

function checkOrientationInitially() {
    // console.log("checking orientation initially", window.orientation);
    // console.log("checkOrientationInitially", currentGameOrientation, lastOrientation, window.orientation);
    if (window.orientation === 0) {
        // Portrait orientation
        hideOrientationGIF();
        checkScroll();
        showHorizontalOrientationGIF();
        currentGameOrientation = OrientationTypes.Landscape;
        lastOrientation = OrientationTypes.Landscape;
    } else {
        currentGameOrientation = OrientationTypes.Landscape;
        lastOrientation = OrientationTypes.Landscape;
    }
}

function showHorizontalOrientationGIF() {
    // return
    let orientationElement = window.document.getElementById("orientation");
    if (orientationElement) {
        isOrientationGIFActive = true;
        isSwipeForceStop = false;
        hideSwipeGIF();
        orientationElement.style.backgroundImage = "url('Plugin/en_orientation.gif')";
        orientationElement.style.visibility = "visible";
        let maskElement = window.document.getElementById("mask");
        maskElement.style.display = "none";
    }
}

function showVerticalOrientationGIF() {
    // return
    let orientationElement = window.document.getElementById("orientation");
    if (orientationElement) {
        isOrientationGIFActive = true;
        isSwipeForceStop = false;
        hideSwipeGIF();
        orientationElement.style.backgroundImage = "url('Plugin/en_orientation_v.gif')";
        orientationElement.style.visibility = "visible";
        let maskElement = window.document.getElementById("mask");
        maskElement.style.display = "none";
    }
}

function handleUpperContentCss() {
    // console.log("handleUpperContentCss : ", isIphone);
    let topContent = document.getElementById("topContent");
    // let topTextWrapper = document.getElementById("topTextWrapper");
    if (isIphone && (currentGameOrientation == OrientationTypes.Landscape || currentGameOrientation == null)) {
        let gameContainer = document.getElementById("gameContainer");
        gameContainer.style.marginTop = "1%";
        gameContainer.style.height = "98%";
        // topContent.style.margin = "-6px 0 0 0";
        // topTextWrapper.style.padding = "20px";
        if (topContent) topContent.style.display = "flex";
    } else {
        let gameContainer = document.getElementById("gameContainer");
        gameContainer.style.marginTop = "0%";
        gameContainer.style.height = "100%";
        // topContent.style.margin = "0 0 0 0";
        // topTextWrapper.style.margin = "0px";
        if (topContent) topContent.style.display = "none";
    }
}

function hideOrientationGIF() {
    let orientationElement = window.document.getElementById("orientation");
    isOrientationGIFActive = false;
    handleUpperContentCss();
    if (orientationElement) orientationElement.style.visibility = "hidden";
}

function onSwipeUp() {
    if (!isEditBoxActive) {
        scrollTo(0, 0);
    }
}

function hideSwipeGIF() {
    //    console.log("hideSwipe");
    // let maskCloseElement = this;
    // console.log("hideSwipe : ", isAllowShowSwipe);
    if (!isAllowShowSwipe) {
        let closeContent = window.document.getElementById("mask");
        closeContent.style.visibility = "hidden";
        let maskElement = window.document.getElementById("swipe");
        maskElement.style.visibility = "hidden";
        // this.mask.active && setTimeout(function () {
        //     t.mask.active = false
        // }, 0);
        let swipeGifElement = window.document.getElementById("mask_close");
        swipeGifElement.style.display = "none";
        isAllowShowSwipe = true;
        onSwipeUp();

        // console.warn("[Mask] HIDE !!")
    }
}

function checkScroll() {
    if (isIphone || isIPad) {
        if (!isSwipeForceStop && !isOrientationGIFActive && !isEditBoxActive) {
            let barElemant = window.document.getElementById("bar");
            let innerHeight = window.innerHeight;
            // console.log("barElemant ", barElemant, innerHeight, barElemant?.clientHeight);
            if (barElemant?.clientHeight <= innerHeight) {
                hideSwipeGIF();
                isAllowShowSwipe = false;
            } else if (currentGameOrientation == OrientationTypes.Auto && lastOrientation == OrientationTypes.Portrait) {
                hideSwipeGIF();
                isAllowShowSwipe = false;
            } else {
                isAllowShowSwipe = true;
                // console.log("swipeGifElement.style.display : ", isOrientationGIFActive);
                showSwipeGIF();
            }
        } else {
            hideSwipeGIF();
            isAllowShowSwipe = false;
        }
    }
    if (isAndroid) {
        if (!isSwipeForceStop && !isOrientationGIFActive && !isEditBoxActive) {
            if (!document.fullscreenElement) {
                isAllowedToFullScreenInOtherDevices = true;
                // console.log("full screen not active in Android");
                isAllowShowSwipe = true;
                showSwipeGIF();
            } else {
                hideSwipeGIF();
                isAllowShowSwipe = false;
                isAllowedToFullScreenInOtherDevices = false;
            }
        } else {
            hideSwipeGIF();
            isAllowShowSwipe = false;
            isAllowedToFullScreenInOtherDevices = false;
        }
    }
}

function makeScreenInOtherDevices() {
    // console.log("makeScreenInOtherDevices ", document.fullscreenEnabled);
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        hideSwipeGIF();
        isAllowShowSwipe = false;
        isAllowedToFullScreenInOtherDevices = false;
    }
}

function onClickCloseMask() {
    // console.log("[Mask] CLOSE : ", isIOS());
    if (isIOS()) {
        isSwipeForceStop = true;
        hideSwipeGIF();
    }
}

function showCloseMask() {
    // return
    if (currentGameOrientation == OrientationTypes.Portrait) {
        // console.log("[Mask] Open : ", isIOS());
        window.document.getElementById("mask_close").style.display = "block";
    }
}

function showSwipeGIF() {
    // console.log("showSwipe");
    // return
    let maskCloseElement = window.document.getElementById("mask_close");
    if (maskCloseElement !== null) {
        // Element with id "mask_close" exists
        maskCloseElement.style.display = "none";
    }
    if (isAllowShowSwipe) {
        let maskElement = window.document.getElementById("mask");

        if (maskElement) {
            maskElement.style.display = "inline";
            maskElement.style.visibility = "visible";
            let swipeGifElement = window.document.getElementById("swipe");
            swipeGifElement.style.visibility = "visible";
            onSwipeUp();
            let maskCloseElement = window.document.getElementById("mask_close");
            if (maskCloseElement) {
                let closeContent = "If swiping does not work, please tap here. \u274e";
                maskCloseElement.textContent = closeContent;
                maskCloseElement.onclick = onClickCloseMask.bind(this);
                showCloseMask();
            }
            // this.isiOS13Up ;
            if (checkScrollInterval) {
                clearInterval(checkScrollInterval);
                checkScrollInterval = null;
            }
            checkScrollInterval = setInterval(checkScroll.bind(this), 500);
            isAllowShowSwipe = false;
            //  console.warn("[Mask] SHOW !!")
        }
    }
}

function isIOS() {
    // console.log("navigator.platform : ", navigator.platform);
    return (
        ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) ||
        // iPad on iOS 13 detection
        (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    );
}

function decrypt(encryptedText, secret, iv) {
    try {
        let data = {};
        const decKey = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(secret), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const originV = decKey.toString(CryptoJS.enc.Utf8);
        data["refreshToken"] = originV;
        data["gameId"] = gameId;
        data["gameCode"] = gameCode;
        data["gameCategory"] = gameCategory;
        data["callback"] = callback;
        return data;
    } catch (error) {
        console.error("Error while decrypting cipher : ", error);
    }
}
function LocalData(encryptedText, secret, iv) {
    // try {
    let data = {};
    // const decKey = CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(secret), {
    //     iv: CryptoJS.enc.Utf8.parse(iv),
    //     mode: CryptoJS.mode.CBC,
    //     padding: CryptoJS.pad.Pkcs7,
    // });

    // const originV = decKey.toString(CryptoJS.enc.Utf8);
    data["refreshToken"] = localRefToken;
    data["gameId"] = gameId;
    data["gameCode"] = gameCode;
    data["gameCategory"] = gameCategory;
    data["callback"] = callback;
    return data;
    // } catch (error) {
    //     console.error("Error while decrypting cipher : ", error);
    // }
}

function NotifyGameLoadCompleted() {
    window.parent.postMessage('{"cocos":"cocos"}', "*");
}

function EnablePlayerDataEventListener() {
    window.addEventListener("message", function (message) {
        encryptedData = JSON.parse(message.data);
        // console.log("Event listen", "ReceivePlayerData", message.data, encryptedData);
    });
    NotifyGameLoadCompleted();
}

var userAgent = navigator.userAgent;
if (userAgent.match(/iPhone|iPod/i)) {
    // Device is an iPhone, iPad, or iPod
    isIphone = true;
    console.log("Device is iOS", userAgent);
}
// else if(userAgent.match(/iPad/i))
else if (userAgent.match(/Android/i)) {
    // Device is an Android device
    isAndroid = true;
    console.log("Device is Android", userAgent);
} else if (userAgent.match(/iPad|macintosh/i)) {
    isIPad = true;
    console.log("Device is ipad", userAgent);
} else {
    console.log("Device is not iOS or Android", userAgent);
}

function getGameResolutionTypes(gameCode) {
    if (
        gameCode == "KRK" ||
        gameCode == "FARM" ||
        gameCode == "GRTC" ||
        gameCode == "BTB" ||
        gameCode == "BOM" ||
        gameCode == "VINR" ||
        gameCode == "TCD" ||
        gameCode == "FOT777" ||
        gameCode == "MAC" ||
        gameCode == "CLSM" ||
        gameCode == "GMWD" ||
        gameCode == "PRSD46" ||
        gameCode == "MTSN" ||
        gameCode == "ZOMF" ||
        gameCode == "RTR" ||
        gameCode == "SPCL"
    ) {
        return OrientationTypes.Portrait;
        // StaticProperties.currentGameOrientaion = "PORTRAIT";
    } else if (gameCode == "SNIX") {
        return OrientationTypes.Auto;
    } else {
        return OrientationTypes.Landscape;
        // StaticProperties.currentGameOrientaion = "LANDSCAPE";
    }
}

handleUpperContentCss();

checkScroll();

removeCustomEventListners();

addCustomEventListners();
let orientationDetail = { detail: { orientation: getGameResolutionTypes(gameCode) } };

customEventHandler(orientationDetail);

// checkOrientationInitially();

encryptedData = this.sessionStorage.getItem("NmLNcb8GiFTPl1xLCd0PxA==");
