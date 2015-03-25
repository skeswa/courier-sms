module.exports = {
    is: {
        number: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        string: function(s) {
            return typeof s === 'string';
        },
        bool: function(b) {
            return b === 'true' || b === 'false';
        },
        email: function(e) {
            if (module.exports.is.string(e)) {
                return e.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;
            }
            return false;
        }
    }
};
