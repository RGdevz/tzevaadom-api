import { defineConfig } from 'tsup'



import builtinModules from "builtin-modules";
import packageJson from "./package.json";

/*
const dependencies = Object.keys({
 ...packageJson.dependencies,
 ...packageJson.devDependencies,
}
);
*/


const strings = builtinModules.map(x=>`node:${x}`)

const list = [...builtinModules,...strings]



export default defineConfig({
 entry: [


  './src/index.ts'

 ],


 

 external:list,
 format: ['cjs'],
 target: 'node16',
 splitting: false,
 outDir:'dist',
 cjsInterop: true,
 minify:false,
 clean: true,

 dts: true,
 platform: 'node',
}
)
