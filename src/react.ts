import HistoryPro, { Action, NavEvent } from ".";

export default function createHistory(historyPro?: HistoryPro) {
    let action = 'POP'

    if (!historyPro) historyPro = new HistoryPro({})

    let location = historyPro.location

    let listeners = new Set<Function>()

    historyPro.listen((e: NavEvent) => {
        location = e.location
        if (e.action === Action.push) {
            action = 'PUSH'
        } else if (e.action === Action.replace) {
            action = 'REPLACE'
        } else {
            action = 'POP'
        }

        listeners.forEach(listener => {
            listener({ location, action })
        })
    })


    let history: {} = {
        get action() {
            return action;
        },
        get location() {
            return location
        },
        createHref: (u: string) => new URL(u, location.href),
        push: historyPro.push,
        replace: historyPro.replace,
        go: historyPro.go,
        back() {
            historyPro.go(-1);
        },
        forward() {
            historyPro.go(1);
        },
        listen(listener: Function) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        block(blocker: Function, options?: any) {
            historyPro.block(() => {
                blocker()
            }, options)

            // if (blockers.length === 1) {
            //     window.addEventListener(BeforeUnloadEventType, promptBeforeUnload);
            // }

            // return function () {
            //     unblock();

            //     // Remove the beforeunload listener so the document may
            //     // still be salvageable in the pagehide event.
            //     // See https://html.spec.whatwg.org/#unloading-documents
            //     if (!blockers.length) {
            //         window.removeEventListener(BeforeUnloadEventType, promptBeforeUnload);
            //     }
            // };
        },
    }
    return history
}

export function makeNativeHistoryPro(historyPro?: HistoryPro) {

}