
const SegmentDescriptor = class {
    constructor() {
        this.limit = 0x00000n;
        this.base = 0x0000_0000n;
        this.type = 0b00000n;
        this.ring = 0b00n;
        this.present = false;
        this.avlBit = false;
        this.use32 = false;
        this.use64 = false;
        this.pageGranularity = false;
    }

    static decode(val) {
        let result = new SegmentDescriptor();
        result.limit = (((val >> 0n) & 0xFFFFn) << 0n) | (((val >> 48n) & 0xFn) << 16n);
        result.base = (((val >> 16n) & 0xFF_FFFFn) << 0n) | (((val >> 56n) & 0xFFn) << 24n);
        result.type = (val >> 40n) & 0b1_1111n;
        result.ring = (val >> 45n) & 0b11n;
        result.present = ((val >> 47n) & 1n) == 1n;
        result.avlBit = ((val >> 52n) & 1n) == 1n;
        result.use64 = ((val >> 53n) & 1n) == 1n;
        result.use32 = ((val >> 54n) & 1n) == 1n;
        result.pageGranularity = ((val >> 55n) & 1n) == 1n;
        return result;
    }

    encode() {
        let result = 0n;
        result |= ((this.limit >> 0n) & 0xFFFFn) << 0n;
        result |= ((this.base >> 0n) & 0xFF_FFFFn) << 16n;
        result |= ((this.type >> 0n) & 0b1_1111n) << 40n;
        result |= ((this.ring >> 0n) & 0b11n) << 45n;
        result |= (this.present ? 1n : 0n) << 47n;
        result |= ((this.limit >> 16n) & 0xFn) << 48n;
        result |= (this.avlBit ? 1n : 0n) << 52n; 
        result |= (this.use64 ? 1n : 0n) << 53n; 
        result |= (this.use32 ? 1n : 0n) << 54n; 
        result |= (this.pageGranularity ? 1n : 0n) << 55n; 
        result |= ((this.base >> 24n) & 0xFFn) << 56n;
        return result;
    }

    getSegmentType() {
        if (!this.present) {
            return "notPresent";
        } else if (isBitClear(this.type, 4n)) {
            return "system";
        } else {
            return isBitSet(this.type, 3n) ? "code" : "data";
        }
    }

    getDetailedAttributes() {
        switch (this.getSegmentType()) {
            case "notPresent": {
                return {};
            }
            case "system": {
                return {
                    "subtype": this.type & 0xFFFFn,
                };
            }
            case "code": {
                return {
                    "accessed": isBitSet(this.type, 0n),
                    "readable": isBitSet(this.type, 1n),
                    "conforming": isBitSet(this.type, 2n),
                };
            }
            case "data": {
                return {
                    "accessed": isBitSet(this.type, 0n),
                    "writable": isBitSet(this.type, 1n),
                    "expandDown": isBitSet(this.type, 2n),
                };
            }
        }
    }

    isExpandDown() {
        if (this.getSegmentType() === "data") {
            return this.getDetailedAttributes().expandDown;
        } else {
            return false;
        }
    }

    getCodeSize() {
        switch (this.getSegmentType()) {
            case "notPresent": {
                return null;
            }
            case "system": {
                return null;
            }
            case "code": {
                if (this.use32 && this.use64) {
                    return null;
                } else if (this.use64) {
                    return 64;
                } else if (this.use32) {
                    return 32;
                } else {
                    return 16;
                }
            }
            case "data": {
                if (this.use64) {
                    return null;
                } else if (this.use32) {
                    return 32;
                } else {
                    return 16;
                }
            }
        }
    }

    changeType(newType) {
        if (newType === this.getSegmentType()) {
            return;
        }

        switch (newType) {
            case "notPresent": {
                this.present = true;
                this.base = 0n;
                this.limit = 0n;
                this.type = 0n;
                this.ring = 0n;
                this.avlBit = false;
                this.use64 = false;
                this.use32 = false;
                this.pageGranularity = false;
                break;
            }
            case "system": {
                this.present = true;
                this.type = 0b00001n;
                this.use32 = false;
                this.use64 = false;
                break;
            }
            case "code": {
                this.present = true;
                this.type = 0b11000n;
                break;
            }
            case "data": {
                this.present = true;
                this.type = 0b10000n;
                this.use64 = false;
                break;
            }
        }
    }

    getConfigurationNotes() {
        // super messy, idc
        let result = [];

        let minCpu = "286";
        if ((this.limit >> 16n) !== 0n ||
            this.avlBit ||
            this.use64 ||
            this.use32 ||
            this.pageGranularity ||
            (this.base >> 24n) !== 0n
        ) {
            minCpu = "386";
        }

        const details = this.getDetailedAttributes();
        switch (this.getSegmentType()) {
            case "system": {
                if (this.use64 || this.use32) {
                    result.push("reserved");
                }

                const typesInvalid = [0n, 8n, 10n, 13n, 4n, 6n, 7n, 12n, 14n, 15n];
                if (typesInvalid.includes(details.subtype)) {
                    result.push("invalid");
                    minCpu = null;
                    break;
                }

                const types386 = [9n, 11n, 12n, 14n, 15n];
                if (types386.includes(details.subtype)) {
                    minCpu = "386";
                }
                break;
            }
            case "code": {
                switch (this.getCodeSize()) {
                    case null: {
                        result.push("invalid");
                        minCpu = null;
                        break;
                    }
                    case 64: {
                        minCpu = "x86-64";
                        if (this.base != 0n || this.limit != 0n) {
                            result.push("reserved");
                        }
                        break;
                    }
                }
                break;
            }
            case "data": {
                if (this.use64) {
                    result.push("reserved");
                    minCpu = null;
                }
                break;
            }
        }

        if (minCpu !== null) {
            result.push(`${minCpu}-compat`);
        }

        return result;
    }

    clearAllReserved() {
        switch (this.getSegmentType()) {
            case "notPresent": {
                break;
            }
            case "system": {
                this.use64 = false;
                this.use32 = false;
                break;
            }
            case "code": {
                switch (this.getCodeSize()) {
                    case null: {
                        break;
                    }
                    case 64: {
                        // According to modern Intel manuals, base and limit are reserved, as
                        // usual segmentation rules don't apply in 64-bit
                        // Oddly enough, attributes and granularity bits stay?
                        // Am I misunderstanding something? weird.
                        this.base = 0n;
                        this.limit = 0n;
                        break;
                    }
                    case 32: {
                        break;
                    }
                    case 16: {
                        break;
                    }
                }
                break;
            }
            case "data": {
                this.use64 = false;
                break;
            }
        }
    }

    getSegmentBounds() {
        const unitSize = this.pageGranularity ? 4096n : 1n;
        const topAddress = (!this.use32) ? 0xffffn : 0xffff_ffffn;
        if (this.isExpandDown()) {
            //const size = topAddress - adjustedLimit + 1n + (this.pageGranularity ? 4096n : 0n);
            const size = topAddress - (this.limit + 1n) * unitSize + 1n;
            const max = this.base + size - 1n;
            return {
                "overflow": max > 0xffff_ffffn,
                "size": size,
                "internalMin": (this.limit + 1n) * unitSize,
                "internalMax": topAddress,
                "linearMin": this.base,
                "linearMax": clamp(max, 0n, 0xffff_ffffn),
            };
        } else {
            const adjustedLimit = (this.limit) * unitSize;
            const max = this.base + adjustedLimit + (this.pageGranularity ? 4095n : 0n);
            return {
                "overflow": max > 0xffff_ffffn,
                "size": adjustedLimit - 1n,
                "internalMin": 0n,
                "internalMax": adjustedLimit + (this.pageGranularity ? 4095n : 0n),
                "linearMin": this.base,
                "linearMax": clamp(max, 0n, 0xffff_ffffn),
            };
        }
    }

    toEditor() {
        const that = this;

        editorElements.segmentPresent.checked = this.present;
        editorElements.avlBit.checked = this.avlBit;

        clearAllNotes();
        const notes = this.getConfigurationNotes();
        for (const i in notes) {
            showNote(notes[i]);
        }

        const currentRawBase = parseNumber(editorElements.rawBase.value);
        if (currentRawBase !== this.base) {
            editorElements.rawBase.value = `0x${numToHex32(this.base)}`;
        }

        const currentRawLimit = parseNumber(editorElements.rawLimit.value);
        if (currentRawLimit !== this.limit) {
            editorElements.rawLimit.value = `0x${this.limit.toString(16)}`;
        }

        const boundInfo = this.getSegmentBounds();
        const overflow = boundInfo.overflow;
        const size = boundInfo.size;
        const internalMin = boundInfo.internalMin;
        const internalMax = boundInfo.internalMax;
        const linearMin = boundInfo.linearMin;
        const linearMax = boundInfo.linearMax;

        editorElements.segmentSpan.innerText = `0x${numToHex32(internalMin)} - 0x${numToHex32(internalMax)}`;
        editorElements.segmentLinearSpan.innerText = `0x${numToHex32(linearMin)} - 0x${numToHex32(linearMax)} ${overflow ? "(overflows!)" : ""}`;

        editorElements.segmentGranularity.value = this.pageGranularity ? "page" : "byte";
        editorElements.segmentByteSize.innerText = `${size} byte${size === 0n ? "" : "s"}`;
        editorElements.segmentPageSize.innerHTML = (function() {
            const fullPages = (size - (size % 4096n)) / 4096n;
            const hasNonFullpage = (size % 4096n) !== 0;

            let message = "";
            if (fullPages === 0n && !hasNonFullpage) {
                message = "No pages (shouldn't be possible?)";
            } else if (fullPages === 0n && hasNonFullpage) {
                message = "1 partial page";
            } else if (fullPages !== 0n && hasNonFullpage) {
                message = `${fullPages} page${fullPages === 1n ? "" : "s"}`;
            } else {
                message = `${fullPages} page${fullPages === 1n ? "" : "s"} and 1 partial page`;
            }
            if ((that.base & 4095n) !== 0n) {
                message += "<br><b>Note:</b> base is not page aligned";
            }
            return message;
        })();

        if (internalMax < internalMin) {
            editorElements.segmentSpan.innerText = "Size is 😳";
            editorElements.segmentLinearSpan.innerText = "Size is 😳";
            editorElements.segmentByteSize.innerText = "Size is 😳";
            editorElements.segmentPageSize.innerText = "Size is 😳";
        }

        const codeSize = this.getCodeSize();
        const segmentType = this.getSegmentType();
        const details = this.getDetailedAttributes();
        editorElements.segmentType.value = segmentType;
        hideElement(editorElements.segmentTypeEditorSystem.container);
        hideElement(editorElements.segmentTypeEditorCode.container);
        hideElement(editorElements.segmentTypeEditorData.container);
        switch (segmentType) {
            case "system": {
                const parent = editorElements.segmentTypeEditorSystem;
                showElement(parent.container);
                parent.subtype.value = details.subtype.toString(16);
                break;
            }
            case "code": {
                const parent = editorElements.segmentTypeEditorCode;
                showElement(parent.container);
                parent.accessed.checked = details.accessed;
                parent.readable.checked = details.readable;
                parent.conforming.checked = details.conforming;
                parent.codeSize.value = codeSize === null ? "invalid" : codeSize.toString();
                break;
            }
            case "data": {
                const parent = editorElements.segmentTypeEditorData;
                showElement(parent.container);
                parent.accessed.checked = details.accessed;
                parent.writable.checked = details.writable;
                parent.expandDown.checked = details.expandDown;
                parent.bits32.checked = codeSize !== 16;
                break;
            }
        }

        editorElements.ringLevel.value = this.ring.toString();

        showAllOfClass("hide-if-not-present");
        showAllOfClass("hide-if-use64");

        if (!this.present) {
            hideAllOfClass("hide-if-not-present");
        }

        if (this.getCodeSize() === 64) {
            hideAllOfClass("hide-if-use64");
        }

        setInputDataRaw(this.encode());
    }
};
