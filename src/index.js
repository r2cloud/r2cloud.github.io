import WasmTerminal, { fetchCommandFromWAPM } from "@wasmer/wasm-terminal";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";

const wasmFs = new WasmFs();
wasmFs.fs.mkdir("/tmp", ()=>{});
// wasmFs.fs.writeFileSync(".radare2rc", "eco darkda\ne scr.utf8=true");
const cache = {};

// Let's write handler for the fetchCommand property of the WasmTerminal Config.
const fetchCommandHandler = async ({args, env}) => {
  let commandName = args[0];
  // Let's return a "CallbackCommand" if our command matches a special name
  if (commandName === "callback-command") {
    return async (options, wasmFs) => {
      return `Callback Command Working! Options: ${options}, fs: ${wasmFs}`;
    };
  }

  if (commandName === "cat") {
    return async (options, wasmFs) => {
      return wasmFs.fs.readFileSync(args[1]).toString();
    };
  }

  if (commandName === "ls") {
    return async (options, wasmFs) => {
      let dir = args[1];
      if (!dir) {
        dir = ".";
      }
      return wasmFs.fs.readdirSync(dir).join("\n");
    };
  }

  if (!cache[commandName]) {
    // Let's fetch a wasm Binary from WAPM for the command name.
    const wasmBinary = await fetchCommandFromWAPM({args});

    // lower i64 imports from Wasi Modules, so that most Wasi modules
    // Can run in a Javascript context.
    cache[commandName] = await lowerI64Imports(wasmBinary);
    return cache[commandName];
  } else {
    return cache[commandName];
  }
};

// Let's create our Wasm Terminal
const wasmTerminal = new WasmTerminal({
  // Function that is run whenever a command is fetched
  fetchCommand: fetchCommandHandler,
  wasmFs: wasmFs,
  processWorkerUrl: "process.worker.js"
});

// Let's print out our initial message
// wasmTerminal.print("Hello World!");

// Let's bind our Wasm terminal to it's container
const containerElement = document.querySelector("#root");
wasmTerminal.open(containerElement);
wasmTerminal.fit();
wasmTerminal.focus();

// Later, when we are done with the terminal, let's destroy it
// wasmTerminal.destroy();