export interface IO {    
  output(message: string): Promise<void>
  input(): Promise<string>
}