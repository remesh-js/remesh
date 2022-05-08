export const delay = (ms: number): Promise<number> => new Promise((resolve) => setTimeout(() => resolve(ms), ms))
