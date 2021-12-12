export type Callback = () => void;

export interface TtyRenderWindowRow {
  ended?: boolean | string;
  render(stream: NodeJS.WriteStream): void;
  subscribe?(handler: Callback): Callback;
}
