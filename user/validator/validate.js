
exports.isValid = function (value) {
    if (typeof value === "undefined" || value === "null") return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


// Function to validate an email address
exports.validateEmail = function (email) {
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

    return emailRegex.test(email);
};

exports.validateMobile = function (mobile) {
    const mobileNumberRegex = /^[0-9]{10}$/;
    return mobileNumberRegex.test(mobile);
}