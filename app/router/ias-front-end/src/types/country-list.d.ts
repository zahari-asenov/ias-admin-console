declare module 'country-list' {
  interface Country {
    code: string;
    name: string;
  }
  export function getData(): Country[];
  export function getName(code: string): string | undefined;
  export function getCode(name: string): string | undefined;
}
