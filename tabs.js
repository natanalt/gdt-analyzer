//! Implementation of the tab view

let currentTabName = "";
let tabList = [];

/// Registers a new tab
const registerTab = function(name) {
    tabList.push(name);
    const button = document.getElementById("tab-button-" + name);
    button.addEventListener("click", () => switchTab(name));
};

/// Switches the tab to a specified one
const switchTab = function(name) {
    if (name === currentTabName) {
        return;
    }

    if (!tabList.includes(name)) {
        console.error(`Tried to switch to a non-existent tab ${name}`);
        return;
    }

    if (currentTabName !== "") {
        const currentTabButton = document.getElementById("tab-button-" + currentTabName);
        currentTabButton.classList.remove("active");
        
        const currentTab = document.getElementById("tab-" + currentTabName);
        currentTab.classList.remove("tab-active");
        currentTab.classList.add("tab-inactive");
    }

    const newCurrentTabButton = document.getElementById("tab-button-" + name);
    newCurrentTabButton.classList.add("active");
    
    const newCurrentTab = document.getElementById("tab-" + name);
    newCurrentTab.classList.remove("tab-inactive");
    newCurrentTab.classList.add("tab-active");
    
    currentTabName = name;
};

registerTab("bytes");
registerTab("bits");
registerTab("presets");
switchTab("bytes");
