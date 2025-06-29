declare module 'node-fetch' {
    import { RequestInit, Response } from 'undici';
    export default function fetch(url: string, init?: RequestInit): Promise<Response>;
  }