export function extractImageUrls(text: string): string[] {
  const urls: string[] = [];

  const markdownImg = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  for (const m of text.matchAll(markdownImg)) {
    urls.push(m[1]!);
  }

  const bareUrl = /https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|bmp|svg)(?:\?[^\s"'<>]*)?/gi;
  for (const m of text.matchAll(bareUrl)) {
    const url = m[0];
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }

  return [...new Set(urls)];
}
