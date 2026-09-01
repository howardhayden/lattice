#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createEngine, verifyReceipt, verifyResult } from "./engine.ts";
import { FailureCode, LatticeError } from "./errors.ts";

const USAGE = "Usage: lre <realize|lint|verify> <json-file|->";

function invalidInput(message, details = {}) {
  return new LatticeError(FailureCode.INVALID_INPUT, message, details);
}

function readSource(location) {
  if (typeof location !== "string" || location.length === 0) {
    throw invalidInput("A JSON input file or '-' for standard input is required.", { usage: USAGE });
  }
  try {
    return location === "-" ? readFileSync(0, "utf8") : readFileSync(location, "utf8");
  } catch (error) {
    throw invalidInput("The JSON input could not be read.", {
      input: location,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function parseSource(location) {
  const text = readSource(location);
  if (!text.trim()) throw invalidInput("The JSON input is empty.", { input: location });
  try {
    return JSON.parse(text);
  } catch (error) {
    throw invalidInput("The input is not valid JSON.", {
      input: location,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function verificationTarget(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidInput("Verification input must be a result or derivation receipt object.");
  }
  if (Object.hasOwn(value, "receipt") && Object.hasOwn(value, "outputs")) return "result";
  if (Object.hasOwn(value, "derivationDigest") && Object.hasOwn(value, "schemaVersion")) return "receipt";
  throw invalidInput("Verification input is neither a realization result nor a derivation receipt.");
}

export function runCli(argv = process.argv.slice(2)) {
  if (!Array.isArray(argv) || argv.length !== 2) {
    throw invalidInput("Exactly one command and one JSON input are required.", { usage: USAGE });
  }
  const [command, location] = argv;
  if (!new Set(["realize", "lint", "verify"]).has(command)) {
    throw invalidInput("Unknown command.", { command, usage: USAGE });
  }
  const input = parseSource(location);
  if (command === "realize") return createEngine().realize(input);
  if (command === "lint") return createEngine().lint(input);
  return verificationTarget(input) === "result" ? verifyResult(input) : verifyReceipt(input);
}

function serializableError(error) {
  if (error instanceof LatticeError) {
    return {
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }
  return {
    error: {
      name: "LatticeError",
      code: FailureCode.INVALID_INPUT,
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
      details: {}
    }
  };
}

try {
  const result = runCli();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify(serializableError(error), null, 2)}\n`);
  process.exitCode = 1;
}
