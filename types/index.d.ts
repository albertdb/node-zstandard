/// <reference types="node" />
/// <reference types="node" />
import { default as EventEmitter } from "events";
import * as fs from "fs";
type CallbackFunction = (err: Error | null, res?: string | EventEmitter) => any | void;
export declare function compress(inputFile: string, outputFile: string, compLevel?: number, callback?: CallbackFunction): void;
export declare function compressStreamToFile(readableStream: fs.ReadStream, outputFile: string, compLevel?: number, callback?: CallbackFunction): void;
export declare function decompress(inputFile: string, outputFile: string, callback?: CallbackFunction): void;
export declare function decompressionStreamFromFile(inputFile: string, callback?: CallbackFunction): void;
export declare function decompressFileToStream(inputFile: string, writableStream: fs.WriteStream, callback?: CallbackFunction): void;
export {};
//# sourceMappingURL=index.d.ts.map