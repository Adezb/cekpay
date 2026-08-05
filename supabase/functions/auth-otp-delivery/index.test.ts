import { assertEquals, assertNotEquals, assertMatch } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { generateAlphanumericPass, hashPass, normalizePhone } from "./index.ts";

Deno.test("Phone Normalization (normalizePhone)", () => {
  // Local 11-digit starting with 0
  assertEquals(normalizePhone("08031234567"), "2348031234567");

  // MSISDN format (234...)
  assertEquals(normalizePhone("2348031234567"), "2348031234567");

  // International format (+234...)
  assertEquals(normalizePhone("+2348031234567"), "2348031234567");

  // Phone with spaces, dashes, and parentheses
  assertEquals(normalizePhone("0803-123 (4567)"), "2348031234567");

  // Invalid or empty phone numbers return empty string
  assertEquals(normalizePhone(""), "");
  assertEquals(normalizePhone(null), "");
  assertEquals(normalizePhone("123"), ""); // Too short (< 7 digits)
  assertEquals(normalizePhone("abc"), "");
});

Deno.test("Alphanumeric Pass Code Generation (generateAlphanumericPass)", () => {
  const pass1 = generateAlphanumericPass(6);
  const pass2 = generateAlphanumericPass(6);

  // Length check
  assertEquals(pass1.length, 6);
  assertEquals(pass2.length, 6);

  // Matches allowed charset: uppercase A-Z and digits 2-9 excluding O, 0, I, 1
  const allowedPattern = /^[A-Z2-9]+$/;
  assertMatch(pass1, allowedPattern);
  assertMatch(pass2, allowedPattern);

  // Ensure ambiguous characters (0, O, 1, I) are not present
  assertEquals(pass1.includes('0'), false);
  assertEquals(pass1.includes('O'), false);
  assertEquals(pass1.includes('1'), false);
  assertEquals(pass1.includes('I'), false);

  // Uniqueness check (PRNG randomness)
  assertNotEquals(pass1, pass2);
});

Deno.test("Pass Code SHA-256 Hashing (hashPass)", async () => {
  const hash1 = await hashPass("A2B3C4");
  const hash2 = await hashPass("a2b3c4");
  const hash3 = await hashPass(" A2B3C4 ");

  // Hashing should produce 64-character hex string
  assertEquals(hash1.length, 64);

  // Case-insensitive and trimmed hashing consistency
  assertEquals(hash1, hash2);
  assertEquals(hash1, hash3);

  // Different code produces different hash
  const hashDifferent = await hashPass("X9Y8Z7");
  assertNotEquals(hash1, hashDifferent);
});

Deno.test("Third-Party API Isolation (Fetch Mock Guard)", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  // Mock global fetch to intercept third-party calls
  globalThis.fetch = (..._args: any[]): Promise<Response> => {
    fetchCalled = true;
    return Promise.reject(new Error("External network calls isolated in unit test"));
  };

  try {
    // Normalization & code generation do not initiate external network calls
    const msisdn = normalizePhone("08031234567");
    const code = generateAlphanumericPass(6);
    const hash = await hashPass(code);

    assertEquals(msisdn, "2348031234567");
    assertEquals(code.length, 6);
    assertEquals(hash.length, 64);
    assertEquals(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
