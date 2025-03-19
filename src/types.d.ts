declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "bun" {
  interface ENV {
    AWESOME: string;
  }
}