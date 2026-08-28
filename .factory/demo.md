# Demo sandbox

Open [/demo/](/demo/) or select **Try it with sample data** on the landing page.

The demo shows an opinionated sample shopping page: a moving featured-collection
card, an order-status signal, and a keyboard-focus control. Choose Gentle,
Balanced, or Still to see the decorative card change while the status signal
continues. The temporary-exception control makes the sample decoration move
again until it is ended.

Demo state uses only the `demo:low-motion-profile-switcher` localStorage key.
It never reads or writes extension settings. **Reset demo** deletes that key;
**Start for real** downloads the extension ZIP. The service worker precaches
the demo shell, so it is available after the first online visit.
