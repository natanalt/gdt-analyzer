//! Support for visual editing of the descriptor info (#inputs and the editor table)

/// Object containing all of the relevant editor elements, fetched from the DOM
const editorElements = {
    "inputBytes": document.getElementById("desc-input-bytes"),
    "segmentPresent": document.getElementById("segment-present"),
    "avlBit": document.getElementById("segment-avl-bit"),
    "rawBase": document.getElementById("segment-raw-base"),
    "rawBaseMalformed": document.getElementById("segment-raw-base-error"),
    "rawBaseTooLarge": document.getElementById("segment-raw-base-too-large-error"),
    "rawLimit": document.getElementById("segment-raw-limit"),
    "rawLimitMalformed": document.getElementById("segment-raw-limit-error"),
    "rawLimitTooLarge": document.getElementById("segment-raw-limit-too-large-error"),
    "segmentSpan": document.getElementById("segment-span"),
    "segmentLinearSpan": document.getElementById("segment-linear-span"),
    "segmentGranularity": document.getElementById("segment-granularity"),
    "segmentByteSize": document.getElementById("segment-byte-size"),
    "segmentPageSize": document.getElementById("segment-page-size"),
    "segmentType": document.getElementById("segment-type"),
    "segmentTypeEditorCode": {
        "container": document.getElementById("segment-type-editor-code"),
        "accessed": document.getElementById("segment-code-accessed"),
        "readable": document.getElementById("segment-code-readable"),
        "conforming": document.getElementById("segment-code-conforming"),
        "codeSize": document.getElementById("segment-code-size"),
    },
    "segmentTypeEditorData": {
        "container": document.getElementById("segment-type-editor-data"),
        "accessed": document.getElementById("segment-data-accessed"),
        "writable": document.getElementById("segment-data-writable"),
        "expandDown": document.getElementById("segment-data-expand-down"),
        "bits32": document.getElementById("segment-data-bits32"),
    },
    "segmentTypeEditorSystem": {
        "container": document.getElementById("segment-type-editor-system"),
        "subtype": document.getElementById("segment-system-type"),
    },
    "ringLevel": document.getElementById("segment-ring"),
};

/// Data currently present in the editor and inputs
let oldDescriptor = new SegmentDescriptor();
let currentDescriptor = new SegmentDescriptor();

/// All currently visible notes
let visibleNotes = [];

/// Removes all notes
const clearAllNotes = function() {
    for (const note in visibleNotes) {
        hideNote(visibleNotes[note]);
    }
    showOrHideNotesRow();
};

/// Verifies whether given note is visible
const isNoteVisible = function(name) {
    return visibleNotes.includes(name);
}

/// Makes given note visible
const showNote = function(name) {
    if (!isNoteVisible(name)) {
        showElement(document.getElementById(`note-${name}`));
        visibleNotes.push(name);
    }
    showOrHideNotesRow();
};

/// Makes given note invisible
const hideNote = function(name) {
    if (isNoteVisible(name)) {
        hideElement(document.getElementById(`note-${name}`));
        visibleNotes = visibleNotes.filter(x => x !== name);
    }
    showOrHideNotesRow();
};

/// Hides or shows the notes row in the editor, based on whether there are any notes visible
const showOrHideNotesRow = function() {
    if (visibleNotes.length === 0) {
        hideAllOfClass("hide-if-no-notes");
    } else {
        showAllOfClass("hide-if-no-notes");
    }
};

/// Writes given byte array into the input fields, but doesn't update anything else in the program
const setInputDataRaw = function(literal) {
    // Update the bytes input
    let bytesString = "";
    for (let i = 0; i < 8; i++) {
        let current = literal & 0xffn;
        literal >>= 8n;
        bytesString += numToHex8(current);
        bytesString += " ";
    }
    editorElements.inputBytes.value = bytesString.trim();

    // Update the bits field
    // TODO: bits field
};

editorElements.segmentPresent.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor = oldDescriptor;
    } else {
        oldDescriptor = currentDescriptor;
        currentDescriptor = new SegmentDescriptor();
    }
    currentDescriptor.toEditor();
});

editorElements.avlBit.addEventListener("input", function() {
    currentDescriptor.avlBit = this.checked;
    currentDescriptor.toEditor();
});

editorElements.rawBase.addEventListener("input", function() {
    hideElement(editorElements.rawBaseMalformed);
    hideElement(editorElements.rawBaseTooLarge);
    const rawBaseRaw = editorElements.rawBase.value;
    const rawBase = parseNumber(rawBaseRaw);
    if (rawBase === null) {
        showElement(editorElements.rawBaseMalformed);
        return;
    } else if (rawBase > 0xffff_ffff) {
        showElement(editorElements.rawBaseTooLarge);
        return;
    }
    currentDescriptor.base = rawBase;
    currentDescriptor.toEditor();
});

editorElements.rawLimit.addEventListener("input", function() {
    hideElement(editorElements.rawLimitMalformed);
    hideElement(editorElements.rawLimitTooLarge);
    const rawLimitRaw = editorElements.rawLimit.value;
    const rawLimit = parseNumber(rawLimitRaw);
    if (rawLimit === null) {
        showElement(editorElements.rawLimitMalformed);
        return;
    } else if (rawLimit > 0xfffff) {
        showElement(editorElements.rawLimitTooLarge);
        return;
    }
    currentDescriptor.limit = rawLimit;
    currentDescriptor.toEditor();
});

editorElements.segmentGranularity.addEventListener("input", function() {
    currentDescriptor.pageGranularity = this.value === "page";
    currentDescriptor.toEditor();
});

editorElements.segmentType.addEventListener("input", function() {
    currentDescriptor.changeType(this.value);
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorCode.accessed.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00001n;
    } else {
        currentDescriptor.type &= 0b11110n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorCode.readable.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00010n;
    } else {
        currentDescriptor.type &= 0b11101n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorCode.conforming.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00100n;
    } else {
        currentDescriptor.type &= 0b11011n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorCode.codeSize.addEventListener("input", function() {
    switch (this.value) {
        case "16": {
            currentDescriptor.use32 = false;
            currentDescriptor.use64 = false;
            break;
        }
        case "32": {
            currentDescriptor.use32 = true;
            currentDescriptor.use64 = false;
            break;
        }
        case "64": {
            currentDescriptor.use32 = false;
            currentDescriptor.use64 = true;
            currentDescriptor.clearAllReserved();
            break;
        }
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorData.accessed.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00001n;
    } else {
        currentDescriptor.type &= 0b11110n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorData.writable.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00010n;
    } else {
        currentDescriptor.type &= 0b11101n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorData.expandDown.addEventListener("input", function() {
    if (this.checked) {
        currentDescriptor.type |= 0b00100n;
    } else {
        currentDescriptor.type &= 0b11011n;
    }
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorData.bits32.addEventListener("input", function() {
    currentDescriptor.use32 = this.checked;
    currentDescriptor.use64 = false;
    currentDescriptor.toEditor();
});

editorElements.segmentTypeEditorSystem.subtype.addEventListener("input", function() {
    currentDescriptor.type = parseNumber(`0x${this.value}`);
    currentDescriptor.toEditor();
});

editorElements.ringLevel.addEventListener("input", function() {
    currentDescriptor.ring = parseNumber(this.value);
    currentDescriptor.toEditor();
});

document.getElementById("clear-reserved").addEventListener("click", function() {
    currentDescriptor.clearAllReserved();
    currentDescriptor.toEditor();
})

showOrHideNotesRow();

currentDescriptor = SegmentDescriptor.decode(0x00cf9a000000ffffn);
oldDescriptor = currentDescriptor;
currentDescriptor.toEditor();
