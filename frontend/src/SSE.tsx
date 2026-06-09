import express, { Request, Response } from 'express'

const app = express()

// 연결된 클라이언트 관리
const clients = new Map<string, Response>()

app.get('/events', (req: Request, res: Response) => {
  // SSE 헤더
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const clientId = Date.now().toString()
    clients.set(clientId, res)

  // heartbeat — 연결 유지 (30초마다)
    const heartbeat = setInterval(() => {
    res.write(':ping\n\n')
    }, 30_000)

  // 연결 해제 시 정리
    req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(clientId)
    })
})

// 알림 발송
export function broadcast(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    clients.forEach(res => res.write(payload))
}

// 특정 유저 발송
export function sendTo(clientId: string, event: string, data: unknown) {
    const res = clients.get(clientId)
    if (res) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }
}

app.listen(3000)