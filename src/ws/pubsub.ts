type Subscriber = {
  ws: WebSocket;
  channels: Set<string>;
};

const subscribers = new Map<string, Subscriber>();

export function addSubscriber(id: string, ws: WebSocket) {
  subscribers.set(id, { ws, channels: new Set(["*"]) });
}

export function removeSubscriber(id: string) {
  subscribers.delete(id);
}

export function subscribe(id: string, channel: string) {
  const sub = subscribers.get(id);
  if (sub) sub.channels.add(channel);
}

export function unsubscribe(id: string, channel: string) {
  const sub = subscribers.get(id);
  if (sub) sub.channels.delete(channel);
}

export function broadcast(event: string, data: unknown, channel = "*") {
  const payload = JSON.stringify({ event, data, timestamp: Date.now() });
  const dead: string[] = [];

  for (const [id, sub] of subscribers) {
    if (sub.ws.readyState !== WebSocket.OPEN) {
      dead.push(id);
      continue;
    }
    if (sub.channels.has("*") || sub.channels.has(channel)) {
      sub.ws.send(payload);
    }
  }

  // Clean up dead connections found during broadcast
  for (const id of dead) subscribers.delete(id);
}

export function cleanupDeadSubscribers(): void {
  for (const [id, sub] of subscribers) {
    if (sub.ws.readyState !== WebSocket.OPEN) {
      subscribers.delete(id);
    }
  }
}

export function getSubscriberCount(): number {
  return subscribers.size;
}

export function handleWsMessage(id: string, raw: string) {
  try {
    const msg = JSON.parse(raw);

    switch (msg.type) {
      case "subscribe":
        if (msg.channel) subscribe(id, msg.channel);
        break;
      case "unsubscribe":
        if (msg.channel) unsubscribe(id, msg.channel);
        break;
      case "ping":
        const sub = subscribers.get(id);
        if (sub && sub.ws.readyState === WebSocket.OPEN) {
          sub.ws.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
        }
        break;
    }
  } catch {
    // Invalid JSON, ignore
  }
}
