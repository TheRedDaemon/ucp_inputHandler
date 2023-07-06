
// source: https://stackoverflow.com/a/40648033
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
        return; // Do nothing if the event was already processed
    }

    console.log(event);

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
}, true);
// the last option dispatches the event to the listener first,
// then dispatches event to window
