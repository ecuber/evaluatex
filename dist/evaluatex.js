"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = evaluatex;

var _lexer = require("./lexer");

var _lexer2 = _interopRequireDefault(_lexer);

var _parser = require("./parser");

var _parser2 = _interopRequireDefault(_parser);

var _arities = require("./util/arities");

var _arities2 = _interopRequireDefault(_arities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parses a given math expression and returns a function that computes the result.
 * @param {String} expression Math expression to parse.
 * @param {Object} constants A map of constants that will be compiled into the resulting function.
 * @param {Object} options Options to Evaluatex.
 * @returns {fn} A function that takes an optional map of variables. When invoked, this function computes the math expression and returns the result. The function has fields `ast` and `expression`, which respectively hold the AST and original math expression.
 */
function evaluatex(expression) {
    var constants = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


    // Evaluatex it great, but its LaTex interpreter has some issues that are more easily solved by
    // over-formatting the input string than modifying the parser itself, which works relatively well
    // for what it was made to do.

    // Each element contains the LaTex syntax for a command at index 0 and the ASCII equivalent.
    var replacements = [['arctan', 'atan'], ['arccos', 'acos'], ['arcsin', 'asin'], ['ln', 'log'], ['\\pi', "(" + Math.PI + ")"]];

    // Replace some LaTex syntax to cooperate with evaluatex's native parser
    replacements.forEach(function (r) {
        expression = expression.replaceAll(r[0], r[1]);
    });

    // Support Euler's constant by default
    constants['e'] = Math.E;

    // Create RegExp matches for all supported LaTex commands
    var fnregex = Object.keys(_arities2.default).map(function (func) {
        var str = void 0;
        if (_arities2.default[func] === 2) str = "\\\\" + func + "\\{((.)*)\\}{2}";else {
            str = "\\\\" + func + "((\\{((.)*)\\})| [^{}]+){1}";
        }
        return RegExp(str, 'gi');
    });

    if (options.latex) {
        // wrap all functions in { } to force implicit multiplication
        fnregex.forEach(function (r) {
            expression = expression.replace(r, function (match) {
                return "{" + match + "}";
            });
        });

        // wrap variables in { } to force implicit multiplication
        ['x', 'y'].forEach(function (variable) {
            expression = expression.replaceAll(variable, "{" + variable + "}");
        });
    }
    // console.log('formatted', expression);

    var tokens = (0, _lexer2.default)(expression, constants, options);
    var ast = (0, _parser2.default)(tokens).simplify();
    var fn = function fn() {
        var variables = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return ast.evaluate(variables);
    };
    fn.ast = ast;
    fn.expression = expression;
    fn.tokens = tokens;
    return fn;
}