import { get as getPath } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { ResponseContent, ResponsePayload } from './types'
import { ChatError, ErrorCode } from '~utils/errors'
import { parseSSEResponse } from '~utils/sse'
import { chatGPTClient } from './client'
import { streamAsyncIterable } from '~utils/stream-async-iterable'

function removeCitations(text: string) {
    return text.replaceAll(/\u3010\d+\u2020source\u3011/g, '')
}

function parseResponseContent(content: ResponseContent): { text?: string; } {
    if (content.content_type === 'text') {
        return { text: removeCitations(content.parts[0]) }
    }
    if (content.content_type === 'code') {
        return { text: '_' + content.text + '_' }
    }
    return {}
}

export type AnwserPayload = {
    text: string
}

export type Event =
    | {
        type: 'UPDATE_ANSWER'
        data: AnwserPayload
    }
    | {
        type: 'DONE'
    }
    | {
        type: 'ERROR'
        error: ChatError
    }

export interface MessageParams {
    prompt: string
    rawUserInput?: string
    image?: File
    signal?: AbortSignal
}

export interface SendMessageParams extends MessageParams {
    onEvent: (event: Event) => void
}

interface ConversationContext {
    conversationId: string
    lastMessageId: string
}

export class ChatGPTWebBot {
    private accessToken?: string

    private conversationContext?: ConversationContext

    constructor() {
    }

    private async getModelName(): Promise<string> {
        // if (this.model === ChatGPTWebModel['GPT-4']) {
        //     return 'gpt-4'
        // }
        return 'text-davinci-002-render-sha'
    }

    private buildMessage(prompt: string) {
        return {
            id: uuidv4(),
            author: { role: 'user' },
            content: { content_type: 'text', parts: [prompt] }
        }
    }

    public async sendMessage(params: MessageParams) {
        return this.doSendMessageGenerator(params)
    }

    protected async *doSendMessageGenerator(params: MessageParams) {
        const wrapError = (err: unknown) => {
            if (err instanceof ChatError) {
                return err
            }
            if (!params.signal?.aborted) {
                // ignore user abort exception
                return new ChatError((err as Error).message, ErrorCode.UNKOWN_ERROR)
            }
        }
        const stream = new ReadableStream<AnwserPayload>({
            start: (controller) => {
                this.doSendMessage({
                    prompt: params.prompt,
                    rawUserInput: params.rawUserInput,
                    signal: params.signal,
                    onEvent(event) {
                        if (event.type === 'UPDATE_ANSWER') {
                            controller.enqueue(event.data)
                        } else if (event.type === 'DONE') {
                            controller.close()
                        } else if (event.type === 'ERROR') {
                            const error = wrapError(event.error)
                            if (error) {
                                controller.error(error)
                            }
                        }
                    },
                }).catch((err) => {
                    const error = wrapError(err)
                    if (error) {
                        controller.error(error)
                    }
                })
            },
        })
        yield* streamAsyncIterable(stream)

        
    }

    async doSendMessage(params: SendMessageParams) {
        if (!this.accessToken) {
            this.accessToken = await chatGPTClient.getAccessToken()
        }

        const { token, proof } = await chatGPTClient.getSentinelToken(this.accessToken);

        const modelName = await this.getModelName()
        console.debug('Using model:', modelName)

        //const arkoseToken = await getArkoseToken()

        const resp = await chatGPTClient.fetch('https://chatgpt.com/backend-api/conversation', {
            method: 'POST',
            signal: params.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.accessToken}`,
                "openai-sentinel-proof-token": proof,
                "openai-sentinel-chat-requirements-token": token
            },
            body: JSON.stringify({
                action: 'next',
                messages: [this.buildMessage(params.prompt)],
                model: modelName,
                conversation_id: this.conversationContext?.conversationId || undefined,
                parent_message_id: this.conversationContext?.lastMessageId || uuidv4(),
                conversation_mode: { kind: 'primary_assistant' },
            }),
        })

        const isFirstMessage = !this.conversationContext

        await parseSSEResponse(resp, (message) => {
            console.debug('chatgpt sse message', message)
            if (message === '[DONE]') {
                params.onEvent({ type: 'DONE' })
                return
            }
            let parsed: ResponsePayload | { message: null; error: string }
            try {
                parsed = JSON.parse(message)
            } catch (err) {
                console.error(err)
                return
            }
            if (!parsed.message && parsed.error) {
                params.onEvent({
                    type: 'ERROR',
                    error: new ChatError(parsed.error, ErrorCode.UNKOWN_ERROR),
                })
                return
            }

            const payload = parsed as ResponsePayload

            const role = getPath(payload, 'message.author.role')
            if (role !== 'assistant' && role !== 'tool') {
                return
            }

            const content = payload.message?.content as ResponseContent | undefined
            if (!content) {
                return
            }

            const { text } = parseResponseContent(content)
            if (text) {
                this.conversationContext = { conversationId: payload.conversation_id, lastMessageId: payload.message.id }
                params.onEvent({ type: 'UPDATE_ANSWER', data: { text } })
            }

            
        }).catch((err: Error) => {
            if (err.message.includes('token_expired')) {
                throw new ChatError(err.message, ErrorCode.CHATGPT_AUTH)
            }
            throw err
        })

        setTimeout(() => {
            if (this.accessToken) {
                console.log("trigger auto delete conv for search enhance (webapp mode)");
                chatGPTClient.hideConversation(this.accessToken, this.conversationContext?.conversationId);
            }
        }, 1e3)

        // auto generate title on first response
        // if (isFirstMessage && this.conversationContext) {
        //     const c = this.conversationContext
        //     chatGPTClient.generateChatTitle(this.accessToken, c.conversationId, c.lastMessageId)
        // }
    }
}