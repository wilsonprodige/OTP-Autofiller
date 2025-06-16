export const siteSpecificHandlers = {

    'app.gohighlevel.com': (inputs, code) => {
        console.log('Using GoHighLevel OTP filling strategy');
        simulatePasteToOTPFields(inputs[0], code);
        return
    },


    'amazon.com': (inputs, code) => {
        console.log('Using Amazon OTP filling strategy');
        const amazonOtpInput = document.getElementById('auth-mfa-otpcode') ||
        document.querySelector('input[name="otc"]');
        if (amazonOtpInput) {
        amazonOtpInput.value = code;
        amazonOtpInput.dispatchEvent(new Event('input', { bubbles: true }));
        amazonOtpInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return
    },


    'accounts.google.com': (inputs, code) => {
        console.log('Using Google OTP filling strategy');
        const googleOtpInput = document.querySelector('input[type="tel"]') ||
        document.querySelector('input[name="otp"]');
        if (googleOtpInput) {
        googleOtpInput.value = code;
        googleOtpInput.dispatchEvent(new Event('input', { bubbles: true }));
        googleOtpInput.dispatchEvent(new Event('change', { bubbles: true }));
        googleOtpInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        }
        return
    }

};

function simulatePasteToOTPFields(_input_field,otpCode) {
    _input_field.focus();

    const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer()
    });
    pasteEvent.clipboardData.setData('text/plain', otpCode);
    const wasPasteSuccessful = _input_field.dispatchEvent(pasteEvent);

    if (!wasPasteSuccessful) {
    console.log('Paste event was prevented - falling back to manual input');
    return;
    }
}
