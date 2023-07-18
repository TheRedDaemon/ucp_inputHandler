
const MODIFIER_CONTROL = "CONTROL";
const MODIFIER_SHIFT = "SHIFT";
const MODIFIER_ALT = "ALT";

const KEY_MAP = new Map([
    [0x03, "CANCEL"],
    [0x08, "BACKSPACE"],
    [0x09, "TAB"],
    [0x0C, "CLEAR"],
    [0x0D, "ENTER"],
    [0x13, "PAUSE"],
    [0x1B, "ESCAPE"],
    [0x20, "SPACE"],
    [0x21, "PAGE_UP"],
    [0x22, "PAGE_DOWN"],
    [0x23, "END"],
    [0x24, "HOME"],
    [0x25, "LEFT"],
    [0x26, "UP"],
    [0x27, "RIGHT"],
    [0x28, "DOWN"],
    [0x29, "SELECT"],
    [0x2A, "PRINT"],
    [0x2B, "EXECUTE"],
    [0x2C, "PRINT_SCREEN"], // german keys: Druck
    [0x2D, "INSERT"],
    [0x2E, "DELETE_KEY"],
    [0x2F, "HELP"], // numbers
    [0x30, "ZERO"],
    [0x31, "ONE"],
    [0x32, "TWO"],
    [0x33, "THREE"],
    [0x34, "FOUR"],
    [0x35, "FIVE"],
    [0x36, "SIX"],
    [0x37, "SEVEN"],
    [0x38, "EIGHT"],
    [0x39, "NINE"],
    [0x41, "A"],
    [0x42, "B"],
    [0x43, "C"],
    [0x44, "D"],
    [0x45, "E"],
    [0x46, "F"],
    [0x47, "G"],
    [0x48, "H"],
    [0x49, "I"],
    [0x4A, "J"],
    [0x4B, "K"],
    [0x4C, "L"],
    [0x4D, "M"],
    [0x4E, "N"],
    [0x4F, "O"],
    [0x50, "P"],
    [0x51, "Q"],
    [0x52, "R"],
    [0x53, "S"],
    [0x54, "T"],
    [0x55, "U"],
    [0x56, "V"],
    [0x57, "W"],
    [0x58, "X"],
    [0x59, "Y"],
    [0x5A, "Z"],
    [0x5B, "LEFT_WINDOWS_KEY"], // reported as additional key, but as left (not general), so right should report also as such
    [0x5C, "RIGHT_WINDOWS_KEY"],
    [0x5D, "APPLICATIONS_KEY"],
    [0x5F, "SLEEP"],
    [0x60, "NUMPAD0"],
    [0x61, "NUMPAD1"],
    [0x62, "NUMPAD2"],
    [0x63, "NUMPAD3"],
    [0x64, "NUMPAD4"],
    [0x65, "NUMPAD5"],
    [0x66, "NUMPAD6"],
    [0x67, "NUMPAD7"],
    [0x68, "NUMPAD8"],
    [0x69, "NUMPAD9"],
    [0x6A, "MULTIPLY"], // num
    [0x6B, "ADD"], // num
    [0x6C, "SEPERATOR"], // num
    [0x6D, "SUBTRACT"], // num
    [0x6E, "DECIMAL"], // german keys: num comma
    [0x6F, "DIVIDE"], // num
    [0x70, "F1"],
    [0x71, "F2"],
    [0x72, "F3"],
    [0x73, "F4"],
    [0x74, "F5"],
    [0x75, "F6"],
    [0x76, "F7"],
    [0x77, "F8"],
    [0x78, "F9"],
    [0x79, "F10"],
    [0x7A, "F11"],
    [0x7B, "F12"],
    [0x7C, "F13"],
    [0x7D, "F14"],
    [0x7E, "F15"],
    [0x7F, "F16"],
    [0x80, "F17"],
    [0x81, "F18"],
    [0x82, "F19"],
    [0x83, "F20"],
    [0x84, "F21"],
    [0x85, "F22"],
    [0x86, "F23"],
    [0x87, "F24"],
    [0xA6, "BROWSER_BACK"],
    [0xA7, "BROWSER_FORWARD"],
    [0xA8, "BROWSER_REFRESH"],
    [0xA9, "BROWSER_STOP"],
    [0xAA, "BROWSER_SEARCH"],
    [0xAB, "BROWSER_FAVORITES"],
    [0xAC, "BROWSER_HOME"],
    [0xAD, "VOLUME_MUTE"],
    [0xAE, "VOLUME_DOWN"],
    [0xAF, "VOLUME_UP"],
    [0xB0, "NEXT_TRACK"],
    [0xB1, "PREVIOUS_TRACK"],
    [0xB2, "STOP_MEDIA"],
    [0xB3, "PLAY_PAUSE"],
    [0xB4, "LAUNCH_MAIL"],
    [0xB5, "SELECT_MEDIA"],
    [0xB6, "LAUNCH_APP1"],
    [0xB7, "LAUNCH_APP2"],
    [0xBA, "OEM1"], // german keys: ü
    [0xBB, "OEM_PLUS"], // non num versions
    [0xBC, "OEM_COMMA"],
    [0xBD, "OEM_MINUS"],
    [0xBE, "OEM_PERIOD"],
    [0xBF, "OEM2"], // german keys: #
    [0xC0, "OEM3"], // german keys: ö
    [0xDB, "OEM4"], // german keys: ß
    [0xDC, "OEM5"], // german keys: ZIRKUMFLEX
    [0xDD, "OEM6"], // german keys: ´
    [0xDE, "OEM7"], // german keys: ä
    [0xDF, "OEM8"],
    [0xE2, "OEM102"], // german keys: <
    [0xE5, "PROCESS"],
    [0xE7, "PACKET"],
    [0xF6, "ATTN"],
    [0xF7, "CRSEL"],
    [0xF8, "EXSEL"],
    [0xF9, "ERASEEOF"],
    [0xFA, "PLAY"],
    [0xFB, "ZOOM"],
    [0xFD, "PA1"],
    [0xFE, "OEM_CLEAR"],
]);

const VALID_MODIFIER_SET = new Set([MODIFIER_CONTROL, MODIFIER_SHIFT, MODIFIER_ALT]);

const VALID_KEY_SET = new Set(KEY_MAP.values());

const MAIN_ELEMENTS = {
    content: undefined,
    alias: undefined,
    adder: undefined,
    combination: undefined,
    warning: undefined,
}

const CURRENT_KEY_COMBINATIONS = new Map();

function handleInputKeydown(event) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    if (event.repeat) {
        event.preventDefault();
        return;
    }

    const resultCombination = receiveKeyCombinationFromKeyEvent(event);

    if (!resultCombination || validateKeyCombination(resultCombination)) {
        removeEdit(event.currentTarget);
    }

    event.currentTarget.textContent = resultCombination;

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
}

function performOnEnterKeyDown(event, action) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    if (event.key === "Enter") {
        action(event);
    }
}

function activateEditUsingKeyboard(event) {
    performOnEnterKeyDown(event, (event) => activateEdit(event.currentTarget));
}

function activateEditUsingMouse(event) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }
    activateEdit(event.currentTarget);
}

function activateEdit(element) {
    if (element === document.activeElement) {
        element.classList.add("table-cell-edit");
        element.textContent = null;
        element.onkeydown = handleInputKeydown;
        element.addEventListener("focusout", removeEditEvent);
    }
}

function removeEdit(element) {
    element.classList.remove("table-cell-edit");
    element.onkeydown = activateEditUsingKeyboard;
    element.removeEventListener("focusout", removeEditEvent);

    // validate contained data

    if (isNewAliasFooterElement(element)) {
        if (!validateKeyCombination(element.textContent)) {
            element.textContent = null;
        }
        return;
    }

    // handle edits of combination for alias
    const combinationData = getKeyCombinationDataFromSubElement(element);
    if (validateKeyCombination(element.textContent)) {
        CURRENT_KEY_COMBINATIONS.set(combinationData.alias, element.textContent);
    } else {
        // reset
        element.textContent = CURRENT_KEY_COMBINATIONS.get(combinationData.alias);
    }
}

function removeEditEvent(event) {
    if (event.defaultPrevented) {
        return;
    }
    removeEdit(event.currentTarget);
}

function validateKeyCombination(combinationString) {
    const splitArray = combinationString.split("+")
    const arrayLength = splitArray.length;
    if (arrayLength < 1 || arrayLength > 4) {
        return false;
    }
    const validKey = VALID_KEY_SET.has(splitArray.pop());
    let validModifiers = splitArray.reduce(
        (currentState, modifier) => currentState && VALID_MODIFIER_SET.has(modifier),
        true
    );
    return validModifiers && validKey;
}

function getKeyCombinationDataFromSubElement(element) {
    const tableContentItem = element.closest(".table-content-item");
    return {
        contentItem: tableContentItem,
        alias: tableContentItem.children[0].textContent,
        combination: tableContentItem.children[1].textContent,
    }
}

function receiveKeyCombinationFromKeyEvent(keyEvent) {
    let resultCombination = "";

    if (keyEvent.ctrlKey) {
        resultCombination += MODIFIER_CONTROL + "+"
    }

    if (keyEvent.shiftKey) {
        resultCombination += MODIFIER_SHIFT + "+"
    }

    if (keyEvent.altKey) {
        resultCombination += MODIFIER_ALT + "+"
    }

    if (!(keyEvent.key === "Control" || keyEvent.key === "Shift" || keyEvent.key === "Alt")) {
        const keyString = KEY_MAP.get(keyEvent.keyCode);

        if (keyString) {
            resultCombination += keyString;
        } else {
            resultCombination = null;
        }
    }

    return resultCombination;
}

function addEditToTableCell(element) {
    element.ondblclick = activateEditUsingMouse;
    element.onkeydown = activateEditUsingKeyboard;
}

function isNewAliasFooterElement(element) {
    return element === MAIN_ELEMENTS.alias || element === MAIN_ELEMENTS.combination;
}

function removeGivenContentItemAndKey(element) {
    const data = getKeyCombinationDataFromSubElement(element);
    CURRENT_KEY_COMBINATIONS.delete(data.alias);
    data.contentItem.remove();
}

function onClickRemoveGivenContentItemAndKey(event) {
    removeGivenContentItemAndKey(event.currentTarget);
}

function onEnterKeyDownRemoveGivenContentItemAndKey(event) {
    performOnEnterKeyDown(event, (event) => removeGivenContentItemAndKey(event.currentTarget))
}

// does not care about alias uniqueness
function addNewContentItem(alias, combination) {
    const row = document.createElement("tr");
    row.classList.add("table-content-item");

    const aliasCell = document.createElement("td");
    aliasCell.classList.add("table-cell");
    aliasCell.textContent = alias;
    row.appendChild(aliasCell);

    const combinationCell = document.createElement("td");
    combinationCell.classList.add("table-cell");
    combinationCell.textContent = combination;
    combinationCell.tabIndex = 0;
    addEditToTableCell(combinationCell);
    row.appendChild(combinationCell);

    const buttonCell = document.createElement("td");
    buttonCell.classList.add("table-button", "table-button-remove");
    buttonCell.tabIndex = 0;
    buttonCell.onclick = onClickRemoveGivenContentItemAndKey;
    buttonCell.onkeydown = onEnterKeyDownRemoveGivenContentItemAndKey;
    row.appendChild(buttonCell);

    MAIN_ELEMENTS.content.appendChild(row);
}

async function extractOldConfig() {
    const oldConfig = await HOST_FUNCTIONS.getCurrentConfig();
    if (!oldConfig || typeof oldConfig !== 'object') {
        return;
    }

    for (const key in oldConfig) {
        if (!Object.hasOwn(oldConfig, key)) {
            continue;
        }
        const configCombination = oldConfig[key];

        if (validateKeyCombination(key) && validateKeyCombination(configCombination)) {
            CURRENT_KEY_COMBINATIONS.set(key, configCombination);
        }
    }

    CURRENT_KEY_COMBINATIONS.forEach((combination, key) => addNewContentItem(key, combination));
}

function initMainElements() {
    const footer = document.querySelector(".table-footer");
    MAIN_ELEMENTS.alias = footer.querySelector("#key-alias-edit");
    MAIN_ELEMENTS.combination = footer.querySelector("#key-combination-edit");
    MAIN_ELEMENTS.adder = footer.querySelector(".table-button-accept");

    MAIN_ELEMENTS.content = document.querySelector(".table-content");
    MAIN_ELEMENTS.warning = document.querySelector(".warning-message");

    addEditToTableCell(MAIN_ELEMENTS.alias);
    addEditToTableCell(MAIN_ELEMENTS.combination);
}

addEventListener(
    DONE_EVENT_NAME,
    async () => {
        // dummy:
        HOST_FUNCTIONS.getCurrentConfig = async () => ({
            "CONTROL+B": "ALT+H",
            "K": "Hi",
        });


        initMainElements();
        await extractOldConfig();
    },
    { once: true }
);

// allows to find file for debugging
//# sourceURL=input-handler-alias.js