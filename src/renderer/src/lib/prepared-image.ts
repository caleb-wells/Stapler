export type PreparedKind = 'jpeg' | 'png';

export interface PreparedImage {
  kind: PreparedKind;
  bytes: Uint8Array;
  width: number;
  height: number;
}
