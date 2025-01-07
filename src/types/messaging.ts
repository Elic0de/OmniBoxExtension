export type RequestInitSubset = {
    method?: string
    body?: string
    headers?: Record<string, string>
    signal?: AbortSignal
}