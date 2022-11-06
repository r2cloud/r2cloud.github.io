import WasmTerminal, { fetchCommandFromWAPM } from "@wasmer/wasm-terminal";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs, Promise } from "@wasmer/wasmfs";

const wasmFs = new WasmFs();
wasmFs.fs.mkdir("/tmp", ()=>{});
const cache = {};

// Let's write handler for the fetchCommand property of the WasmTerminal Config.
const fetchCommandHandler = async ({args, env}) => {
  let commandName = args[0];
  // Let's return a "CallbackCommand" if our command matches a special name
  if (commandName === "callback-command") {
    const callbackCommand = async (options, wasmFs) => {
      return `Callback Command Working! Options: ${options}, fs: ${wasmFs}`;
    };
    return callbackCommand;
  }

  if (!cache[args[0]]) {
    // Let's fetch a wasm Binary from WAPM for the command name.
    const wasmBinary = await fetchCommandFromWAPM({args});

    // lower i64 imports from Wasi Modules, so that most Wasi modules
    // Can run in a Javascript context.
    cache[args[0]] = await lowerI64Imports(wasmBinary);
    return cache[args[0]];
  } else {
    return cache[args[0]];
  }
};

// Let's create our Wasm Terminal
const wasmTerminal = new WasmTerminal({
  // Function that is run whenever a command is fetched
  fetchCommand: fetchCommandHandler,
  wasmFs: wasmFs
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