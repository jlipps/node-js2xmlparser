/* globals module */

(function() {
    "use strict";

    var wrapArray = false;
    var wrapArrayItem = "item";
    var callFunctions = true;
    var useCDATA = false;
    var convertMap = {};
    var xmlDeclaration = true;
    var xmlVersion = "1.0";
    var xmlEncoding = "UTF-8";
    var attributeString = "@";
    var valueString = "#";
    var childString = ">";
    var prettyPrinting = true;
    var indentString = "\t";

    module.exports = function (root, data, options) {
        return toXML(init(root, data, options));
    };

    // Initialization
    var init = function(root, data, options) {
        // Set option defaults
        setOptionDefaults();

        // Error checking for root element
        if (typeof root !== "string") {
            throw new Error("root element must be a string");
        }

        // Error checking and variable initialization for options
        if (typeof options === "object" && options !== null) {
            if ("declaration" in options) {
                if ("include" in options.declaration) {
                    if (typeof options.declaration.include === "boolean") {
                        xmlDeclaration = options.declaration.include;
                    }
                    else {
                        throw new Error("declaration.include option must be a boolean");
                    }
                }

                if ("encoding" in options.declaration) {
                    if (typeof options.declaration.encoding === "string" || options.declaration.encoding === null) {
                        xmlEncoding = options.declaration.encoding;
                    }
                    else {
                        throw new Error("declaration.encoding option must be a string or null");
                    }
                }
            }
            if ("wrapArray" in options) {
                if ("enabled" in options.wrapArray) {
                    if (typeof options.wrapArray.enabled === "boolean") {
                        wrapArray = options.wrapArray.enabled;
                    }
                    else {
                        throw new Error("wrapArray.enabled option must be a boolean");
                    }
                }
                if ("elementName" in options.wrapArray) {
                    if (typeof options.wrapArray.elementName === "string") {
                        wrapArrayItem = options.wrapArray.elementName;
                    }
                    else {
                        throw new Error("wrapArray.elementName option must be a boolean");
                    }
                }
            }
            if ("useCDATA" in options) {
                if (typeof options.useCDATA === "boolean") {
                    useCDATA = options.useCDATA;
                }
                else {
                    throw new Error("useCDATA option must be a boolean");
                }
            }
            if ("callFunctions" in options) {
                if (typeof options.callFunctions === "boolean") {
                    callFunctions = options.callFunctions;
                }
                else {
                    throw new Error("callFunctions option must be a boolean");
                }
            }
            if ("attributeString" in options) {
                if (typeof options.attributeString === "string") {
                    attributeString = options.attributeString;
                }
                else {
                    throw new Error("attributeString option must be a string");
                }
            }
            if ("valueString" in options) {
                if (typeof options.valueString === "string") {
                    valueString = options.valueString;
                }
                else {
                    throw new Error("valueString option must be a string");
                }
            }
            if ("childString" in options) {
                if (typeof options.childString === "string") {
                    childString = options.childString;
                }
                else {
                    throw new Error("childString option must be a string");
                }
            }
            if ("prettyPrinting" in options) {
                if ("enabled" in options.prettyPrinting) {
                    if (typeof options.prettyPrinting.enabled === "boolean") {
                        prettyPrinting = options.prettyPrinting.enabled;
                    }
                    else {
                        throw new Error("prettyPrinting.enabled option must be a boolean");
                    }
                }

                if ("indentString" in options.prettyPrinting) {
                    if (typeof options.prettyPrinting.indentString === "string") {
                        indentString = options.prettyPrinting.indentString;
                    }
                    else {
                        throw new Error("prettyPrinting.indentString option must be a string");
                    }
                }
            }
            if ("convertMap" in options) {
                if (Object.prototype.toString.call(options.convertMap) === "[object Object]") {
                    convertMap = options.convertMap;
                }
                else {
                    throw new Error("convertMap option must be an object");
                }
            }
        }

        // Error checking and variable initialization for data
        if (typeof data !== "string" && typeof data !== "object") {
            throw new Error("data must be an object or a string");
        }

        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        var tempData = {};
        tempData[root] = data; // Add root element to object

        return tempData;
    };

    // Convert object to XML
    var toXML = function(object) {
        // Initialize arguments, if necessary
        var xml = arguments[1] || "";
        var level = arguments[2] || 0;

        var i;
        var tempObject = {};

        for (var property in object) {
            // Arrays
            if (Object.prototype.toString.call(object[property]) === "[object Array]") {
                if (property === childString) {
                    for (i = 0; i < object[property].length; i++) {
                        tempObject = object[property][i];
                        xml = toXML(tempObject, xml, level);
                    }
                }
                else if (wrapArray) {
                    // Create separate XML elements for each array element, but wrap all elements in a single element
                    xml += addBreak(addIndent("<" + property + ">", level));
                    for (i = 0; i < object[property].length; i++) {
                        tempObject = {};
                        tempObject[wrapArrayItem] = object[property][i];
                        xml = toXML(tempObject, xml, level + 1);
                    }
                    xml += addBreak(addIndent("</" + property + ">", level));
                }
                else {
                    // Create separate XML elements for each array element
                    for (i = 0; i < object[property].length; i++) {
                        tempObject = {};
                        tempObject[property] = object[property][i];

                        xml = toXML(tempObject, xml, level);
                    }
                }
            }
            // JSON-type objects with properties
            else if (Object.prototype.toString.call(object[property]) === "[object Object]") {

                xml += addIndent("<" + property, level);

                // Add attributes
                var lengthExcludingAttributes = Object.keys(object[property]).length;
                if (Object.prototype.toString.call(object[property][attributeString]) === "[object Object]") {
                    lengthExcludingAttributes -= 1;
                    for (var attribute in object[property][attributeString]) {
                        if (object[property][attributeString].hasOwnProperty(attribute)) {
                            xml += " " + attribute + "=\"" + toString(object[property][attributeString][attribute]) +
                                "\"";
                        }
                    }
                }

                if (lengthExcludingAttributes === 0) { // Empty object
                    xml += addBreak("/>");
                }
                else if (lengthExcludingAttributes === 1 && valueString in object[property]) { // Value string only
                    xml += addBreak(">" + toString(object[property][valueString], true) + "</" + property + ">");
                }
                else { // Object with properties
                    xml += addBreak(">");

                    // Create separate object for each property and pass to this function
                    for (var subProperty in object[property]) {
                        if (subProperty !== attributeString) {
                            tempObject = {};
                            tempObject[subProperty] = object[property][subProperty];

                            xml = toXML(tempObject, xml, level + 1);
                        }
                    }

                    xml += addBreak(addIndent("</" + property + ">", level));
                }
            }
            // Everything else
            else {
                xml += addBreak(addIndent("<" + property + ">" + toString(object[property]) + "</" + property + ">", level));
            }
        }

        // Finalize XML at end of process
        if (level === 0) {
            // Strip trailing whitespace
            xml = xml.replace(/\s+$/g, "");

            // Add XML declaration
            if (xmlDeclaration) {
                if (xmlEncoding === null) {
                    xml = addBreak("<?xml version=\"" + xmlVersion + "\"?>") + xml;
                }
                else {
                    xml = addBreak("<?xml version=\"" + xmlVersion + "\" encoding=\"" + xmlEncoding + "\"?>") + xml;
                }
            }
        }

        return xml;
    };

    // Add indenting to data for pretty printing
    var addIndent = function(data, level) {
        if (prettyPrinting) {

            var indent = "";
            for (var i = 0; i < level; i++) {
                indent += indentString;
            }
            data = indent + data;
        }

        return data;
    };

    // Add line break to data for pretty printing
    var addBreak = function(data) {
        return prettyPrinting ? data + "\n" : data;
    };

    // Convert anything into a valid XML string representation
    var toString = function(data) {
        // Recursive function used to handle nested functions
        var functionHelper = function(data) {
            if (Object.prototype.toString.call(data) === "[object Function]") {
                return functionHelper(data());
            }
            else {
                return data;
            }
        };

        // Convert map
        if (Object.prototype.toString.call(data) in convertMap) {
            data = convertMap[Object.prototype.toString.call(data)](data);
        }
        else if ("*" in convertMap) {
            data = convertMap["*"](data);
        }
        // Functions
        else if (Object.prototype.toString.call(data) === "[object Function]") {
            if (callFunctions) {
                data = functionHelper(data());
            }
            else {
                data = data.toString();
            }
        }
        // Empty objects
        else if (Object.prototype.toString.call(data) === "[object Object]" && Object.keys(data).length === 0) {
            data = "";
        }

        // Cast data to string
        if (typeof data !== "string") {
            data = (data === null || typeof data === "undefined") ? "" : data.toString();
        }

        if (useCDATA) {
            data = "<![CDATA[" + data.replace(/]]>/gm, "]]]]><![CDATA[>") + "]]>";
        }
        else {
            // Escape illegal XML characters
            data = data.replace(/&/gm, "&amp;")
                .replace(/</gm, "&lt;")
                .replace(/>/gm, "&gt;")
                .replace(/"/gm, "&quot;")
                .replace(/'/gm, "&apos;");
        }

        return data;
    };

    // Revert options back to their default settings
    var setOptionDefaults = function() {
        wrapArray = false;
        wrapArrayItem = "item";
        callFunctions = true;
        useCDATA = false;
        convertMap = {};
        xmlDeclaration = true;
        xmlVersion = "1.0";
        xmlEncoding = "UTF-8";
        attributeString = "@";
        valueString = "#";
        childString = ">"
        prettyPrinting = true;
        indentString = "\t";
    };
})();
