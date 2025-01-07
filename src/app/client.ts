
import { RequestInitSubset } from '~types/messaging'
import { ChatError, ErrorCode } from '~utils/errors'
import { Requester, globalFetchRequester } from './requesters'
import { solveSentinelChallenge } from "~app/utils/utils";
import { v4 as uuidv4 } from 'uuid'

class ChatGPTClient {
    requester: Requester

    constructor() {
        this.requester = globalFetchRequester
    }

    async fetch(url: string, options?: RequestInitSubset): Promise<Response> {
        return this.requester.fetch(url, options)
    }

    async getAccessToken(): Promise<string> {
        const resp = await this.fetch('https://chat.openai.com/api/auth/session')
        if (resp.status === 403) {
            throw new ChatError('Please pass Cloudflare check', ErrorCode.CHATGPT_CLOUDFLARE)
        }
        const data = await resp.json().catch(() => ({}))
        if (!data.accessToken) {
            throw new ChatError('There is no logged-in ChatGPT account in this browser.', ErrorCode.CHATGPT_UNAUTHORIZED)
        }
        return data.accessToken
    }

    async getSentinelToken(token: string): Promise<{
        token: string;
        proof: string;
    }> {
        const ansToken = await solveSentinelChallenge("" + Math.random, "0");
        const response = await this.fetch(`https://chatgpt.com/backend-anon/sentinel/chat-requirements`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                "oai-device-id": uuidv4()
            },
            body: JSON.stringify({
                p: `${ansToken}`
            })
        })

        const data = await response.json().catch(() => ({}));
        if (data.token === undefined || data.proofofwork === undefined) {
            throw new Error(
                "Failed to fetch required required sentinel token. Please check your sessionToken and try again."
            );
        }

        const challengeToken = await solveSentinelChallenge(data.proofofwork.seed, data.proofofwork.difficulty);
        return {
            token: data.token,
            proof: challengeToken,
        };
    }

    private async requestBackendAPIWithToken(token: string, method: 'GET' | 'POST' | 'PATCH', path: string, data?: unknown) {
        return this.fetch(`https://chatgpt.com/backend-api${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: data === undefined ? undefined : JSON.stringify(data),
        })
    }

    async getModels(token: string): Promise<{ slug: string; title: string; description: string; max_tokens: number }[]> {
        const resp = await this.requestBackendAPIWithToken(token, 'GET', '/models').then((r) => r.json())
        return resp.models
    }

    async hideConversation(token: string, conversation_id: string | undefined) {
        const resp = await this.requestBackendAPIWithToken(token, 'PATCH', `/conversation/${conversation_id}`, { is_visible: !1 }).then((r) => r.json())
        return resp
    }
}

export const chatGPTClient = new ChatGPTClient()