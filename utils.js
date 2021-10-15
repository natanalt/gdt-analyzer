//! A set of common utilities for other code

/// Digits, including hex
const digits = "0123456789abcdef";

/// Encodes the provided number as a 2-character hex string representation.
/// The representation only takes low 8 bits, so if the number is >255, the top bits
/// will not be included in the string representation.
const numToHex8 = function(num) {
    let result = "";
    result += digits[(num >> 4n) & 0xFn];
    result += digits[(num >> 0n) & 0xFn];
    return result;
};

/// Encodes the provided number as a 32-bit hex representation, with an underscore
/// in the middle for easier reading.
const numToHex32 = function(num) {
    if (num > 0xffff_ffffn) {
        console.warn("numToHex32: Got too big num");
    }

    let result = "";
    result += digits[(num >> 28n) & 0xFn];
    result += digits[(num >> 24n) & 0xFn];
    result += digits[(num >> 20n) & 0xFn];
    result += digits[(num >> 16n) & 0xFn];
    result += "_";
    result += digits[(num >> 12n) & 0xFn];
    result += digits[(num >> 8n) & 0xFn];
    result += digits[(num >> 4n) & 0xFn];
    result += digits[(num >> 0n) & 0xFn];
    return result;
};

/// Parses a number.
/// Base of the number is taken through the prefix:
///  - (no prefix) - base 10
///  - 0b - base 2
///  - 0o - base 8
///  - 0d - base 10
///  - 0x - base 16
/// Suffix h implies base 16
const parseNumber = function(str) {
    str = str.toLowerCase().replace("_", "");
    const base = (function() {
        if (str.startsWith("0b")) {
            str = str.substring(2);
            return 2n;
        } else if (str.startsWith("0o")) {
            str = str.substring(2);
            return 8n;
        } else if (str.startsWith("0d")) {
            str = str.substring(2);
            return 10n;
        } else if (str.startsWith("0x")) {
            str = str.substring(2);
            return 16n;
        } else if (str.endsWith("h")) {
            str = str.substring(0, str.length - 1);
            return 16n;
        } else {
            return 10n;
        }
    })();

    // Reverse string
    str = [...str].reverse().join("");

    let result = 0n;
    let multiplier = 1n;
    for (let i = 0n; i < str.length; i++) {
        let current = str[i];
        let index = digits.indexOf(current);
        if (index === -1 || index >= base)
            return null; // Malformed string
        result += BigInt(index) * multiplier;
        multiplier *= base;
    }
    return result;
};

/// Joins an array of bytes into one big number, in a little endian way
const joinBytesLE = function(bytes) {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
        result += bytes[i] << (i * 8n);
    }
    return result;
};

/// Connects all bits in the provided array of 0/1 numbers, starting from bit 0, going upwards
const joinBits = function(bits) {
    let result = 0n;
    let shift = 0n;
    for (const bit in bits) {
        result |= (bit & 1n) << shift;
        shift += 1n;
    }
    return result;
};

/// Checks if specified bit is set to 1
const isBitSet = function(num, bit) {
    return ((num >> bit) & 1n) === 1n;
};

/// Checks if specified bit is set to 0
const isBitClear = function(num, bit) {
    return ((num >> bit) & 1n) === 0n;
};

/// Removes all children of provided element
const destroyAllChildren = function(element) {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
};

const hideAllOfClass = function(className) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        elements.item(i).classList.add("hidden");
    }
};

const showAllOfClass = function(className) {
    const elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        elements.item(i).classList.remove("hidden");
    }
};

const showElement = function(element) {
    element.classList.remove("hidden");
};

const hideElement = function(element) {
    element.classList.add("hidden");
};

const clamp = function(x, min, max) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
};
