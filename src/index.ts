import * as cp from "child_process";
import { default as EventEmitter, default as events } from "events";
import * as fs from "fs";
import * as path from "path";

const zstdBin: string =
  process.platform === "win32"
    ? process.arch === "x64"
      ? "zstd64.exe"
      : "zstd32.exe"
    : process.platform === "darwin"
    ? "zstd.darwin"
    : "zstd.linux64";

const zstdBinPath: string = path.resolve(__dirname, "bin", zstdBin);

type CallbackFunction = (
  err: Error | null,
  res?: string | EventEmitter
) => any | void;

/**
 * Compress inputFile by compLevel to outputFile using zstd
 * @param {string} inputFile Path to the to file to be compressed - can be relative or absolute
 * @param {string} outputFile Path to store the resulting compressed file - can be relative or absolute
 * @param {number} [compLevel=3] Compression - int between 1 and 22; [default=3]
 * @param {CallbackFunction} [callback] Optional Callback Function to be executed on task completion. Follows Node.js (err, result) pattern, being result equal to outputFile when succeeded.
 * @returns {void}None
 */
export function compress(
  inputFile: string,
  outputFile: string,
  compLevel: number = 3,
  callback?: CallbackFunction
): void {
  inputFile = path.resolve(inputFile);
  outputFile = path.resolve(outputFile);

  if (inputFile === outputFile) {
    if (callback != undefined) {
      callback(new Error("Input and output files cannot be the same."));
    }
    return;
  }
  if (compLevel < 1 || compLevel > 22) {
    compLevel = 3;
  }

  fs.access(inputFile, fs.constants.R_OK, (err) => {
    if (err) {
      if (callback) callback(new Error("Input file is not readable."));
      return;
    }
    fs.access(path.dirname(outputFile), fs.constants.W_OK, (err) => {
      if (err) {
        if (callback) callback(new Error("Output file is not writable."));
        return;
      }
      fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
        if (err) {
          if (callback) callback(new Error("Zstd binary is not executable."));
          return;
        }
        cp.execFile(
          zstdBinPath,
          ["-f", "-" + compLevel, inputFile, "-o", outputFile],
          (err, stdout, _) => {
            if (err) {
              if (callback) callback(err);
              return;
            } else if (stdout) {
              if (callback) callback(new Error(stdout));
              return;
            }
            if (callback) callback(null, outputFile);
          }
        );
      });
    });
  });
}

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
export function compressStreamToFile(
  readableStream: fs.ReadStream,
  outputFile: string,
  compLevel: number = 3,
  callback?: CallbackFunction
): void {
  if (compLevel < 1 || compLevel > 22) {
    compLevel = 3;
  }
  const eventEmitter = new events.EventEmitter();
  fs.access(path.dirname(outputFile), fs.constants.W_OK, (err) => {
    if (err) {
      if (callback) {
        callback(new Error("Output file is not writable."));
      }
      return;
    }
    fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
      if (err) {
        if (callback) {
          callback(new Error("Zstd binary is not executable."));
        }
        return;
      }
      const proc = cp.spawn(zstdBinPath, ["-f", "-o", outputFile]);
      readableStream.pipe(proc.stdin);
      readableStream.on("error", (err) => {
        proc.kill();
        eventEmitter.emit("error", err);
      });
      proc.on("exit", (code, signal) => {
        if (code == 0) {
          eventEmitter.emit("end");
        } else if (code != 0) {
          eventEmitter.emit(
            "error",
            new Error(
              "Unexpected stream close. Code " + code + ". Signal " + signal
            )
          );
        }
        proc.removeAllListeners("error");
      });
      proc.on("error", (err) => {
        eventEmitter.emit("error", err);
        proc.removeAllListeners("exit");
      });
      if (callback) {
        callback(null, eventEmitter);
      }
    });
  });
}

/**
 * Decompress inputFile to outputFile using zstd - call callback function upon completion
 * * NOTE: Input and output files should be different. Output file is overwritten if it exists.
 * @param {string} inputFile Path to the to compressed input file.
 * @param {string} outputFile Path to store the resulting decompressed file.
 * @param {CallbackFunction} [callback] Function to be executed on task completion. Follows Node.js (err, result) pattern, being result equal to outputFile when succeeded.
 * @returns {void}None
 */
export function decompress(
  inputFile: string,
  outputFile: string,
  callback?: CallbackFunction
): void {
  inputFile = path.resolve(inputFile);
  outputFile = path.resolve(outputFile);
  if (inputFile === outputFile) {
    if (callback) {
      callback(new Error("Input and output files cannot be the same."));
    }
    return;
  }
  fs.access(inputFile, fs.constants.R_OK, (err) => {
    if (err) {
      if (callback) {
        callback(new Error("Input file is not readable."));
      }
      return;
    }
    fs.access(path.dirname(outputFile), fs.constants.W_OK, (err) => {
      if (err) {
        if (callback) {
          callback(new Error("Output file is not writable."));
        }
        return;
      }
      fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
        if (err) {
          if (callback) {
            callback(new Error("Zstd binary is not executable."));
          }
          return;
        }
        cp.execFile(
          zstdBinPath,
          ["-f", "-d", inputFile, "-o", outputFile],
          (err, stdout, _) => {
            if (err) {
              if (callback) {
                callback(err);
              }
              return;
            } else if (stdout) {
              if (callback) {
                callback(new Error(stdout));
              }
              return;
            }
            if (callback) {
              callback(null, outputFile);
            }
          }
        );
      });
    });
  });
}

/**
 * Decompress inputFile to stream on callback using zstd
 * @param {string} inputFile Path to the to compressed input file.
 * @param {CallbackFunction} [callback] Function to be executed on task initialization. Follows Node.js (err, result) pattern, being result an EventEmitter that can emit the following events:
 * - error: Emitted when an error involving streams or file decompression occurred. Error message is provided.
 * - data: Emitted when a chunk of decompressed data is generated. Data is obviously provided.
 * - end: Emitted when decompression ended and all data events have been emitted.
 * @returns {void}None
 */
export function decompressionStreamFromFile(
  inputFile: string,
  callback?: CallbackFunction
): void {
  inputFile = path.resolve(inputFile);
  const eventEmitter = new events.EventEmitter();
  fs.access(inputFile, fs.constants.R_OK, (err) => {
    if (err) {
      if (callback) {
        callback(new Error("Input file is not readable."));
      }
      return;
    }
    fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
      if (err) {
        if (callback) {
          callback(new Error("Zstd binary is not executable."));
        }
        return;
      }
      const proc = cp.spawn(zstdBinPath, ["-d", inputFile, "-c"]);
      proc.stdout.on("data", (data) => {
        eventEmitter.emit("data", data);
      });

      proc.once("exit", (code, signal) => {
        if (code == 0) {
          eventEmitter.emit("end");
        } else if (code == 39) {
          eventEmitter.emit("error", new Error("Not in zstd format"));
        } else {
          eventEmitter.emit(
            "error",
            new Error(
              "Unexpected stream close. Code " + code + ". Signal" + signal
            )
          );
        }
        proc.stdout.removeAllListeners("data");
        proc.removeAllListeners("error");
      });

      proc.once("error", (err) => {
        eventEmitter.emit("error", err);
        proc.stdout.removeAllListeners("data");
        proc.removeAllListeners("exit");
      });

      if (callback) {
        callback(null, eventEmitter);
      }
    });
  });
}

/**
 * Decompress inputFile to stream using zstd -  get output on callback with eventEmitter
 * @param {string}inputFile Path to the to compressed input file.
 * @param {fs.WriteStream}writableStream Node.js Stream where to output decompressed data.
 * @param {CallbackFunction}[callback] Function to be executed on task initialization. Follows Node.js (err, result) pattern, being result an EventEmitter that can emit the following events:
 * - error: Emitted when an error involving streams or file decompression occurred. Error message is provided.
 * - finish: Emitted when finished writting decompressed data to output stream.
 * @returns {void}None
 */
export function decompressFileToStream(
  inputFile: string,
  writableStream: fs.WriteStream,
  callback?: CallbackFunction
): void {
  inputFile = path.resolve(inputFile);
  const eventEmitter = new events.EventEmitter();
  fs.access(inputFile, fs.constants.R_OK, (err) => {
    if (err) {
      if (callback) {
        callback(new Error("Input file is not readable."));
      }
      return;
    }
    fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
      if (err) {
        if (callback) {
          callback(new Error("Zstd binary is not executable."));
        }
        return;
      }

      let exitCode: number;
      let finished: boolean = false;

      const options: string[] = ["-d", inputFile, "-c"];

      const proc = cp.spawn(zstdBinPath, options);

      proc.stdout.pipe(writableStream);

      proc.on("exit", (code, signal) => {
        if (code == 39) {
          eventEmitter.emit("error", new Error("Not in zstd format"));
        } else if (code != 0) {
          eventEmitter.emit(
            "error",
            new Error(
              "Unexpected stream close. Code " + code + ". Signal " + signal
            )
          );
        } else exitCode = 0;
        if (finished) {
          eventEmitter.emit("finish");
        }
        proc.removeAllListeners("error");
      });
      proc.on("error", (err) => {
        eventEmitter.emit("error", err);
        proc.removeAllListeners("exit");
      });
      writableStream.on("error", (err) => {
        eventEmitter.emit("error", err);
        proc.kill();
        writableStream.removeAllListeners("finish");
      });
      writableStream.on("finish", () => {
        finished = true;
        if (exitCode == 0) {
          eventEmitter.emit("finish");
        }
        writableStream.removeAllListeners("error");
      });
      if (callback) {
        callback(null, eventEmitter);
      }
    });
  });
}
