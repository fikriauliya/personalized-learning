export class ConfigError {
  readonly _tag = 'ConfigError'
  readonly message: string
  constructor(message: string) { this.message = message }
}

export class GeminiApiError {
  readonly _tag = 'GeminiApiError'
  readonly message: string
  readonly status: number | undefined
  constructor(message: string, status?: number) { this.message = message; this.status = status }
}

export class JsonParseError {
  readonly _tag = 'JsonParseError'
  readonly message: string
  readonly rawText: string | undefined
  constructor(message: string, rawText?: string) { this.message = message; this.rawText = rawText }
}

export class NetworkError {
  readonly _tag = 'NetworkError'
  readonly message: string
  constructor(message: string) { this.message = message }
}

export class ApiError {
  readonly _tag = 'ApiError'
  readonly message: string
  readonly status: number | undefined
  constructor(message: string, status?: number) { this.message = message; this.status = status }
}
