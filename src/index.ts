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

export function decompressFileToStream(
  inputFile: string,
  writableStream: fs.WriteStream,
  callback?: CallbackFunction
): void {
  inputFile = path.resolve(inputFile);
  const eventEmitter = new events.EventEmitter();
  fs.access(inputFile, fs.constants.R_OK, (err) => {
    if (err) {
      if (callback) callback(new Error("Input file is not readable."));
      return;
    }
    fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
      if (err) {
        if (callback) callback(new Error("Zstd binary is not executable."));
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
