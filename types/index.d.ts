/// <reference types="node" />
/// <reference types="node" />
import { default as EventEmitter } from "events";
import * as fs from "fs";
type CallbackFunction = (err: Error | null, res?: string | EventEmitter) => any | void;
/**
 * Compress inputFile by compLevel to outputFile using zstd
 * @param {string} inputFile Path to the to file to be compressed - can be relative or absolute
 * @param {string} outputFile Path to store the resulting compressed file - can be relative or absolute
 * @param {number} [compLevel=3] Compression - int between 1 and 22; [default=3]
 * @param {CallbackFunction} [callback] Optional Callback Function to be executed on task completion. Follows Node.js (err, result) pattern, being result equal to outputFile when succeeded.
 * @returns {void}None
 */
export declare function compress(inputFile: string, outputFile: string, compLevel?: number, callback?: CallbackFunction): void;
/**
 * Compress stream by compLevel to outputFile using zstd
 * @param {fs.ReadStream} readableStream Data Node.js Stream to be compressed.
 * @param {string} outputFile Path to store the resulting compressed file - can be relative or absolute. Output file is overwritten if it exists.
 * @param {number} [compLevel=3] Compression - int between 1 and 22; [default=3]
 * @param {CallbackFunction} [callback] Optional Callback Function to be executed on task initialization. Follows Node.js (err, result) pattern, being result an EventEmitter that can emit the following events:
 *  - error: Emitted when an error reading the stream or creating the compressed file occurred. Error message is provided.
 *  - end: Emitted when task ended successfully.
 * @returns {void}None
 */
export declare function compressStreamToFile(readableStream: fs.ReadStream, outputFile: string, compLevel?: number, callback?: CallbackFunction): void;
/**
 * Decompress inputFile to outputFile using zstd - call callback function upon completion
 * * NOTE: Input and output files should be different. Output file is overwritten if it exists.
 * @param {string} inputFile Path to the to compressed input file.
 * @param {string} outputFile Path to store the resulting decompressed file.
 * @param {CallbackFunction} [callback] Function to be executed on task completion. Follows Node.js (err, result) pattern, being result equal to outputFile when succeeded.
 * @returns {void}None
 */
export declare function decompress(inputFile: string, outputFile: string, callback?: CallbackFunction): void;
/**
 * Decompress inputFile to stream on callback using zstd
 * @param {string} inputFile Path to the to compressed input file.
 * @param {CallbackFunction} [callback] Function to be executed on task initialization. Follows Node.js (err, result) pattern, being result an EventEmitter that can emit the following events:
 * - error: Emitted when an error involving streams or file decompression occurred. Error message is provided.
 * - data: Emitted when a chunk of decompressed data is generated. Data is obviously provided.
 * - end: Emitted when decompression ended and all data events have been emitted.
 * @returns {void}None
 */
export declare function decompressionStreamFromFile(inputFile: string, callback?: CallbackFunction): void;
/**
 * Decompress inputFile to stream using zstd -  get output on callback with eventEmitter
 * @param {string}inputFile Path to the to compressed input file.
 * @param {fs.WriteStream}writableStream Node.js Stream where to output decompressed data.
 * @param {CallbackFunction}[callback] Function to be executed on task initialization. Follows Node.js (err, result) pattern, being result an EventEmitter that can emit the following events:
 * - error: Emitted when an error involving streams or file decompression occurred. Error message is provided.
 * - finish: Emitted when finished writting decompressed data to output stream.
 * @returns {void}None
 */
export declare function decompressFileToStream(inputFile: string, writableStream: fs.WriteStream, callback?: CallbackFunction): void;
export {};
//# sourceMappingURL=index.d.ts.map