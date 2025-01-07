import { RequestInitSubset } from '~types/messaging'

export interface Requester {
    fetch(url: string, options?: RequestInitSubset): Promise<Response>
}

class GlobalFetchRequester implements Requester {
    fetch(url: string, options?: RequestInitSubset) {
        return fetch(url, options)
    }
}

export const globalFetchRequester = new GlobalFetchRequester()
