"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompressFileToStream = exports.decompressionStreamFromFile = exports.decompress = exports.compressStreamToFile = exports.compress = void 0;
const cp = __importStar(require("child_process"));
const events_1 = __importDefault(require("events"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zstdBin = process.platform === "win32"
    ? process.arch === "x64"
        ? "zstd64.exe"
        : "zstd32.exe"
    : process.platform === "darwin"
        ? "zstd.darwin"
        : "zstd.linux64";
const zstdBinPath = path.resolve(__dirname, "bin", zstdBin);
function compress(inputFile, outputFile, compLevel = 3, callback) {
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
            if (callback)
                callback(new Error("Input file is not readable."));
            return;
        }
        fs.access(path.dirname(outputFile), fs.constants.W_OK, (err) => {
            if (err) {
                if (callback)
                    callback(new Error("Output file is not writable."));
                return;
            }
            fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
                if (err) {
                    if (callback)
                        callback(new Error("Zstd binary is not executable."));
                    return;
                }
                cp.execFile(zstdBinPath, ["-f", "-" + compLevel, inputFile, "-o", outputFile], (err, stdout, _) => {
                    if (err) {
                        if (callback)
                            callback(err);
                        return;
                    }
                    else if (stdout) {
                        if (callback)
                            callback(new Error(stdout));
                        return;
                    }
                    if (callback)
                        callback(null, outputFile);
                });
            });
        });
    });
}
exports.compress = compress;
function compressStreamToFile(readableStream, outputFile, compLevel = 3, callback) {
    if (compLevel < 1 || compLevel > 22) {
        compLevel = 3;
    }
    const eventEmitter = new events_1.default.EventEmitter();
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
                }
                else if (code != 0) {
                    eventEmitter.emit("error", new Error("Unexpected stream close. Code " + code + ". Signal " + signal));
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
exports.compressStreamToFile = compressStreamToFile;
function decompress(inputFile, outputFile, callback) {
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
                cp.execFile(zstdBinPath, ["-f", "-d", inputFile, "-o", outputFile], (err, stdout, _) => {
                    if (err) {
                        if (callback) {
                            callback(err);
                        }
                        return;
                    }
                    else if (stdout) {
                        if (callback) {
                            callback(new Error(stdout));
                        }
                        return;
                    }
                    if (callback) {
                        callback(null, outputFile);
                    }
                });
            });
        });
    });
}
exports.decompress = decompress;
function decompressionStreamFromFile(inputFile, callback) {
    inputFile = path.resolve(inputFile);
    const eventEmitter = new events_1.default.EventEmitter();
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
                }
                else if (code == 39) {
                    eventEmitter.emit("error", new Error("Not in zstd format"));
                }
                else {
                    eventEmitter.emit("error", new Error("Unexpected stream close. Code " + code + ". Signal" + signal));
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
exports.decompressionStreamFromFile = decompressionStreamFromFile;
function decompressFileToStream(inputFile, writableStream, callback) {
    inputFile = path.resolve(inputFile);
    const eventEmitter = new events_1.default.EventEmitter();
    fs.access(inputFile, fs.constants.R_OK, (err) => {
        if (err) {
            if (callback)
                callback(new Error("Input file is not readable."));
            return;
        }
        fs.access(zstdBinPath, fs.constants.R_OK | fs.constants.X_OK, (err) => {
            if (err) {
                if (callback)
                    callback(new Error("Zstd binary is not executable."));
                return;
            }
            let exitCode;
            let finished = false;
            const options = ["-d", inputFile, "-c"];
            const proc = cp.spawn(zstdBinPath, options);
            proc.stdout.pipe(writableStream);
            proc.on("exit", (code, signal) => {
                if (code == 39) {
                    eventEmitter.emit("error", new Error("Not in zstd format"));
                }
                else if (code != 0) {
                    eventEmitter.emit("error", new Error("Unexpected stream close. Code " + code + ". Signal " + signal));
                }
                else
                    exitCode = 0;
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
exports.decompressFileToStream = decompressFileToStream;
