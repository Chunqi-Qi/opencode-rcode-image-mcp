export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();

  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status}`, res.status, text);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
