/// <reference types="vite/client" />

// Shader files are imported as strings (vite-plugin-glsl inlines + resolves
// #include). Vite's own client types cover *?raw; these cover the bare
// extension imports used by the renderers.
declare module "*.glsl" {
  const src: string;
  export default src;
}
declare module "*.vert" {
  const src: string;
  export default src;
}
declare module "*.frag" {
  const src: string;
  export default src;
}
declare module "*.wgsl" {
  const src: string;
  export default src;
}
