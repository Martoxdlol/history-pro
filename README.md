Browser Navigation keys (⬅ ➡) controller
=================

Full control of back and forward keys on browser

It can:
 - Listen to `back`, `forward` and `hashchange` events
 - Prevents any change on url or history state
 - It doesn't have history functionallity (only overrides and listen 'back' and 'forward' keys)
 - Ideal to make apps thats uses back button
 - Can enable and disable forward key

```javascript
import NavKeysController from 'nav-keys'

const options = {
    allowHashchange: true // by default it won't prevent hashchange and will emit an event
    listenHashchange: true // by default it will emit hashchange events
}

const controller = new NavKeysController(window.history, options) // both params are optional

controller.url = 'home'

controller.listen(e => {
    console.log(e) // Won´t see this
})

controller.listen(e => {
    e.stopPropagation()
})

controller.listen(e => {
    console.log(e) // Will see this
    console.log(e.action) 
    console.log(e.location)

    if (e.action === 'back') {
        controller.url = 'previos page'
        controller.enableForwardButton()

    } else if (e.action === 'forward') {
        controller.url = 'next page'
        controller.disableForwardButton()

    } else if (e.action === 'hashchange') {
        controller.url = 'hash page'
    }
})

// Listeners behaviour is like a stack
```

## Internet Explorer Compatibility

```html
    <script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
    <script src="nav-keys.js"></script>

    <script>

    var controller = new NavKeysController(window.history)
    
    </script>
```